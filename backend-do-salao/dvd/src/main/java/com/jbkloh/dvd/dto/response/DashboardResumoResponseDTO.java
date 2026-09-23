package com.jbkloh.dvd.dto.response;

import java.time.LocalDate;
import java.util.List;

public record DashboardResumoResponseDTO(
    LocalDate dataInicio,
    LocalDate dataFim,
    Long agendamentosCount,
    Double faturamento,
    String servicoMaisSolicitado,
    String produtoMaisSolicitado,
    List<ItemRankingResponseDTO> topServicos,
    List<ItemRankingResponseDTO> topProdutos
) {}
