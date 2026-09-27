package com.jbkloh.dvd.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import com.jbkloh.dvd.dto.request.AgendamentoAdminRequestDTO;
import com.jbkloh.dvd.dto.request.AgendamentoRequestDTO;
import com.jbkloh.dvd.dto.response.DashboardResumoResponseDTO;
import com.jbkloh.dvd.dto.response.ItemRankingComTipoResponseDTO;
import com.jbkloh.dvd.dto.response.ResumoAgendamentosResponseDTO;
import com.jbkloh.dvd.enums.TipoItem;
import com.jbkloh.dvd.exception.AppException;
import com.jbkloh.dvd.model.AgendamentoEntity;
import com.jbkloh.dvd.model.ClienteEntity;
import com.jbkloh.dvd.model.ServicoEntity;
import com.jbkloh.dvd.model.UsuarioEntity;
import com.jbkloh.dvd.repository.AgendamentoRepository;
import com.jbkloh.dvd.repository.UsuarioRepository;

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
    private UsuarioRepository usuarioRepository;

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

    private ServicoEntity criarProduto(Long id, Double preco) {
        ServicoEntity produto = new ServicoEntity();
        produto.setId(id);
        produto.setNome("Pomada");
        produto.setPreco(preco);
        produto.setTipo(TipoItem.PRODUTO);
        return produto;
    }

    @Test
    void criarAgendamento_deveLancarConflito_quandoHorarioJaReservado() {
        AgendamentoRequestDTO req = criarRequestValido();
        when(agendamentoRepository.existsByDataAgendamentoAndHoraAgendamentoAndStatusAgendamentoTrue(req.dataAgendamento(), req.horaAgendamento()))
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
        when(agendamentoRepository.existsByDataAgendamentoAndHoraAgendamentoAndStatusAgendamentoTrue(req.dataAgendamento(), req.horaAgendamento()))
            .thenReturn(false);
        when(agendamentoRepository.existsDuplicidadePorEmailEDataEStatus(req.email(), req.dataAgendamento(), true))
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

        when(agendamentoRepository.existsByDataAgendamentoAndHoraAgendamentoAndStatusAgendamentoTrue(req.dataAgendamento(), req.horaAgendamento()))
            .thenReturn(false);
        when(agendamentoRepository.existsDuplicidadePorEmailEDataEStatus(req.email(), req.dataAgendamento(), true))
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
    void criarAgendamentoAdmin_deveLancarConflito_quandoHorarioJaReservado() {
        AgendamentoAdminRequestDTO req = new AgendamentoAdminRequestDTO(
            "Cliente", "cliente@teste.com", null, LocalDate.now().plusDays(1), LocalTime.of(10, 0), List.of(1L, 2L));
        when(agendamentoRepository.existsByDataAgendamentoAndHoraAgendamentoAndStatusAgendamentoTrue(req.data(), req.horario()))
            .thenReturn(true);

        assertThatThrownBy(() -> agendamentoService.criarAgendamentoAdmin(req))
            .isInstanceOf(AppException.class)
            .extracting(ex -> ((AppException) ex).getHttpStatus())
            .isEqualTo(HttpStatus.CONFLICT);

        verify(clienteService, never()).buscarOuCriarClientePorEmail(any(), any(), any());
        verify(agendamentoRepository, never()).save(any());
    }

    @Test
    void criarAgendamentoAdmin_deveAssociarClienteResolvidoPorEmail() {
        AgendamentoAdminRequestDTO req = new AgendamentoAdminRequestDTO(
            "Cliente", "cliente@teste.com", null, LocalDate.now().plusDays(1), LocalTime.of(10, 0), List.of(1L, 2L));
        ClienteEntity cliente = new ClienteEntity("CLIENTE", req.email(), null);

        when(agendamentoRepository.existsByDataAgendamentoAndHoraAgendamentoAndStatusAgendamentoTrue(req.data(), req.horario()))
            .thenReturn(false);
        when(servicoPrestadoService.validarEObterItensParaAgendamento(List.of(1L, 2L)))
            .thenReturn(List.of(criarServico(1L, 50.0), criarProduto(2L, 30.0)));
        when(clienteService.buscarOuCriarClientePorEmail(req.nome(), req.email(), null)).thenReturn(cliente);
        when(agendamentoRepository.save(any())).thenAnswer(invocation -> {
            AgendamentoEntity entidade = invocation.getArgument(0);
            entidade.setAgendamentoId(10L);
            return entidade;
        });

        var response = agendamentoService.criarAgendamentoAdmin(req);

        assertThat(response.agendamentoId()).isEqualTo(10L);
        assertThat(response.clienteEmail()).isEqualTo("cliente@teste.com");
        assertThat(response.clienteTelefone()).isNull();
        assertThat(response.dataAgendamento()).isEqualTo(req.data());
        assertThat(response.horaAgendamento()).isEqualTo(req.horario());
        assertThat(response.valorTotal()).isEqualTo(80.0);
        assertThat(response.itens()).containsExactly("Corte", "Pomada");
    }

    @Test
    void criarAgendamentoAdmin_deveLancarBadRequest_quandoItemInexistente() {
        AgendamentoAdminRequestDTO req = new AgendamentoAdminRequestDTO(
            "Cliente", "cliente@teste.com", null, LocalDate.now().plusDays(1), LocalTime.of(10, 0), List.of(1L, 999L));

        when(agendamentoRepository.existsByDataAgendamentoAndHoraAgendamentoAndStatusAgendamentoTrue(req.data(), req.horario()))
            .thenReturn(false);
        when(servicoPrestadoService.validarEObterItensParaAgendamento(List.of(1L, 999L)))
            .thenThrow(new AppException("Os seguintes itens não estão disponíveis para agendamento: [999]", HttpStatus.BAD_REQUEST));

        assertThatThrownBy(() -> agendamentoService.criarAgendamentoAdmin(req))
            .isInstanceOf(AppException.class)
            .extracting(ex -> ((AppException) ex).getHttpStatus())
            .isEqualTo(HttpStatus.BAD_REQUEST);

        verify(clienteService, never()).buscarOuCriarClientePorEmail(any(), any(), any());
        verify(agendamentoRepository, never()).save(any());
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

    private static final String EMAIL_USUARIO = "cliente@teste.com";

    private AgendamentoEntity criarAgendamentoDoCliente(Long id, String emailCliente, boolean ativo) {
        AgendamentoEntity agendamento = new AgendamentoEntity();
        agendamento.setAgendamentoId(id);
        agendamento.setCliente(new ClienteEntity("CLIENTE", emailCliente, null));
        agendamento.setDataAgendamento(LocalDate.now().plusDays(1));
        agendamento.setHoraAgendamento(LocalTime.of(10, 0));
        agendamento.setValorTotal(50.0);
        agendamento.setItens(new java.util.ArrayList<>(List.of(criarServico(1L, 50.0))));
        agendamento.setStatusAgendamento(ativo);
        return agendamento;
    }

    private void usuarioExiste() {
        when(usuarioRepository.findByEmail(EMAIL_USUARIO)).thenReturn(Optional.of(new UsuarioEntity(EMAIL_USUARIO, Set.of())));
    }

    @Test
    void retornarTodosAgendamentosAtivosDoUsuario_deveConverterAgendamentosDoEmail() {
        usuarioExiste();
        when(agendamentoRepository.buscarAgendamentosAtivosPorEmail(EMAIL_USUARIO))
            .thenReturn(List.of(criarAgendamentoDoCliente(5L, EMAIL_USUARIO, true)));

        var response = agendamentoService.retornarTodosAgendamentosAtivosDoUsuario(EMAIL_USUARIO);

        assertThat(response).hasSize(1);
        assertThat(response.get(0).idAgendamento()).isEqualTo(5L);
        assertThat(response.get(0).statusAgendamento()).isTrue();
        assertThat(response.get(0).servicosProdutos()).extracting("nome").containsExactly("Corte");
    }

    @Test
    void retornarTodosAgendamentosAtivosDoUsuario_deveLancarNotFound_quandoUsuarioNaoExiste() {
        when(usuarioRepository.findByEmail(EMAIL_USUARIO)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> agendamentoService.retornarTodosAgendamentosAtivosDoUsuario(EMAIL_USUARIO))
            .isInstanceOf(AppException.class)
            .extracting(ex -> ((AppException) ex).getHttpStatus())
            .isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void cancelarAgendamento_deveApenasDesativar_semExcluir() {
        usuarioExiste();
        AgendamentoEntity agendamento = criarAgendamentoDoCliente(5L, EMAIL_USUARIO, true);
        when(agendamentoRepository.findById(5L)).thenReturn(Optional.of(agendamento));
        when(agendamentoRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        var response = agendamentoService.cancelarAgendamento(5L, EMAIL_USUARIO);

        assertThat(response.statusAgendamento()).isFalse();
        assertThat(agendamento.getStatusAgendamento()).isFalse();
        verify(agendamentoRepository, never()).deleteById(anyLong());
        verify(agendamentoRepository, never()).delete(any());
        verify(sseEmiterManager).notificarCancelamentoAgendamento(
            argThat(dto -> dto.agendamentoId().equals(5L) && Boolean.FALSE.equals(dto.statusAgendamento())));
    }

    @Test
    void cancelarAgendamento_deveLancarNotFound_quandoAgendamentoNaoExiste() {
        usuarioExiste();
        when(agendamentoRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> agendamentoService.cancelarAgendamento(99L, EMAIL_USUARIO))
            .isInstanceOf(AppException.class)
            .extracting(ex -> ((AppException) ex).getHttpStatus())
            .isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void cancelarAgendamento_naoDeveCancelarAgendamentoDeOutroUsuario() {
        usuarioExiste();
        AgendamentoEntity deOutro = criarAgendamentoDoCliente(6L, "outro@teste.com", true);
        when(agendamentoRepository.findById(6L)).thenReturn(Optional.of(deOutro));

        assertThatThrownBy(() -> agendamentoService.cancelarAgendamento(6L, EMAIL_USUARIO))
            .isInstanceOf(AppException.class)
            .extracting(ex -> ((AppException) ex).getHttpStatus())
            .isEqualTo(HttpStatus.NOT_FOUND);

        assertThat(deOutro.getStatusAgendamento()).isTrue();
        verify(agendamentoRepository, never()).save(any());
    }

    @Test
    void cancelarAgendamento_deveLancarConflito_quandoJaCancelado() {
        usuarioExiste();
        when(agendamentoRepository.findById(5L)).thenReturn(Optional.of(criarAgendamentoDoCliente(5L, EMAIL_USUARIO, false)));

        assertThatThrownBy(() -> agendamentoService.cancelarAgendamento(5L, EMAIL_USUARIO))
            .isInstanceOf(AppException.class)
            .extracting(ex -> ((AppException) ex).getHttpStatus())
            .isEqualTo(HttpStatus.CONFLICT);

        verify(agendamentoRepository, never()).save(any());
        verify(sseEmiterManager, never()).notificarCancelamentoAgendamento(any());
    }
}
