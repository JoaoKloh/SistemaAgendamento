package com.jbkloh.dvd.dto.response;

import com.jbkloh.dvd.model.ServicoEntity;

public record ProdutoResponseDTO(
    Long id,
    String nome,
    Double preco,
    String especificacoes,
    String urlImagem
) {
    public ProdutoResponseDTO(ServicoEntity entity) {
        this(
            entity.getId(),
            entity.getNome(),
            entity.getPreco(),
            entity.getEspecificacoes(),
            entity.getUrlImagem()
        );
    }
}