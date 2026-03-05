package com.himanshu.loadlens.exception;

import lombok.Builder;
import lombok.Getter;

import java.time.Instant;

@Getter
@Builder
public class ApiError {
    private Instant timestamp;
    private int status;
    private String message;
    private String path;
    private String error;
}
