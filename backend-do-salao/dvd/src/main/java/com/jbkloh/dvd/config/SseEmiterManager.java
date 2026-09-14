package com.jbkloh.dvd.config;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.fasterxml.jackson.databind.ObjectMapper;

@Component
public class SseEmiterManager {

    private static final Logger log = LoggerFactory.getLogger(SseEmiterManager.class);
    private static final Long EMITTER_TIMEOUT = 3_600_000L;

    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();
    private final ExecutorService sseExecutor = Executors.newFixedThreadPool(10);
    
    // Injetado via construtor do Spring para reaproveitar as configurações de LocalDate/LocalTime
    private final ObjectMapper objectMapper;

    public SseEmiterManager(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public SseEmitter addEmitter() {
        SseEmitter emitter = new SseEmitter(EMITTER_TIMEOUT);
        this.emitters.add(emitter);
        log.info("[SSE] Novo cliente conectado. Total de conexões ativas: {}", this.emitters.size());

        try {
            emitter.send(SseEmitter.event()
                    .name("connect")
                    .data("connected")
                    .reconnectTime(3000));
        } catch (Exception e) {
            log.warn("[SSE] Falha ao enviar evento de conexão inicial. Removendo emitter.");
            this.emitters.remove(emitter);
        }

        emitter.onCompletion(() -> this.emitters.remove(emitter));
        emitter.onTimeout(() -> {
            emitter.complete();
            this.emitters.remove(emitter);
        });
        emitter.onError((ex) -> this.emitters.remove(emitter));

        return emitter;
    }

    public void sendToAll(Object data) {
        if (this.emitters.isEmpty()) {
            log.warn("[SSE] Nenhum cliente conectado na lista do SseEmiterManager para receber a notificação.");
            return;
        }

        sseExecutor.execute(() -> {
            String jsonPayload;
            try {
                // Serializa o DTO em JSON utilizando o ObjectMapper nativo do Spring
                jsonPayload = objectMapper.writeValueAsString(data);
            } catch (Exception e) {
                log.error("[SSE] ERRO ao converter DTO para JSON: {}", e.getMessage(), e);
                return;
            }

            List<SseEmitter> deadEmitters = new CopyOnWriteArrayList<>();

            for (SseEmitter emitter : this.emitters) {
                try {
                    emitter.send(SseEmitter.event()
                            .name("agendamento-atualizado")
                            .data(jsonPayload));
                    log.info("[SSE] Evento agendamento-atualizado enviado com sucesso para o cliente.");
                } catch (Exception e) {
                    log.warn("[SSE] Falha na escrita do emitter. Marcando para remoção.");
                    deadEmitters.add(emitter);
                }
            }

            if (!deadEmitters.isEmpty()) {
                this.emitters.removeAll(deadEmitters);
            }
        });
    }

    @Scheduled(fixedRate = 25000)
    public void sendHeartbeat() {
        if (this.emitters.isEmpty()) {
            return;
        }

        List<SseEmitter> deadEmitters = new CopyOnWriteArrayList<>();

        for (SseEmitter emitter : this.emitters) {
            try {
                emitter.send(SseEmitter.event()
                        .name("ping")
                        .data("keep-alive"));
            } catch (Exception e) {
                deadEmitters.add(emitter);
            }
        }

        if (!deadEmitters.isEmpty()) {
            this.emitters.removeAll(deadEmitters);
        }
    }
}