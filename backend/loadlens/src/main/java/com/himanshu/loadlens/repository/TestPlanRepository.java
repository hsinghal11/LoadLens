package com.himanshu.loadlens.repository;

import com.himanshu.loadlens.entity.TestPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TestPlanRepository extends JpaRepository<TestPlan, Long> {
    List<TestPlan> findAllByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<TestPlan> findByIdAndUserId(Long id, Long userId);
}
