package com.jbkloh.dvd.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.jbkloh.dvd.dto.response.AgendamentoResponseUsuarioDTO;
import com.jbkloh.dvd.service.AgendamentoService;

import lombok.RequiredArgsConstructor;

// "/usuario/**" cai em anyRequest().authenticated() no SegurancaConfig. O
// e-mail sai do JWT (subject) via Spring Security, nunca do corpo/URL.
@RestController
@RequestMapping("/usuario")
@RequiredArgsConstructor
public class UsuarioController {

    private final AgendamentoService agendamentoService;

    @GetMapping("/agendamentos")
    public ResponseEntity<List<AgendamentoResponseUsuarioDTO>> retornarTodosAgendamentosAtivosDoUsuario(
            Authentication authentication
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(agendamentoService.retornarTodosAgendamentosAtivosDoUsuario(email));
    }

    @PatchMapping("/agendamentos/{idAgendamento}/cancelar")
    public ResponseEntity<AgendamentoResponseUsuarioDTO> cancelarAgendamento(
            @PathVariable Long idAgendamento,
            Authentication authentication
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(agendamentoService.cancelarAgendamento(idAgendamento, email));
    }
}
