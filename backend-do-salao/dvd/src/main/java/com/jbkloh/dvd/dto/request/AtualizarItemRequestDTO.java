package com.jbkloh.dvd.dto.request;

import java.time.LocalTime;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

/**
 * Atualização de um item do catálogo. Serviços e produtos são a mesma
 * ServicoEntity (diferenciados por TipoItem), então um único DTO atende os
 * dois; os nomes seguem o CriarServicoRequestDTO usado pelo frontend. O tipo
 * não entra aqui porque não pode ser trocado na edição, e a obrigatoriedade
 * da duração (só para serviços) é validada no ServicoPrestadoService.
 */
public record AtualizarItemRequestDTO(
    @NotBlank(message = "O nome é obrigatório")
    String nome,

    @NotNull(message = "O preço é obrigatório")
    @PositiveOrZero(message = "O preço não pode ser negativo")
    Double preco,

    @Size(max = 512, message = "Os detalhes devem ter no máximo 512 caracteres")
    String detalhes,

    LocalTime duracao,

    @Size(max = 2048, message = "A URL da imagem é muito longa")
    String urlImagem
) {
}
