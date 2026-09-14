package com.jbkloh.dvd.controller;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.jbkloh.dvd.config.CacheConfig;
import com.jbkloh.dvd.config.LimitRequest;
import com.jbkloh.dvd.config.RSAKeyProperties;
import com.jbkloh.dvd.config.RateLimiterService;
import com.jbkloh.dvd.config.SegurancaConfig;
import com.jbkloh.dvd.config.SseEmiterManager;
import com.jbkloh.dvd.repository.UsuarioRepository;
import com.jbkloh.dvd.service.AgendamentoService;
import com.jbkloh.dvd.service.ServicoPrestadoService;

/**
 * Diagnóstico temporário: reproduz o bug relatado de que o painel admin não
 * recebe eventos SSE em tempo real.
 *
 * Causa raiz: o frontend (app/admin/agendamentos/page.tsx) conecta em
 * "{apiUrl}/api/agendamento/stream", mas o endpoint real, exposto pelo
 * AdminController, é "/admin/stream". Como o apiUrl aponta direto para o
 * backend (via NEXT_PUBLIC_API_URL / túnel Cloudflare) e não passa pelo
 * rewrite do Next.js, o EventSource nunca acerta a rota certa.
 */
@WebMvcTest(AdminController.class)
@Import({SegurancaConfig.class, RSAKeyProperties.class, LimitRequest.class, CacheConfig.class, RateLimiterService.class})
@TestPropertySource(properties = "url.frontend=http://localhost:3000")
class SseStreamRouteDiagnosticTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AgendamentoService agendamentoService;

    @MockitoBean
    private ServicoPrestadoService servicoPrestadoService;

    @MockitoBean
    private UsuarioRepository usuarioRepository;

    @MockitoBean
    private SseEmiterManager sseEmiterManager;

    @Test
    @WithMockUser(roles = "ADMIN")
    void rotaRealDeStreamFuncionaComoSse() throws Exception {
        when(sseEmiterManager.addEmitter()).thenReturn(new SseEmitter());

        // Rota correta: o Spring MVC inicia um processamento assíncrono (SseEmitter),
        // que é exatamente o comportamento esperado de um endpoint de streaming.
        mockMvc.perform(get("/admin/stream"))
            .andExpect(status().isOk())
            .andExpect(request().asyncStarted());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void rotaChamadaPeloFrontendNaoExiste() throws Exception {
        // Esta é exatamente a URL que o frontend usa hoje: `${apiUrl}/api/agendamento/stream`.
        // Ela não bate com nenhum @RequestMapping do backend, então cai no
        // resource handler padrão do Spring e nunca vira uma conexão SSE
        // (aqui o GlobalExceptionHandler ainda mascara isso como 500 em vez de 404,
        // mas o ponto central é: não é 200 nem text/event-stream, logo o EventSource
        // do navegador nunca recebe dados).
        mockMvc.perform(get("/api/agendamento/stream"))
            .andExpect(result -> org.junit.jupiter.api.Assertions.assertNotEquals(
                200, result.getResponse().getStatus(),
                "Rota inexistente não deveria responder 200"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void rotaDeDiaChamadaPeloFrontendNaoExiste() throws Exception {
        // `${apiUrl}/api/agendamento/dia?data=...` também não existe; a real é /admin/agendamentos/dia
        mockMvc.perform(get("/api/agendamento/dia").param("data", "2026-09-13"))
            .andExpect(result -> org.junit.jupiter.api.Assertions.assertNotEquals(
                200, result.getResponse().getStatus(),
                "Rota inexistente não deveria responder 200"));
    }
}
