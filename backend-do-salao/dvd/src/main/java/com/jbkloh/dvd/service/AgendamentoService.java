package com.jbkloh.dvd.service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import com.jbkloh.dvd.dto.request.AgendamentoRequestDTO;
import com.jbkloh.dvd.dto.request.AgendamentoUpdateRequestDTO;
import com.jbkloh.dvd.dto.response.AgendamentoDetalhadoResponseDTO;
import com.jbkloh.dvd.dto.response.AgendamentoResponseDTO;
import com.jbkloh.dvd.dto.response.DashboardResumoResponseDTO;
import com.jbkloh.dvd.dto.response.ItemRankingComTipoResponseDTO;
import com.jbkloh.dvd.dto.response.ItemRankingResponseDTO;
import com.jbkloh.dvd.dto.response.ResumoAgendamentosResponseDTO;
import com.jbkloh.dvd.enums.TipoItem;
import com.jbkloh.dvd.exception.AppException;
import com.jbkloh.dvd.model.AgendamentoEntity;
import com.jbkloh.dvd.model.ClienteEntity;
import com.jbkloh.dvd.model.ServicoEntity;
import com.jbkloh.dvd.repository.AgendamentoRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j 
@RequiredArgsConstructor
public class AgendamentoService {

    private final AgendamentoRepository agendamentoRepository;
    private final ClienteService clienteService;
    private final ServicoPrestadoService servicoPrestadoService;
    private final SseService sseService;
    private final EmailService emailService;
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");

    private static final ZoneId ZONA_SAO_PAULO = ZoneId.of("America/Sao_Paulo");

    /**
     * Resolve o período usado nos relatórios do dashboard: usa as datas
     * informadas quando presentes e cai no padrão (do primeiro dia do mês
     * atual até hoje) quando ausentes.
     */
    private record Periodo(LocalDate dataInicio, LocalDate dataFim) {}

    private Periodo resolverPeriodo(LocalDate dataInicio, LocalDate dataFim) {
        LocalDate hoje = LocalDate.now(ZONA_SAO_PAULO);
        LocalDate inicioResolvido = dataInicio != null ? dataInicio : hoje.withDayOfMonth(1);
        LocalDate fimResolvido = dataFim != null ? dataFim : hoje;

        if (inicioResolvido.isAfter(fimResolvido)) {
            throw new AppException("A data inicial não pode ser posterior à data final", HttpStatus.BAD_REQUEST);
        }

        return new Periodo(inicioResolvido, fimResolvido);
    }

    @Transactional(readOnly = true)
    public List<AgendamentoDetalhadoResponseDTO> retornarAgendamentosDoDia(LocalDate data) {
        return agendamentoRepository.findByDataAgendamentoOrderByHoraAgendamentoAsc(data)
                .stream()
                .map(this::converterParaDetalhadoDTO)
                .collect(Collectors.toList());
    }

    private AgendamentoDetalhadoResponseDTO converterParaDetalhadoDTO(AgendamentoEntity agendamento){
        return new AgendamentoDetalhadoResponseDTO(agendamento);
    }

    @Transactional
    public AgendamentoResponseDTO criarAgendamento(AgendamentoRequestDTO req) {
        if (agendamentoRepository.existsByDataAgendamentoAndHoraAgendamento(req.dataAgendamento(), req.horaAgendamento())) {
            throw new AppException("Este agendamento não pode ser feito, pois outra pessoa já reservou o horário selecionado", HttpStatus.CONFLICT);
        }

        if (agendamentoRepository.existsDuplicidadePorEmailEData(req.email(), req.dataAgendamento())) {
            throw new AppException("Não é possível agendar dois horários no mesmo dia", HttpStatus.BAD_REQUEST);
        }
        
        ClienteEntity cliente = clienteService.buscarOuCriarCliente(req.nome(), req.email(), req.telefone());

        List<ServicoEntity> itensSelecionados = req.itensIds().stream()
                .map(servicoPrestadoService::validarEObterServicoParaAgendamento)
                .toList();

        Double valorTotal = itensSelecionados.stream()
                .mapToDouble(ServicoEntity::getPreco)
                .sum();

        AgendamentoEntity agendamento = new AgendamentoEntity();
        agendamento.setStatusAgendamento(true);
        agendamento.setCliente(cliente);
        agendamento.setDataAgendamento(req.dataAgendamento());
        agendamento.setHoraAgendamento(req.horaAgendamento());
        agendamento.setItens(itensSelecionados);
        agendamento.setValorTotal(valorTotal);

        AgendamentoEntity agendamentoSalvo = agendamentoRepository.save(agendamento);
        AgendamentoDetalhadoResponseDTO sseDto = new AgendamentoDetalhadoResponseDTO(agendamentoSalvo);

        // Registra a execução do SSE para rodar exclusivamente APÓS o commit no banco
        if (TransactionSynchronizationManager.isActualTransactionActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    log.info("[SSE] Transação commitada com sucesso. Disparando sendToAll...");
                    sseService.notificarNovoAgendamento(sseDto);
                    emailService.enviarEmailAgendamentoConfirmado(sseDto);
                }
            });
        } else {
            log.info("[SSE] Nenhuma transação ativa detectada. Disparando sendToAll diretamente...");
            sseService.notificarNovoAgendamento(sseDto);
            emailService.enviarEmailAgendamentoConfirmado(sseDto);
        }

        return new AgendamentoResponseDTO(req.dataAgendamento(), req.horaAgendamento());
    }

    @Transactional
    public AgendamentoDetalhadoResponseDTO atualizarAgendamento(AgendamentoUpdateRequestDTO req) {
        AgendamentoEntity agendamento = agendamentoRepository.findById(req.idAgendamento())
        .orElseThrow(() -> new AppException("Agendamento não encontrado", HttpStatus.NOT_FOUND));

        List<ServicoEntity> novosItens = req.itensIds().stream()
                .map(servicoPrestadoService::validarEObterServicoParaAgendamento)
                .collect(Collectors.toList());

        Double novoValorTotal = novosItens.stream()
                .mapToDouble(ServicoEntity::getPreco)
                .sum();

                agendamento.setDataAgendamento(req.dataAgendamento());
                agendamento.setHoraAgendamento(req.horaAgendamento());
                agendamento.setStatusAgendamento(req.statusAgendamento());
                agendamento.setValorTotal(novoValorTotal);
            
                agendamento.getItens().clear();
                agendamento.getItens().addAll(novosItens);
        
        agendamentoRepository.save(agendamento);

        AgendamentoEntity agendamentoSalvo = agendamentoRepository.save(agendamento);
        AgendamentoDetalhadoResponseDTO sseDto = new AgendamentoDetalhadoResponseDTO(agendamentoSalvo);

        if (TransactionSynchronizationManager.isActualTransactionActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    sseService.notificarNovoAgendamento(sseDto);
                }
            });
        } else {
            sseService.notificarNovoAgendamento(sseDto);
        }

        return sseDto;
    }
    @Transactional
    public void deletarAgendamento(Long id) {
        if (!agendamentoRepository.existsById(id)) {
            throw new AppException("Agendamento não encontrado para remoção.", HttpStatus.NOT_FOUND);
        }
        agendamentoRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<AgendamentoDetalhadoResponseDTO> retornarAgendamentos() {
        return agendamentoRepository.findAll()
                .stream()
                .map(AgendamentoDetalhadoResponseDTO::new)
                .toList();
    }

    /**
     * Monta o resumo completo do dashboard administrativo (quantidade de
     * agendamentos, faturamento e rankings de serviços/produtos) para o
     * período informado usando apenas DUAS consultas ao banco: uma para o
     * resumo financeiro e outra, agrupando por tipo, para os rankings de
     * serviços e produtos — em vez das seis consultas independentes que
     * seriam necessárias buscando cada métrica separadamente.
     */
    @Transactional(readOnly = true)
    public DashboardResumoResponseDTO retornarDashboardResumo(LocalDate dataInicio, LocalDate dataFim, Integer limite) {
        Periodo periodo = resolverPeriodo(dataInicio, dataFim);
        Integer limiteFinal = (limite != null && limite > 0) ? limite : 5;

        ResumoAgendamentosResponseDTO resumo = agendamentoRepository.buscarResumoAgendamentosDoPeriodo(
                periodo.dataInicio(),
                periodo.dataFim()
        );

        List<ItemRankingComTipoResponseDTO> rankingCompleto = agendamentoRepository.buscarRankingItensDoPeriodo(
                periodo.dataInicio(),
                periodo.dataFim()
        );

        List<ItemRankingResponseDTO> rankingServicos = filtrarRankingPorTipo(rankingCompleto, TipoItem.SERVICO, limiteFinal);
        List<ItemRankingResponseDTO> rankingProdutos = filtrarRankingPorTipo(rankingCompleto, TipoItem.PRODUTO, limiteFinal);

        return new DashboardResumoResponseDTO(
                periodo.dataInicio(),
                periodo.dataFim(),
                resumo.quantidadeAgendamentos(),
                resumo.faturamentoTotal(),
                rankingServicos.isEmpty() ? "Nenhum serviço agendado" : rankingServicos.get(0).nome(),
                rankingProdutos.isEmpty() ? "Nenhum produto vendido" : rankingProdutos.get(0).nome(),
                rankingServicos,
                rankingProdutos
        );
    }

    private List<ItemRankingResponseDTO> filtrarRankingPorTipo(
            List<ItemRankingComTipoResponseDTO> rankingCompleto,
            TipoItem tipo,
            Integer limite
    ) {
        return rankingCompleto.stream()
                .filter(item -> item.tipo() == tipo)
                .limit(limite)
                .map(item -> new ItemRankingResponseDTO(item.nome(), item.quantidadeAgendamentos()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<String> listarHorariosOcupados(LocalDate data) {
        return agendamentoRepository.findHorariosOcupadosPorData(data)
                .stream()
                .map(horario -> horario.format(TIME_FORMATTER))
                .toList();
    }
}
