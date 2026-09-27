package com.jbkloh.dvd.service;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.jbkloh.dvd.dto.request.AtualizarItemRequestDTO;
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
        entity.setUrlImagem(req.urlImagem());

        servicoRepository.save(entity);
    }

    @Transactional
    @CacheEvict(value = "servicos", key = "'ativos'")
    public ServicoResponseDTO atualizarServico(Long id, AtualizarItemRequestDTO req) {
        ServicoEntity entity = buscarItemAtivoPorTipo(id, TipoItem.SERVICO, "Serviço não encontrado.");

        if (req.duracao() == null) {
            throw new AppException("A duração do serviço é obrigatória.", HttpStatus.BAD_REQUEST);
        }

        entity.setNome(req.nome());
        entity.setPreco(req.preco());
        entity.setEspecificacoes(req.detalhes());
        entity.setDuracao(req.duracao());

        return new ServicoResponseDTO(servicoRepository.save(entity));
    }

    @Transactional
    @CacheEvict(value = "produtos", key = "'ativos'")
    public ProdutoResponseDTO atualizarProduto(Long id, AtualizarItemRequestDTO req) {
        ServicoEntity entity = buscarItemAtivoPorTipo(id, TipoItem.PRODUTO, "Produto não encontrado.");

        entity.setNome(req.nome());
        entity.setPreco(req.preco());
        entity.setEspecificacoes(req.detalhes());
        entity.setUrlImagem(req.urlImagem());

        return new ProdutoResponseDTO(servicoRepository.save(entity));
    }

    // Impede que um produto seja editado pela rota de serviço (e vice-versa),
    // já que os dois tipos compartilham a mesma tabela e sequência de ids.
    private ServicoEntity buscarItemAtivoPorTipo(Long id, TipoItem tipo, String mensagemNaoEncontrado) {
        return servicoRepository.findByIdAndEstaAtivoTrue(id)
                .filter(item -> item.getTipo() == tipo)
                .orElseThrow(() -> new AppException(mensagemNaoEncontrado, HttpStatus.NOT_FOUND));
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

    /**
     * Valida em lote os itens (serviços e/ou produtos) de um agendamento:
     * rejeita lista vazia, ids repetidos e qualquer id inexistente ou
     * inativo, com uma única consulta ao banco. Retorna as entidades na
     * mesma ordem dos ids recebidos.
     */
    @Transactional(readOnly = true)
    public List<ServicoEntity> validarEObterItensParaAgendamento(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            throw new AppException("Selecione pelo menos um serviço ou produto.", HttpStatus.BAD_REQUEST);
        }
        if (ids.stream().anyMatch(Objects::isNull)) {
            throw new AppException("Os itens selecionados não podem ser nulos.", HttpStatus.BAD_REQUEST);
        }

        Set<Long> idsUnicos = new LinkedHashSet<>(ids);
        if (idsUnicos.size() != ids.size()) {
            throw new AppException("Existem itens duplicados na requisição.", HttpStatus.BAD_REQUEST);
        }

        Map<Long, ServicoEntity> encontrados = servicoRepository.findAllById(idsUnicos)
                .stream()
                .filter(item -> Boolean.TRUE.equals(item.getEstaAtivo()))
                .collect(Collectors.toMap(ServicoEntity::getId, Function.identity()));

        List<Long> indisponiveis = ids.stream()
                .filter(id -> !encontrados.containsKey(id))
                .toList();
        if (!indisponiveis.isEmpty()) {
            throw new AppException(
                "Os seguintes itens não estão disponíveis para agendamento: " + indisponiveis,
                HttpStatus.BAD_REQUEST
            );
        }

        return ids.stream().map(encontrados::get).toList();
    }
}
