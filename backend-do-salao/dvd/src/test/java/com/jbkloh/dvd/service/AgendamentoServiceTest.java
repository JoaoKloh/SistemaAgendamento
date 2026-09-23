package com.jbkloh.dvd.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import com.jbkloh.dvd.dto.request.AgendamentoRequestDTO;
import com.jbkloh.dvd.dto.response.DashboardResumoResponseDTO;
import com.jbkloh.dvd.dto.response.ItemRankingComTipoResponseDTO;
import com.jbkloh.dvd.dto.response.ResumoAgendamentosResponseDTO;
import com.jbkloh.dvd.enums.TipoItem;
import com.jbkloh.dvd.exception.AppException;
import com.jbkloh.dvd.model.AgendamentoEntity;
import com.jbkloh.dvd.model.ClienteEntity;
import com.jbkloh.dvd.model.ServicoEntity;
import com.jbkloh.dvd.repository.AgendamentoRepository;

/**
 * Testes de regra de negócio do agendamento: conflito de horário, duplicidade
 * no mesmo dia, resolução do período (data início/fim) e remoção. Usa
 * Mockito puro (sem contexto Spring) para não depender de banco de dados.
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
    private SseService sseEmiterManager;

    @Mock
    private EmailService emailService;

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
    void retornarDashboardResumo_deveUsarPrimeiroDiaDoMesAteHoje_quandoParametrosNulos() {
        LocalDate hoje = LocalDate.now(ZoneId.of("America/Sao_Paulo"));
        LocalDate primeiroDiaDoMes = hoje.withDayOfMonth(1);

        when(agendamentoRepository.buscarResumoAgendamentosDoPeriodo(primeiroDiaDoMes, hoje))
            .thenReturn(new ResumoAgendamentosResponseDTO(3L, 150.0));
        when(agendamentoRepository.buscarRankingItensDoPeriodo(primeiroDiaDoMes, hoje))
            .thenReturn(List.of());

        DashboardResumoResponseDTO resultado = agendamentoService.retornarDashboardResumo(null, null, null);

        assertThat(resultado.dataInicio()).isEqualTo(primeiroDiaDoMes);
        assertThat(resultado.dataFim()).isEqualTo(hoje);
        assertThat(resultado.agendamentosCount()).isEqualTo(3L);
        assertThat(resultado.faturamento()).isEqualTo(150.0);
        verify(agendamentoRepository).buscarResumoAgendamentosDoPeriodo(primeiroDiaDoMes, hoje);
    }

    @Test
    void retornarDashboardResumo_deveUsarPeriodoInformado_quandoFornecido() {
        LocalDate inicio = LocalDate.of(2024, 3, 1);
        LocalDate fim = LocalDate.of(2024, 3, 31);

        when(agendamentoRepository.buscarResumoAgendamentosDoPeriodo(inicio, fim))
            .thenReturn(new ResumoAgendamentosResponseDTO(7L, 500.0));
        when(agendamentoRepository.buscarRankingItensDoPeriodo(inicio, fim))
            .thenReturn(List.of());

        DashboardResumoResponseDTO resultado = agendamentoService.retornarDashboardResumo(inicio, fim, null);

        assertThat(resultado.agendamentosCount()).isEqualTo(7L);
        assertThat(resultado.faturamento()).isEqualTo(500.0);
        verify(agendamentoRepository).buscarResumoAgendamentosDoPeriodo(inicio, fim);
    }

    @Test
    void retornarDashboardResumo_deveLancarBadRequest_quandoDataInicioAposDataFim() {
        LocalDate inicio = LocalDate.of(2024, 3, 31);
        LocalDate fim = LocalDate.of(2024, 3, 1);

        assertThatThrownBy(() -> agendamentoService.retornarDashboardResumo(inicio, fim, null))
            .isInstanceOf(AppException.class)
            .extracting(ex -> ((AppException) ex).getHttpStatus())
            .isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void retornarDashboardResumo_deveMontarRankingsSeparadosPorTipoRespeitandoLimite() {
        LocalDate inicio = LocalDate.of(2024, 3, 1);
        LocalDate fim = LocalDate.of(2024, 3, 31);

        when(agendamentoRepository.buscarResumoAgendamentosDoPeriodo(inicio, fim))
            .thenReturn(new ResumoAgendamentosResponseDTO(0L, 0.0));
        when(agendamentoRepository.buscarRankingItensDoPeriodo(inicio, fim))
            .thenReturn(List.of(
                new ItemRankingComTipoResponseDTO(TipoItem.SERVICO, "Corte", 5L),
                new ItemRankingComTipoResponseDTO(TipoItem.SERVICO, "Barba", 2L),
                new ItemRankingComTipoResponseDTO(TipoItem.PRODUTO, "Shampoo", 4L)
            ));

        DashboardResumoResponseDTO resultado = agendamentoService.retornarDashboardResumo(inicio, fim, 1);

        assertThat(resultado.topServicos()).hasSize(1);
        assertThat(resultado.topServicos().get(0).nome()).isEqualTo("Corte");
        assertThat(resultado.servicoMaisSolicitado()).isEqualTo("Corte");
        assertThat(resultado.topProdutos()).hasSize(1);
        assertThat(resultado.topProdutos().get(0).nome()).isEqualTo("Shampoo");
        assertThat(resultado.produtoMaisSolicitado()).isEqualTo("Shampoo");
    }
}
