package com.himanshu.loadlens.services;

import com.himanshu.loadlens.dto.request.CreatePlanRequest;
import com.himanshu.loadlens.dto.request.UpdatePlanRequest;
import com.himanshu.loadlens.dto.response.TestPlanResponse;

import java.util.List;

public interface TestPlanService {
    TestPlanResponse createPlan(CreatePlanRequest request, Long userId);
    List<TestPlanResponse> getPlansForUser(Long userId);
    TestPlanResponse getPlanById(Long planId, Long userId);
    TestPlanResponse updatePlan(Long planId, UpdatePlanRequest request, Long userId);
    void deletePlan(Long planId, Long userId);
}
