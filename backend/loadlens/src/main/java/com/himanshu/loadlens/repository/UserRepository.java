package com.himanshu.loadlens.repository;

import com.himanshu.loadlens.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Optional<User> findByEmailAndEnabledTrue(String email);

    boolean existsByEmail(String email);
}
