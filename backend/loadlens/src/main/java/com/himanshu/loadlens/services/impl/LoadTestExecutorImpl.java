package com.himanshu.loadlens.services.impl;

import com.himanshu.loadlens.dto.response.MetricSnapshot;
import com.himanshu.loadlens.entity.RunStatus;
import com.himanshu.loadlens.entity.TestPlan;
import com.himanshu.loadlens.exception.RunAlreadyActiveException;
import com.himanshu.loadlens.repository.TestPlanRepository;
import com.himanshu.loadlens.services.LoadTestExecutor;
import com.himanshu.loadlens.services.MetricAggregator;
import com.himanshu.loadlens.services.RunResultService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

@Service
@Slf4j
public class LoadTestExecutorImpl implements LoadTestExecutor {

    private final TestPlanRepository testPlanRepository;
    private final RedisTemplate<String, String> redisTemplate;
    private final WebClient webClient;
    private final MetricAggregator metricAggregator;
    private final RunResultService runResultService;
    private final SimpMessagingTemplate messagingTemplate;

    public LoadTestExecutorImpl(TestPlanRepository testPlanRepository, RedisTemplate<String, String> redisTemplate, WebClient webClient, MetricAggregator metricAggregator, RunResultService runResultService, SimpMessagingTemplate messagingTemplate) {
        this.testPlanRepository = testPlanRepository;
        this.redisTemplate = redisTemplate;
        this.webClient = webClient;
        this.metricAggregator = metricAggregator;
        this.runResultService = runResultService;
        this.messagingTemplate = messagingTemplate;
    }

    @Override
    public void execute(TestPlan plan) {
        String redisKey = "active_runs";
        String planIdStr = plan.getId().toString();

        Boolean isMember = redisTemplate.opsForSet().isMember(redisKey, planIdStr);
        if (Boolean.TRUE.equals(isMember)) {
            throw new RunAlreadyActiveException("Run is already active for plan: " + plan.getId());
        }

        updateStatus(plan, RunStatus.RUNNING);

        redisTemplate.opsForSet().add(redisKey, planIdStr);
        redisTemplate.expire(redisKey, Duration.ofSeconds(plan.getDurationSeconds() + 60));

        // Submit coordinator task to virtual thread
        ExecutorService coordinatorTaskExecutor = Executors.newVirtualThreadPerTaskExecutor();
        coordinatorTaskExecutor.submit(() -> runLoadTest(plan, planIdStr, redisKey));
    }

    private void runLoadTest(TestPlan plan, String planIdStr, String redisKey) {
        try (ExecutorService vuExecutor = Executors.newVirtualThreadPerTaskExecutor()) {
            
            long endTimeMillis = System.currentTimeMillis() + (plan.getDurationSeconds() * 1000L);
            int totalVus = plan.getVirtualUsers();
            int rampUpSeconds = plan.getRampUpSeconds();
            String targetUrl = plan.getTargetUrl();

            List<Future<?>> futures = new ArrayList<>();

            if (rampUpSeconds > 0) {
                int vusPerSecond = Math.max(1, totalVus / rampUpSeconds);
                int launched = 0;
                
                for (int s = 0; s < rampUpSeconds && launched < totalVus; s++) {
                    int toLaunch = Math.min(vusPerSecond, totalVus - launched);
                    for (int i = 0; i < toLaunch; i++) {
                        futures.add(vuExecutor.submit(() -> vuLogic(plan.getId(), targetUrl, endTimeMillis)));
                    }
                    launched += toLaunch;
                    if (s < rampUpSeconds - 1 && launched < totalVus) {
                        try {
                            TimeUnit.SECONDS.sleep(1);
                        } catch (InterruptedException e) {
                            Thread.currentThread().interrupt();
                        }
                    }
                }
                while (launched < totalVus) {
                    futures.add(vuExecutor.submit(() -> vuLogic(plan.getId(), targetUrl, endTimeMillis)));
                    launched++;
                }

            } else {
                for (int i = 0; i < totalVus; i++) {
                    futures.add(vuExecutor.submit(() -> vuLogic(plan.getId(), targetUrl, endTimeMillis)));
                }
            }

            long timeRemaining = endTimeMillis - System.currentTimeMillis();
            if (timeRemaining > 0) {
                try {
                    TimeUnit.MILLISECONDS.sleep(timeRemaining);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            }

            updateStatus(plan, RunStatus.DRAINING);

            for (Future<?> f : futures) {
                try {
                    f.get();
                } catch (Exception ignored) {}
            }

            updateStatus(plan, RunStatus.COMPLETED);

            MetricSnapshot finalSnapshot = metricAggregator.snapshotAndReset(plan.getId());
            long totalReqs = metricAggregator.getTotalRequests(plan.getId());
            
            MetricSnapshot actualSnapshot = new MetricSnapshot(plan.getId(), finalSnapshot.timestamp(), finalSnapshot.p50(), finalSnapshot.p95(), (long) (totalReqs / (double) plan.getDurationSeconds()), finalSnapshot.errorRate(), finalSnapshot.activeVirtualUsers());

            runResultService.saveResult(plan.getId(), actualSnapshot, plan.getDurationSeconds());

            redisTemplate.opsForSet().remove(redisKey, planIdStr);
            metricAggregator.cleanup(plan.getId());

            messagingTemplate.convertAndSend("/topic/metrics/" + plan.getId(), "{\"status\": \"COMPLETED\", \"planId\": " + plan.getId() + "}");
            log.info("Completed run for plan {}", plan.getId());

        } catch (Exception e) {
            log.error("Load test failed for plan {}", plan.getId(), e);
            updateStatus(plan, RunStatus.FAILED);
            redisTemplate.opsForSet().remove(redisKey, planIdStr);
            metricAggregator.cleanup(plan.getId());
            messagingTemplate.convertAndSend("/topic/metrics/" + plan.getId(), "{\"status\": \"FAILED\", \"planId\": " + plan.getId() + "}");
        }
    }

    private void vuLogic(Long planId, String targetUrl, long endTimeMillis) {
        metricAggregator.updateActiveUsers(planId, 1);
        try {
            while (System.currentTimeMillis() < endTimeMillis) {
                long start = System.nanoTime();
                boolean isError = false;
                try {
                    webClient.get().uri(targetUrl).retrieve().toBodilessEntity().block();
                } catch (Exception e) {
                    isError = true;
                }
                long latencyMs = (System.nanoTime() - start) / 1_000_000;
                metricAggregator.record(planId, latencyMs, isError);
            }
        } finally {
            metricAggregator.updateActiveUsers(planId, -1);
        }
    }

    private synchronized void updateStatus(TestPlan plan, RunStatus newStatus) {
        RunStatus current = plan.getStatus();
        boolean valid = false;
        
        if (current == RunStatus.CREATED && newStatus == RunStatus.RUNNING) valid = true;
        else if (current == RunStatus.RUNNING && newStatus == RunStatus.DRAINING) valid = true;
        else if (current == RunStatus.RUNNING && newStatus == RunStatus.ABORTED) valid = true;
        else if (current == RunStatus.DRAINING && newStatus == RunStatus.COMPLETED) valid = true;
        else if (current == RunStatus.DRAINING && newStatus == RunStatus.FAILED) valid = true;
        else if (current == RunStatus.RUNNING && newStatus == RunStatus.FAILED) valid = true;
        else if (current == RunStatus.CREATED && newStatus == RunStatus.FAILED) valid = true;

        if (!valid) {
            throw new IllegalStateException("Invalid status transition from " + current + " to " + newStatus);
        }

        log.info("Transitioning plan {} from {} to {}", plan.getId(), plan.getStatus(), newStatus);
        plan.setStatus(newStatus);
        testPlanRepository.save(plan);
    }
}
