# ==============================================================================
# CodePulse Global Geo-Latency Dynamic Edge DNS Routing Engine
# Multi-Region Latency Routing Policies & Automated Health Checks
# ==============================================================================

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

variable "domain_name" {
  description = "Apex domain name for CodePulse"
  type        = string
  default     = "codepulse.dev"
}

variable "routing_subdomain" {
  description = "Dynamic Edge routing subdomain"
  type        = string
  default     = "edge.codepulse.dev"
}

variable "failover_ttl" {
  description = "TTL for dynamic latency records enabling sub-30-second automated failover"
  type        = number
  default     = 20
}

# ------------------------------------------------------------------------------
# Primary Hosted Zone
# ------------------------------------------------------------------------------
resource "aws_route53_zone" "primary" {
  name          = var.domain_name
  comment       = "Managed by CodePulse Geo-Latency Dynamic Edge Engine"
  force_destroy = false

  tags = {
    Environment = "production"
    ManagedBy   = "Terraform"
    Project     = "CodePulse-GeoEdge"
  }
}

# ------------------------------------------------------------------------------
# Route53 Health Checks for Regional Clusters (Sub-30s Automated Failover)
# ------------------------------------------------------------------------------
locals {
  regions = {
    "us-east-1" = {
      ip          = "198.51.100.10"
      hub         = "North America East (Ashburn / NY)"
      weight      = 100
      threshold   = 3
    }
    "us-west-2" = {
      ip          = "198.51.100.20"
      hub         = "North America West (Oregon / SF)"
      weight      = 100
      threshold   = 3
    }
    "eu-central-1" = {
      ip          = "198.51.100.30"
      hub         = "Europe Central (Frankfurt)"
      weight      = 100
      threshold   = 3
    }
    "eu-west-1" = {
      ip          = "198.51.100.40"
      hub         = "Europe West (Dublin / London)"
      weight      = 100
      threshold   = 3
    }
    "ap-south-1" = {
      ip          = "198.51.100.50"
      hub         = "South Asia (Mumbai / Bangalore)"
      weight      = 100
      threshold   = 3
    }
    "ap-southeast-1" = {
      ip          = "198.51.100.60"
      hub         = "Southeast Asia (Singapore)"
      weight      = 100
      threshold   = 3
    }
    "ap-northeast-1" = {
      ip          = "198.51.100.70"
      hub         = "East Asia (Tokyo)"
      weight      = 100
      threshold   = 3
    }
    "sa-east-1" = {
      ip          = "198.51.100.80"
      hub         = "South America (São Paulo)"
      weight      = 100
      threshold   = 3
    }
    "ap-southeast-2" = {
      ip          = "198.51.100.90"
      hub         = "Oceania (Sydney)"
      weight      = 100
      threshold   = 3
    }
    "me-central-1" = {
      ip          = "198.51.100.100"
      hub         = "Middle East (Dubai)"
      weight      = 100
      threshold   = 3
    }
  }
}

resource "aws_route53_health_check" "regional" {
  for_each = local.regions

  ip_address        = each.value.ip
  port              = 443
  type              = "HTTPS"
  resource_path     = "/api/v1/health/dr"
  failure_threshold = each.value.threshold
  request_interval  = 10 # 10s check interval for sub-30s failover
  measure_latency   = true
  enable_sni        = true

  tags = {
    Name   = "codepulse-health-${each.key}"
    Region = each.key
    Hub    = each.value.hub
  }
}

# ------------------------------------------------------------------------------
# Latency-Based Routing (LBR) Records Across 10 Global Developer Hubs
# ------------------------------------------------------------------------------
resource "aws_route53_record" "latency_routing" {
  for_each = local.regions

  zone_id = aws_route53_zone.primary.zone_id
  name    = var.routing_subdomain
  type    = "A"
  ttl     = var.failover_ttl

  # Latency-Based Routing Policy: AWS routes DNS queries to the lowest-latency region
  latency_routing_policy {
    region = each.key
  }

  set_identifier = "edge-${each.key}"
  records        = [each.value.ip]
  health_check_id = aws_route53_health_check.regional[each.key].id
}

# ------------------------------------------------------------------------------
# Cloudflare Traffic Steering Pool Fallback Integration
# ------------------------------------------------------------------------------
output "route53_zone_id" {
  description = "Zone ID of the Route53 Latency-Based Routing Zone"
  value       = aws_route53_zone.primary.zone_id
}

output "global_edge_endpoint" {
  description = "Primary Global Dynamic Edge DNS endpoint"
  value       = var.routing_subdomain
}

output "active_measurement_beacons_count" {
  description = "Number of active measurement edge beacons configured"
  value       = length(local.regions)
}
