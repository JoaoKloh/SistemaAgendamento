package com.jbkloh.dvd.dto.request;
import jakarta.validation.constraints.NotBlank;

public record TokenRequestDTO(
    @NotBlank(message = "O Refresh Token é obrigatório.")
    String refreshToken
) {
    
}
