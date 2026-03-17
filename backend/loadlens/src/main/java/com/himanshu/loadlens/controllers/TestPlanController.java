package com.himanshu.loadlens.controllers;

import com.himanshu.loadlens.dto.request.CreatePlanRequest;
import com.himanshu.loadlens.dto.request.UpdatePlanRequest;
import com.himanshu.loadlens.dto.response.TestPlanResponse;
import com.himanshu.loadlens.entity.TestPlan;
import com.himanshu.loadlens.entity.User;
import com.himanshu.loadlens.repository.TestPlanRepository;
import com.himanshu.loadlens.repository.UserRepository;
import com.himanshu.loadlens.services.LoadTestExecutor;
import com.himanshu.loadlens.services.TestPlanService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/plans")
@RequiredArgsConstructor
public class TestPlanController {

    private final TestPlanService testPlanService;
    private final LoadTestExecutor loadTestExecutor;
    private final TestPlanRepository testPlanRepository;
    private final UserRepository userRepository;

    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserDetails userDetails) {
            String email = userDetails.getUsername();
            User user = userRepository.findByEmail(email).orElseThrow(() -> new com.himanshu.loadlens.exception.UnauthorizedAccessException("User not found"));
            return user.getId();
        }
        if (auth != null && auth.getPrincipal() instanceof User user) {
            return user.getId();
        }
        throw new com.himanshu.loadlens.exception.UnauthorizedAccessException("User not authenticated");
    }

    @GetMapping
    public ResponseEntity<List<TestPlanResponse>> getPlansForUser() {
        return ResponseEntity.ok(testPlanService.getPlansForUser(getCurrentUserId()));
    }

    @PostMapping
    public ResponseEntity<TestPlanResponse> createPlan(@Valid @RequestBody CreatePlanRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(testPlanService.createPlan(request, getCurrentUserId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TestPlanResponse> getPlanById(@PathVariable Long id) {
        return ResponseEntity.ok(testPlanService.getPlanById(id, getCurrentUserId()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TestPlanResponse> updatePlan(@PathVariable Long id, @Valid @RequestBody UpdatePlanRequest request) {
        return ResponseEntity.ok(testPlanService.updatePlan(id, request, getCurrentUserId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePlan(@PathVariable Long id) {
        testPlanService.deletePlan(id, getCurrentUserId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/run")
    public ResponseEntity<Map<String, String>> startRun(@PathVariable Long id) {
        testPlanService.getPlanById(id, getCurrentUserId());
        TestPlan plan = testPlanRepository.findById(id).orElseThrow();
        loadTestExecutor.execute(plan);

        return ResponseEntity.status(HttpStatus.ACCEPTED).body(Map.of(
            "message", "Run started successfully",
            "planId", id.toString(),
            "status", "ACCEPTED"
        ));
    }

    @DeleteMapping("/{id}/run")
    public ResponseEntity<Map<String, String>> abortRun(@PathVariable Long id) {
        testPlanService.getPlanById(id, getCurrentUserId());
        
        TestPlan plan = testPlanRepository.findById(id).orElseThrow();
        plan.setStatus(com.himanshu.loadlens.entity.RunStatus.ABORTED);
        testPlanRepository.save(plan);
        return ResponseEntity.ok(Map.of("message", "Run aborted", "status", "ABORTED"));
    }
}
