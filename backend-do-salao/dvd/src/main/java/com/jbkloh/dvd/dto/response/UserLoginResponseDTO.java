package com.jbkloh.dvd.dto.response;

import java.util.List;

public record UserLoginResponseDTO(
    String email,
    List<String> authoritities,
    String urlDirecionamento
) {
    
}
