package com.himanshu.loadlens.services;

import com.himanshu.loadlens.dto.response.CompareResponse;
import com.himanshu.loadlens.dto.response.MetricSnapshot;
import com.himanshu.loadlens.dto.response.RunResultResponse;

import java.util.List;

public interface RunResultService {
    RunResultResponse saveResult(Long planId, MetricSnapshot snapshot, long durationSeconds);
    List<RunResultResponse> getRunsForPlan(Long planId, Long userId);
    RunResultResponse getRunById(Long runId, Long userId);
    CompareResponse compareRuns(Long runId1, Long runId2, Long userId);
}
