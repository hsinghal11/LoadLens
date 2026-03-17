package com.himanshu.loadlens.services.impl;

import com.himanshu.loadlens.dto.response.CompareResponse;
import com.himanshu.loadlens.dto.response.MetricSnapshot;
import com.himanshu.loadlens.dto.response.RunResultResponse;
import com.himanshu.loadlens.entity.RunResult;
import com.himanshu.loadlens.entity.TestPlan;
import com.himanshu.loadlens.exception.PlanNotFoundException;
import com.himanshu.loadlens.exception.UnauthorizedAccessException;
import com.himanshu.loadlens.repository.RunResultRepository;
import com.himanshu.loadlens.repository.TestPlanRepository;
import com.himanshu.loadlens.services.RunResultService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RunResultServiceImpl implements RunResultService {

    private final RunResultRepository runResultRepository;
    private final TestPlanRepository testPlanRepository;

    @Override
    @Transactional
    public RunResultResponse saveResult(Long planId, MetricSnapshot snapshot, long durationSeconds) {
        TestPlan plan = testPlanRepository.findById(planId)
                .orElseThrow(() -> new PlanNotFoundException("Plan not found"));

        // Use the MetricSnapshot logic, but since we need total requests, let's derive it or assume it's passed differently. 
        // For simplicity, we calculate total from rps * duration (since rps here is an approx for the snapshot, or the executor passed the total in RPS field temporarily).
        // Actually, to be accurate, we'll store what we get from the snapshot.
        long totalReqs = snapshot.requestsPerSecond() * durationSeconds; // Approximation if snapshot RPS is avg
        long errs = (long) ((snapshot.errorRate() / 100.0) * totalReqs);

        RunResult result = new RunResult();
        result.setTestPlan(plan);
        result.setStartedAt(LocalDateTime.now().minusSeconds(durationSeconds));
        result.setCompletedAt(LocalDateTime.now());
        result.setDurationSeconds((int) durationSeconds);
        result.setP50Latency(snapshot.p50());
        result.setP95Latency(snapshot.p95());
        result.setAvgRps(snapshot.requestsPerSecond());
        result.setTotalRequests(totalReqs);
        result.setErrorCount(errs);

        RunResult saved = runResultRepository.save(result);
        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RunResultResponse> getRunsForPlan(Long planId, Long userId) {
        TestPlan plan = testPlanRepository.findByIdAndUserId(planId, userId)
                .orElseThrow(() -> new UnauthorizedAccessException("Not authorized or plan not found"));

        return runResultRepository.findAllByTestPlanIdOrderByStartedAtDesc(plan.getId())
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public RunResultResponse getRunById(Long runId, Long userId) {
        RunResult result = runResultRepository.findById(runId)
                .orElseThrow(() -> new PlanNotFoundException("Run result not found"));

        if (!result.getTestPlan().getUser().getId().equals(userId)) {
            throw new UnauthorizedAccessException("Not authorized to view this run result");
        }

        return toResponse(result);
    }

    @Override
    @Transactional(readOnly = true)
    public CompareResponse compareRuns(Long runId1, Long runId2, Long userId) {
        RunResultResponse runA = getRunById(runId1, userId);
        RunResultResponse runB = getRunById(runId2, userId);

        CompareResponse.Delta delta = new CompareResponse.Delta(
                runB.p95Latency() - runA.p95Latency(),
                runB.p50Latency() - runA.p50Latency(),
                runB.avgRps() - runA.avgRps(),
                runB.errorRate() - runA.errorRate()
        );

        return new CompareResponse(runA, runB, delta);
    }

    private RunResultResponse toResponse(RunResult run) {
        double errorRate = run.getTotalRequests() > 0 ? ((double) run.getErrorCount() / run.getTotalRequests()) * 100 : 0.0;
        return new RunResultResponse(
                run.getId(),
                run.getStartedAt(),
                run.getCompletedAt(),
                run.getTotalRequests(),
                run.getErrorCount(),
                run.getP50Latency(),
                run.getP95Latency(),
                run.getAvgRps(),
                errorRate,
                run.getDurationSeconds()
        );
    }
}
