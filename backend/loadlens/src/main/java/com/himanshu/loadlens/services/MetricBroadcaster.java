package com.himanshu.loadlens.services;

import com.himanshu.loadlens.dto.response.MetricSnapshot;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class MetricBroadcaster {

    private final MetricAggregator metricAggregator;
    private final SimpMessagingTemplate messagingTemplate;
    private final RedisTemplate<String, String> redisTemplate;

    @Scheduled(fixedRate = 1000)
    public void broadcast() {
        Set<String> activePlans = redisTemplate.opsForSet().members("active_runs");
        if (activePlans == null || activePlans.isEmpty()) {
            return;
        }

        for (String planIdStr : activePlans) {
            try {
                Long planId = Long.parseLong(planIdStr);
                MetricSnapshot snapshot = metricAggregator.snapshotAndReset(planId);
                
                messagingTemplate.convertAndSend("/topic/metrics/" + planId, snapshot);
            } catch (Exception e) {
                log.error("Failed to broadcast metrics for plan: {}", planIdStr, e);
            }
        }
    }
}
