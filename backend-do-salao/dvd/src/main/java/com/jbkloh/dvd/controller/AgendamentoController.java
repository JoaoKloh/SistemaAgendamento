package com.jbkloh.dvd.controller;

import java.time.LocalDate;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.jbkloh.dvd.dto.response.AgendamentoResponseDTO;
import com.jbkloh.dvd.service.AgendamentoService;

import jakarta.validation.Valid;

import com.jbkloh.dvd.dto.request.AgendamentoRequestDTO;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/agendamento")
@RequiredArgsConstructor
public class AgendamentoController {
    private final AgendamentoService agendamentoService;

    @PostMapping("/criar")
    public ResponseEntity<AgendamentoResponseDTO> criarAgendamento(@Valid @RequestBody AgendamentoRequestDTO req){
            AgendamentoResponseDTO response = agendamentoService.criarAgendamento(req);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/ocupados")
    public ResponseEntity<List<String>> getHorariosOcupados(
            @RequestParam("data") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate data) {
        
        List<String> ocupados = agendamentoService.listarHorariosOcupados(data);
        return ResponseEntity.ok(ocupados);
    }
}
