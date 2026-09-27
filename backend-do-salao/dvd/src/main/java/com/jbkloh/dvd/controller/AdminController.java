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
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.jbkloh.dvd.dto.request.AgendamentoAdminRequestDTO;
import com.jbkloh.dvd.dto.request.AgendamentoUpdateRequestDTO;
import com.jbkloh.dvd.dto.request.CriarServicoRequestDTO;
import com.jbkloh.dvd.dto.request.PortfolioRequestDTO;
import com.jbkloh.dvd.dto.response.AgendamentoDetalhadoResponseDTO;
import com.jbkloh.dvd.dto.response.DashboardResumoResponseDTO;
import com.jbkloh.dvd.dto.response.PortfolioResponseDTO;
import com.jbkloh.dvd.service.AgendamentoService;
import com.jbkloh.dvd.service.PortfolioService;
import com.jbkloh.dvd.service.ServicoPrestadoService;
import com.jbkloh.dvd.service.SseService;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AgendamentoService agendamentoService;
    private final ServicoPrestadoService servicoPrestadoService;
    private final SseService sseService;
    private final PortfolioService portfolioService;

    @Autowired
    public AdminController(
            AgendamentoService agendamentoService,
            ServicoPrestadoService servicoPrestadoService,
            SseService sseService,
            PortfolioService portfolioService
    ) {
        this.agendamentoService = agendamentoService;
        this.servicoPrestadoService = servicoPrestadoService;
        this.sseService = sseService;
        this.portfolioService = portfolioService;
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE + ";charset=UTF-8")
    public SseEmitter streamAgendamentosAdmin(HttpServletResponse response) {
        response.setHeader("Cache-Control", "no-cache, no-transform");
        response.setHeader("X-Accel-Buffering", "no");
        response.setHeader("Connection", "keep-alive");
        response.setContentType("text/event-stream;charset=UTF-8");

        return sseService.inscricaoStreamAdmin();
    }

    @GetMapping("/agendamento/dia")
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

    @PostMapping("/criar/portfolio")
    public ResponseEntity<PortfolioResponseDTO> criarFotoPortfolio(@Valid @RequestBody PortfolioRequestDTO req) {
        PortfolioResponseDTO response = portfolioService.criarFoto(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/deletar/portfolio/{id}")
    public ResponseEntity<Void> apagarFotoPortfolio(@PathVariable Long id) {
        portfolioService.deletarFoto(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/agendamento/criar")
    public ResponseEntity<AgendamentoDetalhadoResponseDTO> criarAgendamento(@Valid @RequestBody AgendamentoAdminRequestDTO req) {
        AgendamentoDetalhadoResponseDTO response = agendamentoService.criarAgendamentoAdmin(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/atualizar")
    public ResponseEntity<AgendamentoDetalhadoResponseDTO> atualizarAgendamento(@Valid @RequestBody AgendamentoUpdateRequestDTO req) {
        AgendamentoDetalhadoResponseDTO response = agendamentoService.atualizarAgendamento(req);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/agendamento/{idAgendamento}/cancelar")
    public ResponseEntity<AgendamentoDetalhadoResponseDTO> cancelarAgendamento(@PathVariable Long idAgendamento) {
        AgendamentoDetalhadoResponseDTO response = agendamentoService.cancelarAgendamentoAdmin(idAgendamento);
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

    @GetMapping("/dashboardResumo")
    public ResponseEntity<DashboardResumoResponseDTO> getDashboardResumo(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFim,
            @RequestParam(required = false, defaultValue = "5") Integer limite
    ) {
        DashboardResumoResponseDTO resumo = agendamentoService.retornarDashboardResumo(dataInicio, dataFim, limite);
        return ResponseEntity.ok(resumo);
    }
}