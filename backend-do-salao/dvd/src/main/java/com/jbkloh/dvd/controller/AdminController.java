package com.jbkloh.dvd.controller;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.jbkloh.dvd.config.SseEmiterManager;
import com.jbkloh.dvd.dto.request.AgendamentoUpdateRequestDTO;
import com.jbkloh.dvd.dto.request.CriarServicoRequestDTO;
import com.jbkloh.dvd.dto.response.AgendamentoDetalhadoResponseDTO;
import com.jbkloh.dvd.dto.response.AgendamentoResponseDTO;
import com.jbkloh.dvd.dto.response.ItemRankingResponseDTO;
import com.jbkloh.dvd.service.AgendamentoService;
import com.jbkloh.dvd.service.ServicoPrestadoService;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AgendamentoService agendamentoService;
    private final ServicoPrestadoService servicoPrestadoService;
    private final SseEmiterManager sseEmiterManager;

    @Autowired
    public AdminController(AgendamentoService agendamentoService, ServicoPrestadoService servicoPrestadoService, SseEmiterManager sseEmiterManager) {
        this.agendamentoService = agendamentoService;
        this.servicoPrestadoService = servicoPrestadoService;
        this.sseEmiterManager = sseEmiterManager;
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamAgendamentosAdmin(HttpServletResponse response) {
    // Força os cabeçalhos diretamente no HttpServletResponse para o Cloudflare Tunnel
    response.setHeader("Cache-Control", "no-cache, no-transform");
    response.setHeader("X-Accel-Buffering", "no");
    response.setHeader("Connection", "keep-alive");
    
    return sseEmiterManager.addEmitter();
}

    @GetMapping("/agendamentos/dia")
    public ResponseEntity<List<AgendamentoDetalhadoResponseDTO>> retornarAgendamentosDoDia(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate data
    ) {
        if (data == null) {
            data = LocalDate.now(ZoneId.of("America/Sao_Paulo"));
        }
        List<AgendamentoDetalhadoResponseDTO> agendamentos = agendamentoService.retornarAgendamentosDoDia(data);
        return ResponseEntity.ok(agendamentos);
    }
    
    @PostMapping("/criarServico")
    public ResponseEntity<Void> criarServico(@Valid @RequestBody CriarServicoRequestDTO req) {
        servicoPrestadoService.criarServico(req);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PostMapping("/criarProduto")
    public ResponseEntity<Void> criarProduto(@Valid @RequestBody CriarServicoRequestDTO req) {
        servicoPrestadoService.criarProduto(req);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @DeleteMapping("/apagarServico/{id}")
    public ResponseEntity<Void> apagarServico(@PathVariable Long id) {
        servicoPrestadoService.deletarServico(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/atualizar")
    public ResponseEntity<AgendamentoResponseDTO> atualizarAgendamento(@Valid @RequestBody AgendamentoUpdateRequestDTO req) {
        AgendamentoResponseDTO response = agendamentoService.atualizarAgendamento(req);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/apagar/{id}")
    public ResponseEntity<Void> apagarAgendamento(@PathVariable Long id) {
        agendamentoService.deletarAgendamento(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/agendamentos")
    public ResponseEntity<List<AgendamentoDetalhadoResponseDTO>> retornarAgendamentos() {
        List<AgendamentoDetalhadoResponseDTO> agendamentos = agendamentoService.retornarAgendamentos();
        return ResponseEntity.ok(agendamentos);
    }

    @GetMapping("/agendamentosDoMes")
    public ResponseEntity<Integer> quantidadeDeAgendamentosDoMes(
            @RequestParam(required = false) Integer mes,
            @RequestParam(required = false) Integer ano
    ) {
        Integer quantidade = agendamentoService.retornarQuantidadeAgendamentosDoMes(mes, ano);
        return ResponseEntity.ok(quantidade);
    }

    @GetMapping("/faturamentoDoMes")
    public ResponseEntity<Double> getFaturamentoDoMes(
            @RequestParam(required = false) Integer mes,
            @RequestParam(required = false) Integer ano
    ) {
        Double faturamento = agendamentoService.retornarFaturamentoDoMes(mes, ano);
        return ResponseEntity.ok(faturamento);
    }

    @GetMapping("/servicoMaisSolicitado")
    public ResponseEntity<String> getServicoMaisSolicitado(
            @RequestParam(required = false) Integer mes,
            @RequestParam(required = false) Integer ano
    ) {
        String servico = agendamentoService.retornarServicoMaisSolicitadoDoMes(mes, ano);
        return ResponseEntity.ok(servico);
    }

    @GetMapping("/produtoMaisSolicitado")
    public ResponseEntity<String> getProdutoMaisSolicitado(
            @RequestParam(required = false) Integer mes,
            @RequestParam(required = false) Integer ano
    ) {
        String produto = agendamentoService.retornarProdutoMaisSolicitadoDoMes(mes, ano);
        return ResponseEntity.ok(produto);
    }

    @GetMapping("/topServicos")
    public ResponseEntity<List<ItemRankingResponseDTO>> getTopServicos(
            @RequestParam(required = false) Integer mes,
            @RequestParam(required = false) Integer ano,
            @RequestParam(required = false, defaultValue = "5") Integer limite
    ) {
        List<ItemRankingResponseDTO> ranking = agendamentoService.retornarTopServicosDoMes(mes, ano, limite);
        return ResponseEntity.ok(ranking);
    }

    @GetMapping("/topProdutos")
    public ResponseEntity<List<ItemRankingResponseDTO>> getTopProdutos(
            @RequestParam(required = false) Integer mes,
            @RequestParam(required = false) Integer ano,
            @RequestParam(required = false, defaultValue = "5") Integer limite
    ) {
        List<ItemRankingResponseDTO> ranking = agendamentoService.retornarTopProdutosDoMes(mes, ano, limite);
        return ResponseEntity.ok(ranking);
    }
}