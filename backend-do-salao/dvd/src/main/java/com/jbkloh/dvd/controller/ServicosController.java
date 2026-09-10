package com.jbkloh.dvd.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.jbkloh.dvd.dto.response.ProdutoResponseDTO;
import com.jbkloh.dvd.dto.response.ServicoResponseDTO;
import com.jbkloh.dvd.service.ServicoPrestadoService;

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
}