package com.jbkloh.dvd.dto.response;

import java.time.LocalTime;
import com.jbkloh.dvd.model.ServicoEntity;

public record ServicoResponseDTO(
    Long id,
    String nome,
    String detalhes,
    LocalTime duracao,
    Double preco
) {
    public ServicoResponseDTO(ServicoEntity entity) {
        this(
            entity.getId(),
            entity.getNome(),
            entity.getEspecificacoes(),
            entity.getDuracao(),
            entity.getPreco()
        );
    }
}