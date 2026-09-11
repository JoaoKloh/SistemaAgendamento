package com.jbkloh.dvd.dto.response;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import com.jbkloh.dvd.model.AgendamentoEntity;

public record AgendamentoDetalhadoResponseDTO(
    Long agendamentoId,
    String clienteNome,
    String clienteEmail,
    String clienteTelefone,
    LocalDate dataAgendamento,
    LocalTime horaAgendamento,
    Boolean statusAgendamento,
    Double valorTotal,
    List<String> itens
) {
    public AgendamentoDetalhadoResponseDTO(AgendamentoEntity entity) {
        this(
            entity.getAgendamentoId(),
            entity.getCliente().getNome(),
            entity.getCliente().getEmail(),
            entity.getCliente().getTelefone(),
            entity.getDataAgendamento(),
            entity.getHoraAgendamento(),
            entity.getStatusAgendamento(),
            entity.getValorTotal(),
            entity.getItens().stream().map(item -> item.getNome()).toList()
        );
    }
}
