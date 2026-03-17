package com.himanshu.loadlens.dto.response;

import java.time.Instant;

public record MetricSnapshot(
    Long planId,
    Instant timestamp,
    double p50,
    double p95,
    long requestsPerSecond,
    double errorRate,
    int activeVirtualUsers
) {}
