package com.jbkloh.dvd.dto.request;

import jakarta.validation.constraints.NotBlank;

public record PortfolioRequestDTO(
    @NotBlank(message = "A URL da foto é obrigatória")
    String url,

    @NotBlank(message = "A descrição da foto é obrigatória")
    String descricao
) {
}
