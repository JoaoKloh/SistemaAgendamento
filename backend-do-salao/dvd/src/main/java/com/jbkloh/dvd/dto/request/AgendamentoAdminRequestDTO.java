package com.jbkloh.dvd.dto.request;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

public record AgendamentoAdminRequestDTO(
    @NotBlank(message = "O nome é obrigatório")
    String nome,

    @NotBlank(message = "O e-mail é obrigatório")
    @Email(message = "Formato de e-mail inválido")
    String email,

    String telefone,

    @NotNull(message = "A data do agendamento é obrigatória")
    LocalDate data,

    @NotNull(message = "O horário do agendamento é obrigatório")
    LocalTime horario,

    @NotEmpty(message = "Selecione pelo menos um serviço ou produto.")
    List<@NotNull(message = "Os itens selecionados não podem ser nulos.") Long> servicoProdutoIds
) {
}
