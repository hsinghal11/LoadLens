package com.himanshu.loadlens.services;

import com.himanshu.loadlens.dto.response.MetricSnapshot;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class MetricAggregator {

    private final ConcurrentHashMap<Long, List<Long>> latencyBuffers = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<Long, AtomicLong> requestCounters = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<Long, AtomicLong> pendingRequestCounters = new ConcurrentHashMap<>(); // For RPS
    private final ConcurrentHashMap<Long, AtomicLong> errorCounters = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<Long, AtomicLong> activeVirtualUsers = new ConcurrentHashMap<>();

    public void record(Long planId, long latencyMs, boolean isError) {
        latencyBuffers.computeIfAbsent(planId, k -> Collections.synchronizedList(new ArrayList<>())).add(latencyMs);
        requestCounters.computeIfAbsent(planId, k -> new AtomicLong(0)).incrementAndGet();
        pendingRequestCounters.computeIfAbsent(planId, k -> new AtomicLong(0)).incrementAndGet();
        if (isError) {
            errorCounters.computeIfAbsent(planId, k -> new AtomicLong(0)).incrementAndGet();
        }
    }

    public void updateActiveUsers(Long planId, int delta) {
        activeVirtualUsers.computeIfAbsent(planId, k -> new AtomicLong(0)).addAndGet(delta);
    }

    public MetricSnapshot snapshotAndReset(Long planId) {
        List<Long> currentLatencies = latencyBuffers.put(planId, Collections.synchronizedList(new ArrayList<>()));
        if (currentLatencies == null) {
            currentLatencies = new ArrayList<>();
        }

        AtomicLong pendingCount = pendingRequestCounters.get(planId);
        long rps = pendingCount != null ? pendingCount.getAndSet(0) : 0;

        AtomicLong totalCount = requestCounters.get(planId);
        long total = totalCount != null ? totalCount.get() : 0;

        AtomicLong errCount = errorCounters.get(planId);
        long errors = errCount != null ? errCount.get() : 0;

        double errorRate = total > 0 ? ((double) errors / total) * 100 : 0.0;

        AtomicLong activeUsersCount = activeVirtualUsers.get(planId);
        int activeUsers = activeUsersCount != null ? (int) activeUsersCount.get() : 0;

        List<Long> snapshotLatencies;
        synchronized (currentLatencies) {
            snapshotLatencies = new ArrayList<>(currentLatencies);
        }
        Collections.sort(snapshotLatencies);

        double p50 = percentile(snapshotLatencies, 50);
        double p95 = percentile(snapshotLatencies, 95);

        return new MetricSnapshot(planId, Instant.now(), p50, p95, rps, errorRate, activeUsers);
    }

    public long getTotalRequests(Long planId) {
        AtomicLong totalCount = requestCounters.get(planId);
        return totalCount != null ? totalCount.get() : 0;
    }

    public long getErrorCount(Long planId) {
        AtomicLong errCount = errorCounters.get(planId);
        return errCount != null ? errCount.get() : 0;
    }

    public void cleanup(Long planId) {
        latencyBuffers.remove(planId);
        requestCounters.remove(planId);
        pendingRequestCounters.remove(planId);
        errorCounters.remove(planId);
        activeVirtualUsers.remove(planId);
    }

    private double percentile(List<Long> sorted, double p) {
        if (sorted == null || sorted.isEmpty()) {
            return 0.0;
        }
        int index = (int) Math.ceil((p / 100.0) * sorted.size()) - 1;
        return sorted.get(Math.max(0, index));
    }
}
