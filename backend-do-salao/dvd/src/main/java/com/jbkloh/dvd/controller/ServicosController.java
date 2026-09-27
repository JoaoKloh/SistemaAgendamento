package com.jbkloh.dvd.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.jbkloh.dvd.dto.request.AtualizarItemRequestDTO;
import com.jbkloh.dvd.dto.response.ProdutoResponseDTO;
import com.jbkloh.dvd.dto.response.ServicoResponseDTO;
import com.jbkloh.dvd.service.ServicoPrestadoService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/servicos")
@RequiredArgsConstructor
public class ServicosController {

    private final ServicoPrestadoService servicoPrestadoService;


    @GetMapping
    public ResponseEntity<List<ServicoResponseDTO>> listarServicosAtivos() {
        return ResponseEntity.ok(servicoPrestadoService.listarServicos());
    }

    @GetMapping("/produtos")
    public ResponseEntity<List<ProdutoResponseDTO>> listarProdutosAtivos() {
        return ResponseEntity.ok(servicoPrestadoService.listarProdutos());
    }

    // "/servicos/**" é público no SegurancaConfig (listagens do catálogo), por
    // isso as rotas de escrita exigem ADMIN explicitamente no método.
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ServicoResponseDTO> atualizarServico(
            @PathVariable Long id,
            @Valid @RequestBody AtualizarItemRequestDTO req
    ) {
        return ResponseEntity.ok(servicoPrestadoService.atualizarServico(id, req));
    }

    @PutMapping("/produtos/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProdutoResponseDTO> atualizarProduto(
            @PathVariable Long id,
            @Valid @RequestBody AtualizarItemRequestDTO req
    ) {
        return ResponseEntity.ok(servicoPrestadoService.atualizarProduto(id, req));
    }
}
