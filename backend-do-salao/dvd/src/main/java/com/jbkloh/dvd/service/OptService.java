package com.jbkloh.dvd.service;

import java.security.SecureRandom;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import com.jbkloh.dvd.exception.AppException;
import com.jbkloh.dvd.repository.OptRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class OptService {

    private final SecureRandom secureRandom = new SecureRandom();
    private final OptRepository optRepositoryPort;

    public String gerarCodigoValido(String email) {
        validarEmail(email);
        int num = 100000 + secureRandom.nextInt(900000);
        String codigo = String.valueOf(num);
        this.optRepositoryPort.armazenarCodigo(email, codigo);
        return codigo;
    }

    public void validarCodigoOtp(String codigo, String email) {
        validarEmail(email);
        String codigoArmazenado = optRepositoryPort.getCodigo(email);
        log.info(codigoArmazenado);
        if (codigoArmazenado == null || !codigoArmazenado.equals(codigo)) {
            throw new AppException("O código de autenticação está incorreto, favor realizar o login novamente.", HttpStatus.BAD_REQUEST);
        }

        optRepositoryPort.removerCodigo(email);
    }

    private void validarEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            throw new AppException("O email não pode ser nulo.", HttpStatus.BAD_REQUEST);
        }
    }
}