package com.jbkloh.dvd.dto.response;

import java.util.List;

public record LoginResponseDTO(
    String email,
    List<String> authorities,
    String urlDirecionamento
) {
    
}
