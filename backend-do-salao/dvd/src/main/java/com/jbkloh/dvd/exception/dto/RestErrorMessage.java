package com.jbkloh.dvd.exception.dto;

import java.time.Instant;
import org.springframework.http.HttpStatus;

public record RestErrorMessage(
    Instant timestamp,
    Integer status,
    String error,
    String message
) {
    public RestErrorMessage(HttpStatus status, String message) {
        this(Instant.now(), status.value(), status.getReasonPhrase(), message);
    }
}