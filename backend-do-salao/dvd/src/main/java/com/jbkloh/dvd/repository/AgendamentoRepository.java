package com.jbkloh.dvd.repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.jbkloh.dvd.dto.response.ItemRankingResponseDTO;
import com.jbkloh.dvd.enums.TipoItem;
import com.jbkloh.dvd.model.AgendamentoEntity;

public interface AgendamentoRepository extends JpaRepository<AgendamentoEntity, Long> {

    boolean existsByDataAgendamentoAndHoraAgendamento(LocalDate dataAgendamento, LocalTime horaAgendamento);
    Optional<AgendamentoEntity> findByClienteNome(String nome);

    // 1. Quantidade de agendamentos no mês/ano
    @Query("""
        SELECT COUNT(a) 
        FROM AgendamentoEntity a 
        WHERE MONTH(a.dataAgendamento) = :mes 
          AND YEAR(a.dataAgendamento) = :ano
    """)
    Integer retornarQuantidadeAgendamentosDoMes(@Param("mes") Integer mes, @Param("ano") Integer ano);

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
    
    // 2. Faturamento usando o campo 'valorTotal' da entidade
    @Query("""
        SELECT COALESCE(SUM(a.valorTotal), 0.0)
        FROM AgendamentoEntity a
        WHERE MONTH(a.dataAgendamento) = :mes
          AND YEAR(a.dataAgendamento) = :ano
    """)
    Double calcularFaturamentoDoMes(@Param("mes") Integer mes, @Param("ano") Integer ano);

    // 3. Item mais solicitado fazendo JOIN com a coleção 'itens'
    @Query("""
        SELECT i.nome
        FROM AgendamentoEntity a
        JOIN a.itens i
        WHERE MONTH(a.dataAgendamento) = :mes
          AND YEAR(a.dataAgendamento) = :ano
          AND i.estaAtivo = true
          AND i.tipo = :tipo
        GROUP BY i.nome
        ORDER BY COUNT(i) DESC
    """)
    List<String> buscarServicoMaisSolicitadoDoMes(
            @Param("mes") Integer mes, 
            @Param("ano") Integer ano, 
            @Param("tipo") TipoItem tipo,
            Pageable pageable
    );

    // 4. Ranking de itens fazendo JOIN com a coleção 'itens'
    @Query("""
        SELECT new com.jbkloh.dvd.dto.response.ItemRankingResponseDTO(
            i.nome, 
            COUNT(i)
        )
        FROM AgendamentoEntity a
        JOIN a.itens i
        WHERE MONTH(a.dataAgendamento) = :mes
          AND YEAR(a.dataAgendamento) = :ano
          AND i.estaAtivo = true
          AND i.tipo = :tipo
        GROUP BY i.nome
        ORDER BY COUNT(i) DESC
    """)
    List<ItemRankingResponseDTO> buscarRankingItensDoMes(
            @Param("mes") Integer mes, 
            @Param("ano") Integer ano, 
            @Param("tipo") TipoItem tipo,
            Pageable pageable
    );

    @Query("""
        SELECT a.horaAgendamento 
        FROM AgendamentoEntity a 
        WHERE a.dataAgendamento = :data 
    """)
    List<LocalTime> findHorariosOcupadosPorData(@Param("data") LocalDate data);
}
