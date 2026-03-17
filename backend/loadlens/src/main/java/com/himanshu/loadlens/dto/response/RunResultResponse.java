package com.himanshu.loadlens.dto.response;

import java.time.LocalDateTime;

public record RunResultResponse(
    Long id,
    LocalDateTime startedAt,
    LocalDateTime completedAt,
    long totalRequests,
    long errorCount,
    double p50Latency,
    double p95Latency,
    double avgRps,
    double errorRate,
    int durationSeconds
) {}
