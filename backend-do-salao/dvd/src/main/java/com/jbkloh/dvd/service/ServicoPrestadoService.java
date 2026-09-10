package com.jbkloh.dvd.service;

import java.util.List;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.jbkloh.dvd.dto.request.CriarServicoRequestDTO;
import com.jbkloh.dvd.dto.response.ProdutoResponseDTO;
import com.jbkloh.dvd.dto.response.ServicoResponseDTO;
import com.jbkloh.dvd.enums.TipoItem;
import com.jbkloh.dvd.exception.AppException;
import com.jbkloh.dvd.model.ServicoEntity;
import com.jbkloh.dvd.repository.ServicoRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ServicoPrestadoService {

    private final ServicoRepository servicoRepository;

    @Transactional(readOnly = true)
    @Cacheable(value = "servicos", key = "'ativos'")
    public List<ServicoResponseDTO> listarServicos() {
        return servicoRepository.findByTipoAndEstaAtivoTrue(TipoItem.SERVICO)
                .stream()
                .map(ServicoResponseDTO::new)
                .toList();
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "produtos", key = "'ativos'")
    public List<ProdutoResponseDTO> listarProdutos() {
        return servicoRepository.findByTipoAndEstaAtivoTrue(TipoItem.PRODUTO)
                .stream()
                .map(ProdutoResponseDTO::new)
                .toList();
    }

    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "servicos", key = "'ativos'"),
        @CacheEvict(value = "produtos", key = "'ativos'")
    })
    public void criarServico(CriarServicoRequestDTO req) {
        ServicoEntity entity = new ServicoEntity();
        entity.setPreco(req.preco());
        entity.setNome(req.nome());
        entity.setEspecificacoes(req.detalhes());
        entity.setDuracao(req.duracao());
        entity.setEstaAtivo(true);
        entity.setTipo(TipoItem.valueOf(req.tipo()));
        
        servicoRepository.save(entity);
    }

    @Transactional
    @CacheEvict(value = "produtos", key = "'ativos'")
    public void criarProduto(CriarServicoRequestDTO req) {
        ServicoEntity entity = new ServicoEntity();
        entity.setNome(req.nome());
        entity.setPreco(req.preco());
        entity.setEspecificacoes(req.detalhes());
        entity.setDuracao(null); // Produtos não possuem tempo de execução
        entity.setTipo(TipoItem.PRODUTO);
        entity.setEstaAtivo(true);

        servicoRepository.save(entity);
    }

    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "servicos", key = "'ativos'"),
        @CacheEvict(value = "produtos", key = "'ativos'")
    })
    public void deletarServico(Long id) {
        ServicoEntity entity = servicoRepository.findById(id)
                .orElseThrow(() -> new AppException("Serviço não encontrado.", HttpStatus.NOT_FOUND));

        entity.setEstaAtivo(false);
        servicoRepository.save(entity);
    }

    @Transactional(readOnly = true)
    public ServicoEntity validarEObterServicoParaAgendamento(Long id) {
        return servicoRepository.findByIdAndEstaAtivoTrue(id)
                .orElseThrow(() -> new AppException(
                    "O serviço selecionado não está mais disponível para agendamento.", 
                    HttpStatus.BAD_REQUEST
                ));
    }
}