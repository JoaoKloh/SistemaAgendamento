package com.jbkloh.dvd.exception.dto;
import java.time.LocalDateTime;

public record RestErrorResponse(
    int status,
    String error,
    String message,
    LocalDateTime timestamp
) {
    public RestErrorResponse(int status, String error, String message) {
        this(status, error, message, LocalDateTime.now());
    }
}