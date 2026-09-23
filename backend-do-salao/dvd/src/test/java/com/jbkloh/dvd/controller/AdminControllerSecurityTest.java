package com.jbkloh.dvd.controller;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;


import java.util.List;

import org.junit.jupiter.api.Test;
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
import com.jbkloh.dvd.service.PortfolioService;
import com.jbkloh.dvd.service.ServicoPrestadoService;
import com.jbkloh.dvd.service.SseService;

/**
 * Teste de regressão para a falha crítica encontrada na revisão de arquitetura:
 * o {@code @PreAuthorize("hasRole('ADMIN')")} do {@link AdminController} não
 * tinha efeito porque nenhuma classe declarava {@code @EnableMethodSecurity}.
 * Sem essa anotação, o Spring Security 6 ignora silenciosamente a anotação e
 * qualquer usuário autenticado (mesmo com ROLE_USER) conseguia chamar rotas
 * administrativas. Este teste garante que a autorização por papel volte a ser
 * aplicada de fato.
 */
@Import({
    SegurancaConfig.class,
    RSAKeyProperties.class,
    LimitRequest.class,
    CacheConfig.class,
    RateLimiterService.class
})
@WebMvcTest(AdminController.class)
@TestPropertySource(properties = {
    "url.frontend=http://localhost:3000",
    "RSA_PUBLIC_KEY_PATH=src/test/resources/keys/public.pem",
    "RSA_PRIVATE_KEY_PATH=src/test/resources/keys/private.pem"
})class AdminControllerSecurityTest {

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

@MockitoBean
private SseService sseService;

@MockitoBean
private PortfolioService portfolioService;

    
    @Test
    void semAutenticacao_deveSerRejeitado() throws Exception {
        mockMvc.perform(get("/admin/agendamentos"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "USER")
    void usuarioComum_naoDeveAcessarRotaDeAdmin() throws Exception {
        mockMvc.perform(get("/admin/agendamentos"))
            .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void admin_deveAcessarRotaDeAdmin() throws Exception {
        when(agendamentoService.retornarAgendamentos()).thenReturn(List.of());

        mockMvc.perform(get("/admin/agendamentos"))
            .andExpect(status().isOk());
    }
}