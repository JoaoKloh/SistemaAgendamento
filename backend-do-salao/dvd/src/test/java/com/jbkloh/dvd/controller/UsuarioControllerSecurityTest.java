package com.jbkloh.dvd.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
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
import com.jbkloh.dvd.repository.UsuarioRepository;
import com.jbkloh.dvd.service.AgendamentoService;

/**
 * Garante que "Meus agendamentos" exige autenticação e que o e-mail usado
 * vem do contexto do Spring Security, e não de dados enviados pelo cliente.
 */
@Import({
    SegurancaConfig.class,
    RSAKeyProperties.class,
    LimitRequest.class,
    CacheConfig.class,
    RateLimiterService.class
})
@WebMvcTest(UsuarioController.class)
@TestPropertySource(properties = {
    "url.frontend=http://localhost:3000",
    "RSA_PUBLIC_KEY_PATH=src/test/resources/keys/public.pem",
    "RSA_PRIVATE_KEY_PATH=src/test/resources/keys/private.pem"
})
class UsuarioControllerSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AgendamentoService agendamentoService;

    @MockitoBean
    private UsuarioRepository usuarioRepository;

    @Test
    void semAutenticacao_naoDeveListarAgendamentos() throws Exception {
        mockMvc.perform(get("/usuario/agendamentos"))
            .andExpect(status().isUnauthorized());
        verify(agendamentoService, never()).retornarTodosAgendamentosAtivosDoUsuario(anyString());
    }

    @Test
    void semAutenticacao_naoDeveCancelarAgendamento() throws Exception {
        mockMvc.perform(patch("/usuario/agendamentos/1/cancelar"))
            .andExpect(status().isUnauthorized());
        verify(agendamentoService, never()).cancelarAgendamento(any(), any());
    }

    @Test
    @WithMockUser(username = "cliente@teste.com", roles = "USER")
    void usuarioAutenticado_deveListarUsandoEmailDoContexto() throws Exception {
        when(agendamentoService.retornarTodosAgendamentosAtivosDoUsuario("cliente@teste.com")).thenReturn(List.of());

        mockMvc.perform(get("/usuario/agendamentos").param("email", "outro@teste.com"))
            .andExpect(status().isOk());

        verify(agendamentoService).retornarTodosAgendamentosAtivosDoUsuario("cliente@teste.com");
    }

    @Test
    @WithMockUser(username = "cliente@teste.com", roles = "USER")
    void usuarioAutenticado_deveCancelarUsandoEmailDoContexto() throws Exception {
        mockMvc.perform(patch("/usuario/agendamentos/7/cancelar"))
            .andExpect(status().isOk());

        verify(agendamentoService).cancelarAgendamento(7L, "cliente@teste.com");
    }
}
