// SPDX-License-Identifier: GPL-2.0 OR BSD-3-Clause
/*
 * CodePulse XDP Packet Filter & eBPF Rate Limiter
 * Enforces per-IP token bucket rate limiting and IP blacklisting directly in
 * the network driver (XDP) before packets reach the Linux network stack.
 */

#include <linux/bpf.h>
#include <linux/if_ether.h>
#include <linux/ip.h>
#include <linux/tcp.h>
#include <linux/udp.h>
#include <linux/in.h>
#include <bpf/bpf_helpers.h>
#include <bpf/bpf_endian.h>

#define MAX_TRACKED_IPS 65536
#define NSEC_PER_SEC 1000000000ULL

/* Rate limit state entry per IPv4 address */
struct rate_limit_entry {
    __u64 tokens;               /* Current available tokens */
    __u64 last_refill_ns;       /* Timestamp of last refill in nanoseconds */
    __u32 refill_rate_per_sec;  /* Refill rate (tokens per second) */
    __u32 burst_capacity;       /* Maximum token capacity */
};

/* Blacklist entry with expiration TTL */
struct blacklist_entry {
    __u64 blocked_until_ns;     /* Expiration time in ns */
    __u32 drop_count;           /* Counter of dropped packets */
    __u32 reason_code;          /* 1: DoS, 2: Abuse, 3: Manual */
};

/* Global telemetry counters indexed by stat type */
enum stat_type {
    STAT_TOTAL_PACKETS = 0,
    STAT_PASSED_PACKETS,
    STAT_DROPPED_BLACKLIST,
    STAT_DROPPED_RATE_LIMIT,
    STAT_NON_IP_PACKETS,
    STAT_PARSE_ERROR,
    STAT_MAX
};

/* BPF Hash Map: IPv4 -> Rate Limit State */
struct {
    __uint(type, BPF_MAP_TYPE_HASH);
    __uint(max_entries, MAX_TRACKED_IPS);
    __type(key, __u32);                     /* IPv4 address in network order */
    __type(value, struct rate_limit_entry);
} ip_rate_limits SEC(".maps");

/* BPF Hash Map: IPv4 -> Blacklist Entry */
struct {
    __uint(type, BPF_MAP_TYPE_HASH);
    __uint(max_entries, 16384);
    __type(key, __u32);                     /* IPv4 address */
    __type(value, struct blacklist_entry);
} blocked_ips SEC(".maps");

/* BPF Per-CPU Array: Telemetry Counters */
struct {
    __uint(type, BPF_MAP_TYPE_PERCPU_ARRAY);
    __uint(max_entries, STAT_MAX);
    __type(key, __u32);
    __type(value, __u64);
} telemetry_stats SEC(".maps");

static __always_inline void increment_stat(__u32 type) {
    __u64 *val = bpf_map_lookup_elem(&telemetry_stats, &type);
    if (val) {
        *val += 1;
    }
}

SEC("xdp")
int xdp_packet_filter(struct xdp_md *ctx) {
    void *data_end = (void *)(long)ctx->data_end;
    void *data = (void *)(long)ctx->data;
    __u64 now_ns = bpf_ktime_get_ns();

    increment_stat(STAT_TOTAL_PACKETS);

    /* Parse Ethernet header */
    struct ethhdr *eth = data;
    if ((void *)(eth + 1) > data_end) {
        increment_stat(STAT_PARSE_ERROR);
        return XDP_PASS;
    }

    /* Only inspect IPv4 traffic; pass ARP, IPv6, etc. to kernel */
    if (eth->h_proto != bpf_htons(ETH_P_IP)) {
        increment_stat(STAT_NON_IP_PACKETS);
        return XDP_PASS;
    }

    /* Parse IPv4 header */
    struct iphdr *ip = (void *)(eth + 1);
    if ((void *)(ip + 1) > data_end) {
        increment_stat(STAT_PARSE_ERROR);
        return XDP_PASS;
    }

    __u32 src_ip = ip->saddr;

    /* 1. Fast Path Check: Is IP explicitly blacklisted? */
    struct blacklist_entry *bl = bpf_map_lookup_elem(&blocked_ips, &src_ip);
    if (bl) {
        if (bl->blocked_until_ns > now_ns) {
            __sync_fetch_and_add(&bl->drop_count, 1);
            increment_stat(STAT_DROPPED_BLACKLIST);
            return XDP_DROP;
        } else {
            /* Blacklist expired, remove entry lazily */
            bpf_map_delete_elem(&blocked_ips, &src_ip);
        }
    }

    /* 2. Token Bucket Rate Limiting */
    struct rate_limit_entry *rl = bpf_map_lookup_elem(&ip_rate_limits, &src_ip);
    if (!rl) {
        /* Unregulated IP: pass through */
        increment_stat(STAT_PASSED_PACKETS);
        return XDP_PASS;
    }

    /* Compute elapsed time and refill tokens */
    __u64 elapsed_ns = now_ns - rl->last_refill_ns;
    if (elapsed_ns > 0) {
        __u64 new_tokens = (elapsed_ns * rl->refill_rate_per_sec) / NSEC_PER_SEC;
        if (new_tokens > 0) {
            rl->tokens = rl->tokens + new_tokens;
            if (rl->tokens > rl->burst_capacity) {
                rl->tokens = rl->burst_capacity;
            }
            rl->last_refill_ns = now_ns;
        }
    }

    /* Check if token available */
    if (rl->tokens >= 1) {
        rl->tokens -= 1;
        increment_stat(STAT_PASSED_PACKETS);
        return XDP_PASS;
    }

    /* Rate limit exceeded: drop instantly at NIC driver layer */
    increment_stat(STAT_DROPPED_RATE_LIMIT);
    return XDP_DROP;
}

char _license[] SEC("license") = "GPL";
