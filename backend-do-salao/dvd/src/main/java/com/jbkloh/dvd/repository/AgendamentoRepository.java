package com.jbkloh.dvd.repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.jbkloh.dvd.dto.response.ItemRankingComTipoResponseDTO;
import com.jbkloh.dvd.dto.response.ResumoAgendamentosResponseDTO;
import com.jbkloh.dvd.model.AgendamentoEntity;

public interface AgendamentoRepository extends JpaRepository<AgendamentoEntity, Long> {

    boolean existsByDataAgendamentoAndHoraAgendamento(LocalDate dataAgendamento, LocalTime horaAgendamento);
    Optional<AgendamentoEntity> findByClienteNome(String nome);
    List<AgendamentoEntity>findByDataAgendamentoOrderByHoraAgendamentoAsc(LocalDate data);

    @Query("""
        SELECT CASE WHEN COUNT(a) > 0 THEN true ELSE false END
        FROM AgendamentoEntity a
        WHERE a.cliente.email = :email
          AND a.dataAgendamento = :dataAgendamento
    """)
    boolean existsDuplicidadePorEmailEData(
        @Param("email") String email,
        @Param("dataAgendamento") LocalDate dataAgendamento
    );

    // 1. Quantidade de agendamentos e faturamento do período em uma única
    // consulta (evita duas consultas separadas para o mesmo intervalo).
    @Query("""
        SELECT new com.jbkloh.dvd.dto.response.ResumoAgendamentosResponseDTO(
            COUNT(a),
            COALESCE(SUM(a.valorTotal), 0.0)
        )
        FROM AgendamentoEntity a
        WHERE a.dataAgendamento BETWEEN :dataInicio AND :dataFim
    """)
    ResumoAgendamentosResponseDTO buscarResumoAgendamentosDoPeriodo(
            @Param("dataInicio") LocalDate dataInicio,
            @Param("dataFim") LocalDate dataFim
    );

    // 2. Ranking de serviços e produtos do período em uma única consulta
    // (agrupando por tipo + nome), evitando quatro consultas separadas
    // (mais solicitado e top N para cada um dos dois tipos de item).
    @Query("""
        SELECT new com.jbkloh.dvd.dto.response.ItemRankingComTipoResponseDTO(
            i.tipo,
            i.nome,
            COUNT(i)
        )
        FROM AgendamentoEntity a
        JOIN a.itens i
        WHERE a.dataAgendamento BETWEEN :dataInicio AND :dataFim
          AND i.estaAtivo = true
        GROUP BY i.tipo, i.nome
        ORDER BY i.tipo ASC, COUNT(i) DESC
    """)
    List<ItemRankingComTipoResponseDTO> buscarRankingItensDoPeriodo(
            @Param("dataInicio") LocalDate dataInicio,
            @Param("dataFim") LocalDate dataFim
    );

    @Query("""
        SELECT a.horaAgendamento 
        FROM AgendamentoEntity a 
        WHERE a.dataAgendamento = :data 
    """)
    List<LocalTime> findHorariosOcupadosPorData(@Param("data") LocalDate data);
}
