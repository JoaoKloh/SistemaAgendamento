package com.jbkloh.dvd.dto.response;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import com.jbkloh.dvd.model.AgendamentoEntity;

public record AgendamentoResponseUsuarioDTO(
    Long idAgendamento,
    LocalDate dataAgendamento,
    LocalTime horaAgendamento,
    Double valorTotal,
    List<ServicoResponseDTO> servicosProdutos,
    Boolean statusAgendamento
) {
    public AgendamentoResponseUsuarioDTO(AgendamentoEntity entity) {
        this(
            entity.getAgendamentoId(),
            entity.getDataAgendamento(),
            entity.getHoraAgendamento(),
            entity.getValorTotal(),
            entity.getItens().stream().map(ServicoResponseDTO::new).toList(),
            entity.getStatusAgendamento()
        );
    }
}
