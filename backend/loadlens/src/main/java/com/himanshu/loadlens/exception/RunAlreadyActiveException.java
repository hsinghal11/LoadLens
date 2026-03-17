package com.himanshu.loadlens.exception;

public class RunAlreadyActiveException extends RuntimeException {
    public RunAlreadyActiveException(String message) {
        super(message);
    }
}
