package com.himanshu.loadlens.repository;

import com.himanshu.loadlens.entity.RunResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RunResultRepository extends JpaRepository<RunResult, Long> {
    List<RunResult> findAllByTestPlanIdOrderByStartedAtDesc(Long testPlanId);
    List<RunResult> findTop2ByTestPlanIdOrderByStartedAtDesc(Long testPlanId);
}
