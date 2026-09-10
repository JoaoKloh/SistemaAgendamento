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
    public ClienteEntity BuscarOuCriarCliente(String nome, String email, String telefone){
        String nomeUpper = nome.toUpperCase(); 
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !auth.getPrincipal().equals("anonymousUser")) {
            String emailUsuarioLogado = auth.getName(); 
            UsuarioEntity usuario = usuarioRepository.findByEmail(emailUsuarioLogado)
                .orElseThrow(() -> new AppException("Usuário autenticado não encontrado.", HttpStatus.NOT_FOUND));
                
        return clienteRepository.findByEmail(email)
                .map(clienteExistente -> {
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
        return clienteRepository.findByEmail(email)
            .map(clienteExistente -> {
                if (!Objects.equals(clienteExistente.getNome(), nomeUpper)) {
                    clienteExistente.setNome(nomeUpper);
                }
                if (!Objects.equals(clienteExistente.getTelefone(), telefone)) {
                    clienteExistente.setTelefone(telefone);
                }
                if(!Objects.equals(clienteExistente.getEmail(), email)){
                    clienteExistente.setEmail(email);
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
}