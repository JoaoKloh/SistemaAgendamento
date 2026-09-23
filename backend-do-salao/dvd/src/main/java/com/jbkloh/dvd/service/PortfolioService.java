package com.jbkloh.dvd.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.jbkloh.dvd.dto.request.PortfolioRequestDTO;
import com.jbkloh.dvd.dto.response.PortfolioResponseDTO;
import com.jbkloh.dvd.exception.AppException;
import com.jbkloh.dvd.model.PortfolioEntity;
import com.jbkloh.dvd.repository.PortfolioRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PortfolioService {

    private final PortfolioRepository portfolioRepository;

    @Transactional(readOnly = true)
    public List<PortfolioResponseDTO> listarFotos() {
        return portfolioRepository.findAllByOrderByCriadoEmDesc()
                .stream()
                .map(PortfolioResponseDTO::new)
                .toList();
    }

    @Transactional
    public PortfolioResponseDTO criarFoto(PortfolioRequestDTO req) {
        PortfolioEntity foto = new PortfolioEntity();
        foto.setUrl(req.url());
        foto.setDescricao(req.descricao());

        PortfolioEntity fotoSalva = portfolioRepository.save(foto);
        return new PortfolioResponseDTO(fotoSalva);
    }

    @Transactional
    public void deletarFoto(Long id) {
        if (!portfolioRepository.existsById(id)) {
            throw new AppException("Foto não encontrada para remoção.", HttpStatus.NOT_FOUND);
        }
        portfolioRepository.deleteById(id);
    }
}
