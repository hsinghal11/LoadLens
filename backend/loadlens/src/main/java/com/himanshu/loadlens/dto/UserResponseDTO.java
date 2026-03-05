package com.himanshu.loadlens.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.Instant;

@Getter
@Builder
public class UserResponseDTO {
    private Long id;
    private String name;
    private String email;
    private boolean enabled;
    private String provider;
    private Instant createdAt;

}