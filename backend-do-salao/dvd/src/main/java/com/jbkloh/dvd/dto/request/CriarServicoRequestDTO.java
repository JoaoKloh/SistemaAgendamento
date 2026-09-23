package com.jbkloh.dvd.dto.request;

import java.time.LocalTime;

public record CriarServicoRequestDTO(
    Double preco,
    String nome,
    String detalhes,
    LocalTime duracao,
    String tipo,
    String urlImagem
) {
}