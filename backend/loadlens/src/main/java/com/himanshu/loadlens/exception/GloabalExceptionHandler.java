package com.himanshu.loadlens.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;

@RestControllerAdvice
public class GloabalExceptionHandler {

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ApiError> handleRuntimeException(
            RuntimeException e,
            HttpServletRequest request
    ){
        ApiError apiError = ApiError.builder()
                .timestamp(Instant.now())
                .message(e.getMessage())
                .path(request.getRequestURI())
                .status(HttpStatus.BAD_REQUEST.value())
                .error(HttpStatus.BAD_REQUEST.toString())
                .build();

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(apiError);
    }

}
