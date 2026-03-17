package com.himanshu.loadlens.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "run_results")
@Getter
@Setter
public class RunResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDateTime startedAt;

    @Column
    private LocalDateTime completedAt;

    @Column(nullable = false)
    private long totalRequests;

    @Column(nullable = false)
    private long errorCount;

    @Column(nullable = false)
    private double p50Latency;

    @Column(nullable = false)
    private double p95Latency;

    @Column(nullable = false)
    private double avgRps;

    @Column(nullable = false)
    private int durationSeconds;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "test_plan_id", nullable = false)
    private TestPlan testPlan;

}
