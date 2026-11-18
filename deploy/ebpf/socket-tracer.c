// SPDX-License-Identifier: (LGPL-2.1 OR BSD-2-Clause)
/* Copyright (c) 2026 CodePulse Systems - Kernel Observability */

#include "vmlinux.h"
#include <bpf/bpf_helpers.h>
#include <bpf/bpf_core_read.h>
#include <bpf/bpf_tracing.h>
#include <bpf/bpf_endian.h>

char LICENSE[] SEC("license") = "Dual BSD/GPL";

#define AF_INET  2
#define AF_INET6 10
#define TCP_ESTABLISHED 1
#define TCP_SYN_SENT    2
#define TCP_CLOSE       7

/* Target service ports for microservice latency monitoring */
#define PORT_POSTGRES 5432
#define PORT_REDIS    6379
#define PORT_NESTJS   3001

/* Event structure passed to userspace via BPF ring buffer */
struct tcp_event_t {
    __u32 saddr;
    __u32 daddr;
    __u16 sport;
    __u16 dport;
    __u64 latency_us;
    __u32 retransmits;
    __u32 drops;
    __u32 pid;
    char  comm[16];
    __u8  family;
    __u8  old_state;
    __u8  new_state;
    __u8  pad;
};

/* BPF ring buffer for high-throughput, low-overhead event streaming */
struct {
    __uint(type, BPF_MAP_TYPE_RINGBUF);
    __uint(max_entries, 256 * 1024 /* 256 KB */);
} events SEC(".maps");

/* Hash map tracking TCP handshake start timestamp per socket */
struct {
    __uint(type, BPF_MAP_TYPE_HASH);
    __uint(max_entries, 65536);
    __type(key, struct sock *);
    __type(value, __u64);
} start_times SEC(".maps");

/* Metrics aggregation maps for in-kernel histogram & retransmission rate */
struct {
    __uint(type, BPF_MAP_TYPE_PERCPU_ARRAY);
    __uint(max_entries, 16);
    __type(key, __u32);
    __type(value, __u64);
} retransmit_counters SEC(".maps");

struct {
    __uint(type, BPF_MAP_TYPE_PERCPU_ARRAY);
    __uint(max_entries, 16);
    __type(key, __u32);
    __type(value, __u64);
} drop_counters SEC(".maps");

static __always_inline bool is_monitored_port(__u16 sport, __u16 dport) {
    return (sport == PORT_POSTGRES || dport == PORT_POSTGRES ||
            sport == PORT_REDIS    || dport == PORT_REDIS    ||
            sport == PORT_NESTJS   || dport == PORT_NESTJS);
}

/*
 * Tracepoint: sock:inet_sock_set_state
 * Hooks into TCP state transitions (TCP_SYN_SENT -> TCP_ESTABLISHED)
 * Measures exact connection establishment latency in microseconds.
 */
SEC("tracepoint/sock/inet_sock_set_state")
int handle_sock_set_state(struct trace_event_raw_inet_sock_set_state *ctx) {
    struct sock *sk = (struct sock *)ctx->skaddr;
    int oldstate = ctx->oldstate;
    int newstate = ctx->newstate;
    __u16 sport = ctx->sport;
    __u16 dport = ctx->dport;

    if (!is_monitored_port(sport, dport)) {
        return 0;
    }

    __u64 now = bpf_ktime_get_ns();

    // 1. Connection initiation (SYN_SENT): Record start timestamp
    if (newstate == TCP_SYN_SENT) {
        bpf_map_update_elem(&start_times, &sk, &now, BPF_ANY);
        return 0;
    }

    // 2. Handshake established: Calculate connection latency
    if (newstate == TCP_ESTABLISHED && oldstate == TCP_SYN_SENT) {
        __u64 *start_ts = bpf_map_lookup_elem(&start_times, &sk);
        if (!start_ts) {
            return 0;
        }

        __u64 latency_us = (now - *start_ts) / 1000;
        bpf_map_delete_elem(&start_times, &sk);

        // Reserve space in BPF ring buffer
        struct tcp_event_t *event = bpf_ringbuf_reserve(&events, sizeof(*event), 0);
        if (!event) {
            return 0;
        }

        event->saddr = ctx->saddr;
        event->daddr = ctx->daddr;
        event->sport = sport;
        event->dport = dport;
        event->latency_us = latency_us;
        event->retransmits = 0;
        event->drops = 0;
        event->pid = bpf_get_current_pid_tgid() >> 32;
        event->family = ctx->family;
        event->old_state = oldstate;
        event->new_state = newstate;
        event->pad = 0;
        bpf_get_current_comm(&event->comm, sizeof(event->comm));

        bpf_ringbuf_submit(event, 0);
        return 0;
    }

    // 3. Socket close cleanup
    if (newstate == TCP_CLOSE) {
        bpf_map_delete_elem(&start_times, &sk);
    }

    return 0;
}

/*
 * Tracepoint: tcp:tcp_retransmit_skb
 * Hooks into TCP packet retransmissions to detect microsecond network stalls.
 */
SEC("tracepoint/tcp/tcp_retransmit_skb")
int handle_tcp_retransmit(struct trace_event_raw_tcp_event_sk *ctx) {
    struct sock *sk = (struct sock *)ctx->skaddr;
    __u16 sport = ctx->sport;
    __u16 dport = ctx->dport;

    if (!is_monitored_port(sport, dport)) {
        return 0;
    }

    __u32 key = 0;
    if (sport == PORT_POSTGRES || dport == PORT_POSTGRES) key = 1; // PostgreSQL
    else if (sport == PORT_REDIS || dport == PORT_REDIS) key = 2; // Redis
    else if (sport == PORT_NESTJS || dport == PORT_NESTJS) key = 3; // NestJS

    __u64 *count = bpf_map_lookup_elem(&retransmit_counters, &key);
    if (count) {
        __sync_fetch_and_add(count, 1);
    }

    // Stream retransmit event
    struct tcp_event_t *event = bpf_ringbuf_reserve(&events, sizeof(*event), 0);
    if (!event) {
        return 0;
    }

    event->saddr = ctx->saddr;
    event->daddr = ctx->daddr;
    event->sport = sport;
    event->dport = dport;
    event->latency_us = 0;
    event->retransmits = 1;
    event->drops = 0;
    event->pid = bpf_get_current_pid_tgid() >> 32;
    event->family = ctx->family;
    event->old_state = 0;
    event->new_state = 0;
    event->pad = 0;
    bpf_get_current_comm(&event->comm, sizeof(event->comm));

    bpf_ringbuf_submit(event, 0);
    return 0;
}

/*
 * Tracepoint: sock:sock_rcv_drop
 * Measures kernel socket buffer queue drops before user-space read.
 */
SEC("tracepoint/sock/sock_rcv_drop")
int handle_sock_rcv_drop(void *ctx) {
    __u32 key = 0; // Total drops
    __u64 *count = bpf_map_lookup_elem(&drop_counters, &key);
    if (count) {
        __sync_fetch_and_add(count, 1);
    }
    return 0;
}
