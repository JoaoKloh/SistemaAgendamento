package com.jbkloh.dvd.model;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@RequiredArgsConstructor
@Table(name = "agendamento")
public class AgendamentoEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "agendamento_id")
    private Long agendamentoId;

    @ManyToMany
    @JoinTable(
        name = "agendamento_itens",
        joinColumns = @JoinColumn(name = "agendamento_id"),
        inverseJoinColumns = @JoinColumn(name = "servico_id")
    )
    private List<ServicoEntity> itens = new ArrayList<>();

    @Column(name = "valor_total", nullable = false)
    private Double valorTotal;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_nome", nullable = false)
    private ClienteEntity cliente;

    @Column(name = "hora_agendamento",nullable = false)
    private LocalTime horaAgendamento;

    @Column(name = "data_agendamento",nullable = false)
    private LocalDate dataAgendamento;

    @Column(name="esta_ativo",nullable = false)
    private Boolean statusAgendamento;

}
