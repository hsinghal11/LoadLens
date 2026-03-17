package com.himanshu.loadlens.dto.response;

import java.time.LocalDateTime;

public record TestPlanResponse(
    Long id,
    String name,
    String targetUrl,
    int virtualUsers,
    int durationSeconds,
    int rampUpSeconds,
    String status,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
