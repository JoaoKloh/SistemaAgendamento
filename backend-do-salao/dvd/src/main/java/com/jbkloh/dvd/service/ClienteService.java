package com.jbkloh.dvd.service;

import java.util.Objects;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.jbkloh.dvd.exception.AppException;
import com.jbkloh.dvd.model.ClienteEntity;
import com.jbkloh.dvd.model.UsuarioEntity;
import com.jbkloh.dvd.repository.ClienteRepository;
import com.jbkloh.dvd.repository.UsuarioRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ClienteService {

    private final ClienteRepository clienteRepository;
    private final UsuarioRepository usuarioRepository;

    @Transactional
public ClienteEntity buscarOuCriarCliente(String nome, String email, String telefone) {
    String nomeUpper = nome.toUpperCase(); 
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();

    // 1. Fluxo para Usuário Autenticado
    if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
        String emailUsuarioLogado = auth.getName(); 
        UsuarioEntity usuario = usuarioRepository.findByEmail(emailUsuarioLogado)
            .orElseThrow(() -> new AppException("Usuário autenticado não encontrado.", HttpStatus.NOT_FOUND));

        // Busca o cliente prioritariamente pelo e-mail do usuário autenticado
        return clienteRepository.findByEmail(usuario.getEmail())
            .map(clienteExistente -> {
                if (!Objects.equals(clienteExistente.getNome(), nomeUpper)) {
                    clienteExistente.setNome(nomeUpper);
                }
                if (!Objects.equals(clienteExistente.getTelefone(), telefone)) {
                    clienteExistente.setTelefone(telefone);
                }
                if (clienteExistente.getUsuario() == null) {
                    clienteExistente.setUsuario(usuario);
                }
                return clienteRepository.save(clienteExistente);
            })
            .orElseGet(() -> {
                ClienteEntity novoCliente = new ClienteEntity();
                novoCliente.setNome(nomeUpper);
                novoCliente.setEmail(usuario.getEmail());
                novoCliente.setTelefone(telefone);
                novoCliente.setUsuario(usuario);
                return clienteRepository.save(novoCliente);
            });
    }

    // 2. Fluxo para Usuário Anônimo / Visitante
    return clienteRepository.findByEmail(email)
        .map(clienteExistente -> {
            if (!Objects.equals(clienteExistente.getNome(), nomeUpper)) {
                clienteExistente.setNome(nomeUpper);
            }
            if (!Objects.equals(clienteExistente.getTelefone(), telefone)) {
                clienteExistente.setTelefone(telefone);
            }
            return clienteRepository.save(clienteExistente);
        })
        .orElseGet(() -> {
            ClienteEntity novoCliente = new ClienteEntity();
            novoCliente.setNome(nomeUpper);
            novoCliente.setEmail(email);
            novoCliente.setTelefone(telefone);
            novoCliente.setUsuario(null);
            return clienteRepository.save(novoCliente);
        });
}

    /**
     * Resolve o cliente de um agendamento criado pelo administrador. Diferente
     * de buscarOuCriarCliente, NÃO usa o usuário autenticado (que aqui é o
     * próprio admin): o e-mail informado é sempre o identificador do cliente.
     * O telefone é opcional, então só é gravado/atualizado quando informado —
     * nunca apaga o telefone já cadastrado.
     */
    @Transactional
    public ClienteEntity buscarOuCriarClientePorEmail(String nome, String email, String telefone) {
        String nomeUpper = nome.toUpperCase();
        String telefoneInformado = (telefone == null || telefone.isBlank()) ? null : telefone.trim();

        return clienteRepository.findByEmail(email)
            .map(clienteExistente -> {
                if (!Objects.equals(clienteExistente.getNome(), nomeUpper)) {
                    clienteExistente.setNome(nomeUpper);
                }
                if (telefoneInformado != null && !Objects.equals(clienteExistente.getTelefone(), telefoneInformado)) {
                    clienteExistente.setTelefone(telefoneInformado);
                }
                return clienteRepository.save(clienteExistente);
            })
            .orElseGet(() -> clienteRepository.save(new ClienteEntity(nomeUpper, email, telefoneInformado)));
    }
}