package com.jbkloh.dvd.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.jbkloh.dvd.config.SseEmiterManager;
import com.jbkloh.dvd.dto.response.AgendamentoDetalhadoResponseDTO;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SseService {

    private static final Logger log = LoggerFactory.getLogger(SseService.class);

    private final SseEmiterManager sseEmiterManager;

    /**
     * Registra um novo cliente HTTP/2 na stream SSE do painel administrativo.
     */
    public SseEmitter inscricaoStreamAdmin() {
        log.info("[SSE SERVICE] Registrando nova conexão de stream para o painel admin.");
        return sseEmiterManager.addEmitter();
    }

    /**
     * Transmite os dados do agendamento recém-criado para todos os clientes conectados.
     */
    public void notificarNovoAgendamento(AgendamentoDetalhadoResponseDTO agendamentoDto) {
        if (agendamentoDto == null) {
            log.warn("[SSE SERVICE] Objeto de agendamento nulo recebido para notificação. Operação abortada.");
            return;
        }

        log.info("[SSE SERVICE] Iniciando transmissão do agendamento ID: {} para o painel.", agendamentoDto.agendamentoId());
        sseEmiterManager.sendToAll(agendamentoDto);
    }

    /**
     * Transmite o cancelamento de um agendamento em um evento SSE próprio
     * ("agendamento-cancelado"), para o painel distinguir de criações/edições.
     */
    public void notificarCancelamentoAgendamento(AgendamentoDetalhadoResponseDTO agendamentoDto) {
        if (agendamentoDto == null) {
            log.warn("[SSE SERVICE] Objeto de agendamento nulo recebido para notificação de cancelamento. Operação abortada.");
            return;
        }

        log.info("[SSE SERVICE] Iniciando transmissão do cancelamento do agendamento ID: {} para o painel.", agendamentoDto.agendamentoId());
        sseEmiterManager.sendToAll("agendamento-cancelado", agendamentoDto);
    }
}