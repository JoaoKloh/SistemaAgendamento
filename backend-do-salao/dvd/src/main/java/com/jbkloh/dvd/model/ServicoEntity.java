package com.jbkloh.dvd.model;

import java.time.LocalTime;

import com.jbkloh.dvd.enums.TipoItem;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "servicos")
public class ServicoEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_servico")
    private Long id;

    @Column(name = "nome_servico", nullable = false)
    private String nome;

    @Column(name = "precos_servico", nullable = false)
    private Double preco;

    @Column(name = "detalhes_servico", length = 512)
    private String especificacoes;

    // Nulo para produtos
    @Column(name = "duracao_servico")
    private LocalTime duracao;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_item", nullable = false)
    private TipoItem tipo = TipoItem.SERVICO;

    @Column(name = "esta_ativo", nullable = false)
    private Boolean estaAtivo = true;

    // Nulo para serviços: apenas produtos possuem foto
    @Column(name = "url_imagem", length = 2048)
    private String urlImagem;
}