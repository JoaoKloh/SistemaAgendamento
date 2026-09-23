package com.jbkloh.dvd.service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import com.jbkloh.dvd.dto.request.AgendamentoRequestDTO;
import com.jbkloh.dvd.dto.request.AgendamentoUpdateRequestDTO;
import com.jbkloh.dvd.dto.response.AgendamentoDetalhadoResponseDTO;
import com.jbkloh.dvd.dto.response.AgendamentoResponseDTO;
import com.jbkloh.dvd.dto.response.ItemRankingResponseDTO;
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
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");

    /**
     * Resolve o mês/ano usados nos relatórios: usa os valores informados
     * quando presentes e cai no mês/ano corrente quando ausentes.
     */
    private record Periodo(Integer mes, Integer ano) {}

    private Periodo resolverPeriodo(Integer mes, Integer ano) {
        LocalDate hoje = LocalDate.now();
        return new Periodo(
            mes != null ? mes : hoje.getMonthValue(),
            ano != null ? ano : hoje.getYear()
        );
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
                }
            });
        } else {
            log.info("[SSE] Nenhuma transação ativa detectada. Disparando sendToAll diretamente...");
            sseService.notificarNovoAgendamento(sseDto);
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

    @Transactional(readOnly = true)
    public Integer retornarQuantidadeAgendamentosDoMes(Integer mes, Integer ano) {
        Periodo periodo = resolverPeriodo(mes, ano);
        return agendamentoRepository.retornarQuantidadeAgendamentosDoMes(periodo.mes(), periodo.ano());
    }

    @Transactional(readOnly = true)
    public Double retornarFaturamentoDoMes(Integer mes, Integer ano) {
        Periodo periodo = resolverPeriodo(mes, ano);
        return agendamentoRepository.calcularFaturamentoDoMes(periodo.mes(), periodo.ano());
    }

    @Transactional(readOnly = true)
    public String retornarServicoMaisSolicitadoDoMes(Integer mes, Integer ano) {
        Periodo periodo = resolverPeriodo(mes, ano);

        List<String> resultado = agendamentoRepository.buscarServicoMaisSolicitadoDoMes(
                periodo.mes(),
                periodo.ano(),
                TipoItem.SERVICO,
                PageRequest.of(0, 1)
        );

        return resultado.isEmpty() ? "Nenhum serviço agendado" : resultado.get(0);
    }

    @Transactional(readOnly = true)
    public String retornarProdutoMaisSolicitadoDoMes(Integer mes, Integer ano) {
        Periodo periodo = resolverPeriodo(mes, ano);

        List<String> resultado = agendamentoRepository.buscarServicoMaisSolicitadoDoMes(
                periodo.mes(),
                periodo.ano(),
                TipoItem.PRODUTO,
                PageRequest.of(0, 1)
        );

        return resultado.isEmpty() ? "Nenhum produto vendido" : resultado.get(0);
    }

    @Transactional(readOnly = true)
    public List<ItemRankingResponseDTO> retornarTopProdutosDoMes(Integer mes, Integer ano, Integer limite) {
        Periodo periodo = resolverPeriodo(mes, ano);
        Integer limiteFinal = (limite != null) ? limite : 5;

        return agendamentoRepository.buscarRankingItensDoMes(
                periodo.mes(),
                periodo.ano(),
                TipoItem.PRODUTO,
                PageRequest.of(0, limiteFinal)
        );
    }

    @Transactional(readOnly = true)
    public List<ItemRankingResponseDTO> retornarTopServicosDoMes(Integer mes, Integer ano, Integer limite) {
        Periodo periodo = resolverPeriodo(mes, ano);
        Integer limiteFinal = (limite != null) ? limite : 5; // Padrão Top 5

        return agendamentoRepository.buscarRankingItensDoMes(
                periodo.mes(),
                periodo.ano(),
                TipoItem.SERVICO,
                PageRequest.of(0, limiteFinal)
        );
    }

    @Transactional(readOnly = true)
    public List<String> listarHorariosOcupados(LocalDate data) {
        return agendamentoRepository.findHorariosOcupadosPorData(data)
                .stream()
                .map(horario -> horario.format(TIME_FORMATTER))
                .toList();
    }
}
