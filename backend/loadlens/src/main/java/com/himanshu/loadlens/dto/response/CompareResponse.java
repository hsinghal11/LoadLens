package com.himanshu.loadlens.dto.response;

public record CompareResponse(
    RunResultResponse runA,
    RunResultResponse runB,
    Delta delta
) {
    public record Delta(
        double p95,
        double p50,
        double rps,
        double errorRate
    ) {}
}
