package com.jbkloh.dvd.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import com.jbkloh.dvd.dto.request.AtualizarItemRequestDTO;
import com.jbkloh.dvd.enums.TipoItem;
import com.jbkloh.dvd.exception.AppException;
import com.jbkloh.dvd.model.ServicoEntity;
import com.jbkloh.dvd.repository.ServicoRepository;

@ExtendWith(MockitoExtension.class)
class ServicoPrestadoServiceTest {

    @Mock
    private ServicoRepository servicoRepository;

    @InjectMocks
    private ServicoPrestadoService servicoPrestadoService;

    private ServicoEntity criarItem(Long id, TipoItem tipo) {
        ServicoEntity item = new ServicoEntity();
        item.setId(id);
        item.setNome("Antigo");
        item.setPreco(10.0);
        item.setTipo(tipo);
        item.setDuracao(tipo == TipoItem.SERVICO ? LocalTime.of(0, 30) : null);
        return item;
    }

    @Test
    void atualizarServico_deveAlterarCamposPermitidos() {
        ServicoEntity servico = criarItem(1L, TipoItem.SERVICO);
        when(servicoRepository.findByIdAndEstaAtivoTrue(1L)).thenReturn(Optional.of(servico));
        when(servicoRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        var response = servicoPrestadoService.atualizarServico(1L,
            new AtualizarItemRequestDTO("Corte novo", 55.0, "Detalhes", LocalTime.of(0, 45), "ignorada"));

        assertThat(response.nome()).isEqualTo("Corte novo");
        assertThat(response.preco()).isEqualTo(55.0);
        assertThat(response.duracao()).isEqualTo(LocalTime.of(0, 45));
        assertThat(servico.getTipo()).isEqualTo(TipoItem.SERVICO);
        assertThat(servico.getUrlImagem()).isNull();
    }

    @Test
    void atualizarServico_deveLancarNotFound_quandoIdForDeProduto() {
        when(servicoRepository.findByIdAndEstaAtivoTrue(2L)).thenReturn(Optional.of(criarItem(2L, TipoItem.PRODUTO)));

        assertThatThrownBy(() -> servicoPrestadoService.atualizarServico(2L,
                new AtualizarItemRequestDTO("X", 1.0, null, LocalTime.of(0, 30), null)))
            .isInstanceOf(AppException.class)
            .extracting(ex -> ((AppException) ex).getHttpStatus())
            .isEqualTo(HttpStatus.NOT_FOUND);

        verify(servicoRepository, never()).save(any());
    }

    @Test
    void atualizarServico_deveLancarBadRequest_quandoDuracaoAusente() {
        when(servicoRepository.findByIdAndEstaAtivoTrue(1L)).thenReturn(Optional.of(criarItem(1L, TipoItem.SERVICO)));

        assertThatThrownBy(() -> servicoPrestadoService.atualizarServico(1L,
                new AtualizarItemRequestDTO("X", 1.0, null, null, null)))
            .isInstanceOf(AppException.class)
            .extracting(ex -> ((AppException) ex).getHttpStatus())
            .isEqualTo(HttpStatus.BAD_REQUEST);

        verify(servicoRepository, never()).save(any());
    }

    @Test
    void atualizarProduto_deveAlterarImagemEManterDuracaoNula() {
        ServicoEntity produto = criarItem(3L, TipoItem.PRODUTO);
        when(servicoRepository.findByIdAndEstaAtivoTrue(3L)).thenReturn(Optional.of(produto));
        when(servicoRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        var response = servicoPrestadoService.atualizarProduto(3L,
            new AtualizarItemRequestDTO("Pomada", 30.0, "Fixação forte", LocalTime.of(1, 0), "https://img/nova.png"));

        assertThat(response.urlImagem()).isEqualTo("https://img/nova.png");
        assertThat(response.especificacoes()).isEqualTo("Fixação forte");
        assertThat(produto.getDuracao()).isNull();
    }

    @Test
    void atualizarProduto_deveLancarNotFound_quandoInexistenteOuInativo() {
        when(servicoRepository.findByIdAndEstaAtivoTrue(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> servicoPrestadoService.atualizarProduto(99L,
                new AtualizarItemRequestDTO("X", 1.0, null, null, null)))
            .isInstanceOf(AppException.class)
            .extracting(ex -> ((AppException) ex).getHttpStatus())
            .isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void validarEObterItensParaAgendamento_deveRetornarServicosEProdutosNaOrdemRecebida() {
        ServicoEntity servico = criarItem(1L, TipoItem.SERVICO);
        ServicoEntity produto = criarItem(3L, TipoItem.PRODUTO);
        when(servicoRepository.findAllById(Set.of(3L, 1L))).thenReturn(List.of(servico, produto));

        assertThat(servicoPrestadoService.validarEObterItensParaAgendamento(List.of(3L, 1L)))
            .containsExactly(produto, servico);
        verify(servicoRepository, times(1)).findAllById(any());
    }

    @Test
    void validarEObterItensParaAgendamento_deveLancarBadRequest_quandoListaVazia() {
        assertThatThrownBy(() -> servicoPrestadoService.validarEObterItensParaAgendamento(List.of()))
            .isInstanceOf(AppException.class)
            .extracting(ex -> ((AppException) ex).getHttpStatus())
            .isEqualTo(HttpStatus.BAD_REQUEST);
        verify(servicoRepository, never()).findAllById(any());
    }

    @Test
    void validarEObterItensParaAgendamento_deveLancarBadRequest_quandoIdDuplicado() {
        assertThatThrownBy(() -> servicoPrestadoService.validarEObterItensParaAgendamento(List.of(1L, 3L, 3L, 5L)))
            .isInstanceOf(AppException.class)
            .hasMessageContaining("duplicados")
            .extracting(ex -> ((AppException) ex).getHttpStatus())
            .isEqualTo(HttpStatus.BAD_REQUEST);
        verify(servicoRepository, never()).findAllById(any());
    }

    @Test
    void validarEObterItensParaAgendamento_deveRejeitarTudo_quandoAlgumIdNaoExiste() {
        when(servicoRepository.findAllById(any()))
            .thenReturn(List.of(criarItem(1L, TipoItem.SERVICO), criarItem(2L, TipoItem.PRODUTO)));

        assertThatThrownBy(() -> servicoPrestadoService.validarEObterItensParaAgendamento(List.of(1L, 2L, 999L)))
            .isInstanceOf(AppException.class)
            .hasMessageContaining("999")
            .extracting(ex -> ((AppException) ex).getHttpStatus())
            .isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void validarEObterItensParaAgendamento_deveRejeitar_quandoItemInativo() {
        ServicoEntity inativo = criarItem(2L, TipoItem.PRODUTO);
        inativo.setEstaAtivo(false);
        when(servicoRepository.findAllById(any())).thenReturn(List.of(criarItem(1L, TipoItem.SERVICO), inativo));

        assertThatThrownBy(() -> servicoPrestadoService.validarEObterItensParaAgendamento(List.of(1L, 2L)))
            .isInstanceOf(AppException.class)
            .hasMessageContaining("2")
            .extracting(ex -> ((AppException) ex).getHttpStatus())
            .isEqualTo(HttpStatus.BAD_REQUEST);
    }
}
