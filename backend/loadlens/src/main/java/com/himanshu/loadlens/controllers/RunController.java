package com.himanshu.loadlens.controllers;

import com.himanshu.loadlens.dto.response.CompareResponse;
import com.himanshu.loadlens.dto.response.RunResultResponse;
import com.himanshu.loadlens.entity.User;
import com.himanshu.loadlens.repository.UserRepository;
import com.himanshu.loadlens.services.RunResultService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/runs")
@RequiredArgsConstructor
public class RunController {
    
    private final RunResultService runResultService;
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

    @GetMapping("/plan/{planId}")
    public ResponseEntity<List<RunResultResponse>> getRunsForPlan(@PathVariable Long planId) {
        return ResponseEntity.ok(runResultService.getRunsForPlan(planId, getCurrentUserId()));
    }

    @GetMapping("/{runId}")
    public ResponseEntity<RunResultResponse> getRunById(@PathVariable Long runId) {
        return ResponseEntity.ok(runResultService.getRunById(runId, getCurrentUserId()));
    }

    @GetMapping("/compare")
    public ResponseEntity<CompareResponse> compareRuns(@RequestParam("run1") Long run1, @RequestParam("run2") Long run2) {
        return ResponseEntity.ok(runResultService.compareRuns(run1, run2, getCurrentUserId()));
    }
}
