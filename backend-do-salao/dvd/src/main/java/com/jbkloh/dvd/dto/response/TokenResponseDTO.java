package com.jbkloh.dvd.dto.response;

public record TokenResponseDTO(
    String accessToken,
    String refreshToken,
    String tokenType
) {
    
}
