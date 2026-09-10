package com.jbkloh.dvd.dto.response;

import java.time.LocalDate;
import java.time.LocalTime;

public record AgendamentoResponseDTO(
    LocalDate dataAgendamento,
    LocalTime horaAgendamento
    
) {
    
}
