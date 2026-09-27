package com.jbkloh.dvd.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.jbkloh.dvd.model.ClienteEntity;
import com.jbkloh.dvd.repository.ClienteRepository;
import com.jbkloh.dvd.repository.UsuarioRepository;

@ExtendWith(MockitoExtension.class)
class ClienteServiceTest {

    @Mock
    private ClienteRepository clienteRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    @InjectMocks
    private ClienteService clienteService;

    @Test
    void buscarOuCriarClientePorEmail_deveReutilizarClienteExistente_semApagarTelefone() {
        ClienteEntity existente = new ClienteEntity("JOAO", "joao@teste.com", "24999999999");
        existente.setClienteId(7L);
        when(clienteRepository.findByEmail("joao@teste.com")).thenReturn(Optional.of(existente));
        when(clienteRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        ClienteEntity resultado = clienteService.buscarOuCriarClientePorEmail("Joao", "joao@teste.com", null);

        assertThat(resultado).isSameAs(existente);
        assertThat(resultado.getClienteId()).isEqualTo(7L);
        assertThat(resultado.getTelefone()).isEqualTo("24999999999");
    }

    @Test
    void buscarOuCriarClientePorEmail_deveAtualizarTelefone_quandoInformado() {
        ClienteEntity existente = new ClienteEntity("JOAO", "joao@teste.com", null);
        when(clienteRepository.findByEmail("joao@teste.com")).thenReturn(Optional.of(existente));
        when(clienteRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        ClienteEntity resultado = clienteService.buscarOuCriarClientePorEmail("Joao", "joao@teste.com", "24988887777");

        assertThat(resultado.getTelefone()).isEqualTo("24988887777");
    }

    @Test
    void buscarOuCriarClientePorEmail_deveCriarCliente_quandoEmailNaoExiste() {
        when(clienteRepository.findByEmail("novo@teste.com")).thenReturn(Optional.empty());
        when(clienteRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        ClienteEntity resultado = clienteService.buscarOuCriarClientePorEmail("Maria", "novo@teste.com", "  ");

        assertThat(resultado.getNome()).isEqualTo("MARIA");
        assertThat(resultado.getEmail()).isEqualTo("novo@teste.com");
        assertThat(resultado.getTelefone()).isNull();
        assertThat(resultado.getUsuario()).isNull();
    }
}
