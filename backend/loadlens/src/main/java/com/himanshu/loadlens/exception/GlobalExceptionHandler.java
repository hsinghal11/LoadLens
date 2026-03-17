package com.himanshu.loadlens.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(PlanNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handlePlanNotFound(PlanNotFoundException ex, WebRequest request) {
        return buildResponse(HttpStatus.NOT_FOUND, "PLAN_NOT_FOUND", ex.getMessage(), request.getDescription(false));
    }

    @ExceptionHandler(RunAlreadyActiveException.class)
    public ResponseEntity<Map<String, Object>> handleRunAlreadyActive(RunAlreadyActiveException ex, WebRequest request) {
        return buildResponse(HttpStatus.CONFLICT, "RUN_ALREADY_ACTIVE", ex.getMessage(), request.getDescription(false));
    }

    @ExceptionHandler(UnauthorizedAccessException.class)
    public ResponseEntity<Map<String, Object>> handleUnauthorized(UnauthorizedAccessException ex, WebRequest request) {
        return buildResponse(HttpStatus.FORBIDDEN, "UNAUTHORIZED_ACCESS", ex.getMessage(), request.getDescription(false));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationExceptions(MethodArgumentNotValidException ex, WebRequest request) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error -> 
            errors.put(error.getField(), error.getDefaultMessage())
        );
        return buildResponse(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", errors.toString(), request.getDescription(false));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalState(IllegalStateException ex, WebRequest request) {
        return buildResponse(HttpStatus.BAD_REQUEST, "ILLEGAL_STATE", ex.getMessage(), request.getDescription(false));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(Exception ex, WebRequest request) {
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", "An unexpected error occurred", request.getDescription(false));
    }

    private ResponseEntity<Map<String, Object>> buildResponse(HttpStatus status, String error, String message, String path) {
        Map<String, Object> body = new HashMap<>();
        body.put("error", error);
        body.put("message", message);
        body.put("timestamp", Instant.now().toString());
        body.put("path", path.replace("uri=", ""));
        return ResponseEntity.status(status).body(body);
    }
}
