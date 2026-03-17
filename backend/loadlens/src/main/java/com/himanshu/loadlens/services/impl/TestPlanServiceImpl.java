package com.himanshu.loadlens.services.impl;

import com.himanshu.loadlens.dto.request.CreatePlanRequest;
import com.himanshu.loadlens.dto.request.UpdatePlanRequest;
import com.himanshu.loadlens.dto.response.TestPlanResponse;
import com.himanshu.loadlens.entity.RunStatus;
import com.himanshu.loadlens.entity.TestPlan;
import com.himanshu.loadlens.entity.User;
import com.himanshu.loadlens.exception.PlanNotFoundException;
import com.himanshu.loadlens.exception.UnauthorizedAccessException;
import com.himanshu.loadlens.repository.TestPlanRepository;
import com.himanshu.loadlens.repository.UserRepository;
import com.himanshu.loadlens.services.TestPlanService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TestPlanServiceImpl implements TestPlanService {

    private final TestPlanRepository testPlanRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public TestPlanResponse createPlan(CreatePlanRequest request, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedAccessException("User not found"));

        TestPlan plan = new TestPlan();
        plan.setName(request.name());
        plan.setTargetUrl(request.targetUrl());
        plan.setVirtualUsers(request.virtualUsers());
        plan.setDurationSeconds(request.durationSeconds());
        plan.setRampUpSeconds(request.rampUpSeconds());
        plan.setUser(user);
        plan.setStatus(RunStatus.CREATED);

        TestPlan saved = testPlanRepository.save(plan);
        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TestPlanResponse> getPlansForUser(Long userId) {
        return testPlanRepository.findAllByUserIdOrderByCreatedAtDesc(userId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public TestPlanResponse getPlanById(Long planId, Long userId) {
        TestPlan plan = testPlanRepository.findById(planId)
                .orElseThrow(() -> new PlanNotFoundException("Plan not found"));

        if (!plan.getUser().getId().equals(userId)) {
            throw new UnauthorizedAccessException("Not authorized to view this plan");
        }

        return toResponse(plan);
    }

    @Override
    @Transactional
    public TestPlanResponse updatePlan(Long planId, UpdatePlanRequest request, Long userId) {
        TestPlan plan = testPlanRepository.findById(planId)
                .orElseThrow(() -> new PlanNotFoundException("Plan not found"));

        if (!plan.getUser().getId().equals(userId)) {
            throw new UnauthorizedAccessException("Not authorized to update this plan");
        }

        if (plan.getStatus() == RunStatus.RUNNING) {
            throw new IllegalStateException("Cannot update a plan while it is RUNNING");
        }

        plan.setName(request.name());
        plan.setTargetUrl(request.targetUrl());
        plan.setVirtualUsers(request.virtualUsers());
        plan.setDurationSeconds(request.durationSeconds());
        plan.setRampUpSeconds(request.rampUpSeconds());

        TestPlan saved = testPlanRepository.save(plan);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public void deletePlan(Long planId, Long userId) {
        TestPlan plan = testPlanRepository.findById(planId)
                .orElseThrow(() -> new PlanNotFoundException("Plan not found"));

        if (!plan.getUser().getId().equals(userId)) {
            throw new UnauthorizedAccessException("Not authorized to delete this plan");
        }

        if (plan.getStatus() == RunStatus.RUNNING) {
            throw new IllegalStateException("Cannot delete a plan while it is RUNNING");
        }

        testPlanRepository.delete(plan);
    }

    private TestPlanResponse toResponse(TestPlan plan) {
        return new TestPlanResponse(
                plan.getId(),
                plan.getName(),
                plan.getTargetUrl(),
                plan.getVirtualUsers(),
                plan.getDurationSeconds(),
                plan.getRampUpSeconds(),
                plan.getStatus().name(),
                plan.getCreatedAt(),
                plan.getUpdatedAt()
        );
    }
}
