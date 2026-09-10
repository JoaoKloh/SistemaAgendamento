package com.jbkloh.dvd.dto.request;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import com.jbkloh.dvd.exception.AppException;
import org.springframework.http.HttpStatus;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

public record AgendamentoRequestDTO(

    @NotNull(message = "A data do agendamento é obrigatória")
    @FutureOrPresent(message = "A data do agendamento deve ser a data atual ou futura")
    LocalDate dataAgendamento,

    @NotNull(message = "A hora do agendamento é obrigatória")
    LocalTime horaAgendamento,

    @NotBlank(message = "O nome é obrigatório")
    String nome,

    @NotBlank(message = "O e-mail é obrigatório")
    @Email(message = "Formato de e-mail inválido")
    String email,

    @NotBlank(message = "O telefone é obrigatório")
    String telefone,

    @NotEmpty(message = "Selecione pelo menos um serviço ou produto.")
    List<Long> itensIds

) {
    public AgendamentoRequestDTO {
        if (dataAgendamento != null && horaAgendamento != null) {
            LocalDateTime dataHoraAgendamento = LocalDateTime.of(dataAgendamento, horaAgendamento);
            
            if (dataHoraAgendamento.isBefore(LocalDateTime.now())) {
                throw new AppException(
                    "O horário do agendamento não pode ser no passado.", 
                    HttpStatus.BAD_REQUEST
                );
            }
        }
    }
}