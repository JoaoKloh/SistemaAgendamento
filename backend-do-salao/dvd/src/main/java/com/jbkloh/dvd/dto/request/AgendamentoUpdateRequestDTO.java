package com.jbkloh.dvd.dto.request;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

public record AgendamentoUpdateRequestDTO(
    @NotNull(message = "O ID do agendamento é obrigatório")
    Long idAgendamento,

    @NotNull(message = "A data do agendamento é obrigatória")
    LocalDate dataAgendamento,

    @NotNull(message = "A hora do agendamento é obrigatória")
    LocalTime horaAgendamento,

    @NotNull(message = "O status do agendamento é obrigatório")
    Boolean statusAgendamento,

    @NotEmpty(message = "Selecione pelo menos um serviço ou produto.")
    List<Long> itensIds
) {
}