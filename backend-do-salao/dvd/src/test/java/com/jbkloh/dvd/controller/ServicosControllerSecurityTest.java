package com.jbkloh.dvd.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.jbkloh.dvd.config.CacheConfig;
import com.jbkloh.dvd.config.LimitRequest;
import com.jbkloh.dvd.config.RSAKeyProperties;
import com.jbkloh.dvd.config.RateLimiterService;
import com.jbkloh.dvd.config.SegurancaConfig;
import com.jbkloh.dvd.dto.response.ServicoResponseDTO;
import com.jbkloh.dvd.repository.UsuarioRepository;
import com.jbkloh.dvd.service.ServicoPrestadoService;

/**
 * "/servicos/**" é público no SegurancaConfig por causa das listagens do
 * catálogo; este teste garante que as rotas de edição continuem restritas a
 * ADMIN via @PreAuthorize, sem afetar as listagens públicas.
 */
@Import({
    SegurancaConfig.class,
    RSAKeyProperties.class,
    LimitRequest.class,
    CacheConfig.class,
    RateLimiterService.class
})
@WebMvcTest(ServicosController.class)
@TestPropertySource(properties = {
    "url.frontend=http://localhost:3000",
    "RSA_PUBLIC_KEY_PATH=src/test/resources/keys/public.pem",
    "RSA_PRIVATE_KEY_PATH=src/test/resources/keys/private.pem"
})
class ServicosControllerSecurityTest {

    private static final String CORPO_VALIDO = """
        {"nome":"Corte","preco":50.0,"detalhes":"Tesoura","duracao":"00:30:00","urlImagem":null}
        """;

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ServicoPrestadoService servicoPrestadoService;

    @MockitoBean
    private UsuarioRepository usuarioRepository;

    @Test
    void listagemContinuaPublica() throws Exception {
        when(servicoPrestadoService.listarServicos()).thenReturn(List.of());

        mockMvc.perform(get("/servicos"))
            .andExpect(status().isOk());
    }

    @Test
    void semAutenticacao_naoDeveAtualizarServico() throws Exception {
        mockMvc.perform(put("/servicos/1").contentType(MediaType.APPLICATION_JSON).content(CORPO_VALIDO))
            .andExpect(status().isForbidden());

        verify(servicoPrestadoService, never()).atualizarServico(any(), any());
    }

    @Test
    @WithMockUser(roles = "USER")
    void usuarioComum_naoDeveAtualizarProduto() throws Exception {
        mockMvc.perform(put("/servicos/produtos/1").contentType(MediaType.APPLICATION_JSON).content(CORPO_VALIDO))
            .andExpect(status().isForbidden());

        verify(servicoPrestadoService, never()).atualizarProduto(any(), any());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void admin_deveAtualizarServico() throws Exception {
        when(servicoPrestadoService.atualizarServico(eq(1L), any()))
            .thenReturn(new ServicoResponseDTO(1L, "Corte", "Tesoura", null, 50.0));

        mockMvc.perform(put("/servicos/1").contentType(MediaType.APPLICATION_JSON).content(CORPO_VALIDO))
            .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void admin_comNomeVazio_deveRetornarBadRequest() throws Exception {
        mockMvc.perform(put("/servicos/1").contentType(MediaType.APPLICATION_JSON)
                .content("{\"nome\":\"\",\"preco\":50.0,\"duracao\":\"00:30:00\"}"))
            .andExpect(status().isBadRequest());

        verify(servicoPrestadoService, never()).atualizarServico(any(), any());
    }
}
