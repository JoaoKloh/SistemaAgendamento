package com.jbkloh.dvd.dto.response;

import java.time.LocalDateTime;

import com.jbkloh.dvd.model.PortfolioEntity;

public record PortfolioResponseDTO(
    Long id,
    String url,
    String descricao,
    LocalDateTime criadoEm
) {
    public PortfolioResponseDTO(PortfolioEntity entity) {
        this(
            entity.getId(),
            entity.getUrl(),
            entity.getDescricao(),
            entity.getCriadoEm()
        );
    }
}
