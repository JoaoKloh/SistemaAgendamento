package com.jbkloh.dvd.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import com.jbkloh.dvd.config.SseEmiterManager;
import com.jbkloh.dvd.dto.request.AgendamentoRequestDTO;
import com.jbkloh.dvd.exception.AppException;
import com.jbkloh.dvd.model.AgendamentoEntity;
import com.jbkloh.dvd.model.ClienteEntity;
import com.jbkloh.dvd.model.ServicoEntity;
import com.jbkloh.dvd.repository.AgendamentoRepository;

/**
 * Testes de regra de negócio do agendamento: conflito de horário, duplicidade
 * no mesmo dia, resolução do período (mês/ano) e remoção. Usa Mockito puro
 * (sem contexto Spring) para não depender de banco de dados.
 */
@ExtendWith(MockitoExtension.class)
class AgendamentoServiceTest {

    @Mock
    private AgendamentoRepository agendamentoRepository;

    @Mock
    private ClienteService clienteService;

    @Mock
    private ServicoPrestadoService servicoPrestadoService;

    @Mock
    private SseEmiterManager sseEmiterManager;

    @InjectMocks
    private AgendamentoService agendamentoService;

    private AgendamentoRequestDTO criarRequestValido() {
        return new AgendamentoRequestDTO(
            LocalDate.now().plusDays(1),
            LocalTime.of(10, 0),
            "Cliente Teste",
            "cliente@teste.com",
            "24999999999",
            List.of(1L)
        );
    }

    private ServicoEntity criarServico(Long id, Double preco) {
        ServicoEntity servico = new ServicoEntity();
        servico.setId(id);
        servico.setNome("Corte");
        servico.setPreco(preco);
        return servico;
    }

    @Test
    void criarAgendamento_deveLancarConflito_quandoHorarioJaReservado() {
        AgendamentoRequestDTO req = criarRequestValido();
        when(agendamentoRepository.existsByDataAgendamentoAndHoraAgendamento(req.dataAgendamento(), req.horaAgendamento()))
            .thenReturn(true);

        assertThatThrownBy(() -> agendamentoService.criarAgendamento(req))
            .isInstanceOf(AppException.class)
            .extracting(ex -> ((AppException) ex).getHttpStatus())
            .isEqualTo(HttpStatus.CONFLICT);

        verify(agendamentoRepository, never()).save(any());
    }

    @Test
    void criarAgendamento_deveLancarBadRequest_quandoClienteJaTemAgendamentoNoMesmoDia() {
        AgendamentoRequestDTO req = criarRequestValido();
        when(agendamentoRepository.existsByDataAgendamentoAndHoraAgendamento(req.dataAgendamento(), req.horaAgendamento()))
            .thenReturn(false);
        when(agendamentoRepository.existsDuplicidadePorEmailEData(req.email(), req.dataAgendamento()))
            .thenReturn(true);

        assertThatThrownBy(() -> agendamentoService.criarAgendamento(req))
            .isInstanceOf(AppException.class)
            .extracting(ex -> ((AppException) ex).getHttpStatus())
            .isEqualTo(HttpStatus.BAD_REQUEST);

        verify(agendamentoRepository, never()).save(any());
    }

    @Test
    void criarAgendamento_deveSalvarComValorTotalSomado_quandoDadosValidos() {
        AgendamentoRequestDTO req = criarRequestValido();
        ClienteEntity cliente = new ClienteEntity(req.nome(), req.email(), req.telefone());
        ServicoEntity servico = criarServico(1L, 70.0);

        when(agendamentoRepository.existsByDataAgendamentoAndHoraAgendamento(req.dataAgendamento(), req.horaAgendamento()))
            .thenReturn(false);
        when(agendamentoRepository.existsDuplicidadePorEmailEData(req.email(), req.dataAgendamento()))
            .thenReturn(false);
        when(clienteService.buscarOuCriarCliente(req.nome(), req.email(), req.telefone()))
            .thenReturn(cliente);
        when(servicoPrestadoService.validarEObterServicoParaAgendamento(1L))
            .thenReturn(servico);
        // O service usa a entidade retornada pelo save() para montar o DTO do evento
        // SSE disparado após a criação, então o mock precisa devolver uma entidade
        // "salva" (com cliente e itens preenchidos), não apenas `any()`.
        when(agendamentoRepository.save(any())).thenAnswer(invocation -> {
            AgendamentoEntity entidade = invocation.getArgument(0);
            entidade.setAgendamentoId(1L);
            return entidade;
        });

        var response = agendamentoService.criarAgendamento(req);

        assertThat(response.dataAgendamento()).isEqualTo(req.dataAgendamento());
        assertThat(response.horaAgendamento()).isEqualTo(req.horaAgendamento());
        verify(agendamentoRepository, times(1)).save(any());
    }

    @Test
    void deletarAgendamento_deveLancarNotFound_quandoIdNaoExiste() {
        when(agendamentoRepository.existsById(99L)).thenReturn(false);

        assertThatThrownBy(() -> agendamentoService.deletarAgendamento(99L))
            .isInstanceOf(AppException.class)
            .extracting(ex -> ((AppException) ex).getHttpStatus())
            .isEqualTo(HttpStatus.NOT_FOUND);

        verify(agendamentoRepository, never()).deleteById(anyLong());
    }

    @Test
    void deletarAgendamento_deveRemover_quandoIdExiste() {
        when(agendamentoRepository.existsById(1L)).thenReturn(true);

        agendamentoService.deletarAgendamento(1L);

        verify(agendamentoRepository, times(1)).deleteById(1L);
    }

    @Test
    void retornarQuantidadeAgendamentosDoMes_deveUsarMesAnoAtual_quandoParametrosNulos() {
        LocalDate hoje = LocalDate.now();
        when(agendamentoRepository.retornarQuantidadeAgendamentosDoMes(hoje.getMonthValue(), hoje.getYear()))
            .thenReturn(3);

        Integer resultado = agendamentoService.retornarQuantidadeAgendamentosDoMes(null, null);

        assertThat(resultado).isEqualTo(3);
        verify(agendamentoRepository).retornarQuantidadeAgendamentosDoMes(hoje.getMonthValue(), hoje.getYear());
    }

    @Test
    void retornarQuantidadeAgendamentosDoMes_deveUsarParametrosInformados_quandoFornecidos() {
        when(agendamentoRepository.retornarQuantidadeAgendamentosDoMes(eq(3), eq(2024)))
            .thenReturn(7);

        Integer resultado = agendamentoService.retornarQuantidadeAgendamentosDoMes(3, 2024);

        assertThat(resultado).isEqualTo(7);
        verify(agendamentoRepository).retornarQuantidadeAgendamentosDoMes(3, 2024);
    }
}
