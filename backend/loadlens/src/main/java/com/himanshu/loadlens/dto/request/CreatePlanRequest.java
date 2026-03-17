package com.himanshu.loadlens.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Builder;
import org.hibernate.validator.constraints.URL;

@Builder
public record CreatePlanRequest(
    @NotBlank String name,
    @NotBlank @URL String targetUrl,
    @Min(1) @Max(500) int virtualUsers,
    @Min(5) @Max(300) int durationSeconds,
    @Min(0) int rampUpSeconds
) {}
