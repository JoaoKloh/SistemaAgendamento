package com.jbkloh.dvd.dto.response;

import java.time.LocalDate;
import java.time.LocalTime;

public record AgendamentoStatusResponseDTO(
    LocalDate dataAgendamento,
    LocalTime horaAgendamento,
    Boolean estaAtivo

) {
} 
