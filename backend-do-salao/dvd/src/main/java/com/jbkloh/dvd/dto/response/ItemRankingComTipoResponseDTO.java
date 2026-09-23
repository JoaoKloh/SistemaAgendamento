package com.jbkloh.dvd.dto.response;

import com.jbkloh.dvd.enums.TipoItem;

public record ItemRankingComTipoResponseDTO(
    TipoItem tipo,
    String nome,
    Long quantidadeAgendamentos
) {}
