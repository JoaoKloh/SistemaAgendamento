package com.jbkloh.dvd.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.jbkloh.dvd.dto.response.PortfolioResponseDTO;
import com.jbkloh.dvd.service.PortfolioService;

import lombok.RequiredArgsConstructor;

/**
 * Endpoint público: expõe a galeria de fotos do portfólio para o site
 * (e para a listagem do painel admin). Criação e remoção ficam restritas ao
 * admin, em AdminController.
 */
@RestController
@RequestMapping("/portfolio")
@RequiredArgsConstructor
public class PortfolioController {

    private final PortfolioService portfolioService;

    @GetMapping
    public ResponseEntity<List<PortfolioResponseDTO>> listarFotos() {
        return ResponseEntity.ok(portfolioService.listarFotos());
    }
}
