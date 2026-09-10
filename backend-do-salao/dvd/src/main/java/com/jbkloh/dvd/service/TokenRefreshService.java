package com.jbkloh.dvd.service;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.jbkloh.dvd.exception.AppException;
import com.jbkloh.dvd.model.RefreshTokenEntity;
import com.jbkloh.dvd.model.UsuarioEntity;
import com.jbkloh.dvd.repository.RefreshTokenRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TokenRefreshService {

    @Value("${api.security.refresh.expiration-days}")
    private Long expirationDays;

    private final RefreshTokenRepository refreshTokenRepository;

    @Transactional
    public RefreshTokenEntity criarRefreshToken(UsuarioEntity user) {
        refreshTokenRepository.deleteByUserId(user.getId());
        refreshTokenRepository.flush();

        RefreshTokenEntity refreshToken = new RefreshTokenEntity();
        refreshToken.setUser(user);
        refreshToken.setToken(UUID.randomUUID().toString());
        refreshToken.setDataExpiracao(LocalDateTime.now().plusDays(expirationDays));
        refreshToken.setRevogado(false);

        return refreshTokenRepository.save(refreshToken);
    }

    @Transactional
    public RefreshTokenEntity validarRefreshToken(String token) {
        RefreshTokenEntity refreshTokenEntity = refreshTokenRepository.findByToken(token)
                .orElseThrow(() -> new AppException("Refresh Token inválido ou não encontrado.", HttpStatus.UNAUTHORIZED));

        if (refreshTokenEntity.getRevogado()) {
            throw new AppException("Este token foi revogado.", HttpStatus.UNAUTHORIZED);
        }

        if (refreshTokenEntity.estaExpirado()) {
            refreshTokenRepository.delete(refreshTokenEntity);
            throw new AppException("Refresh Token expirado. Faça login novamente.", HttpStatus.UNAUTHORIZED);
        }

        return refreshTokenEntity;
    }

    @Transactional
    public void deletarPorUsuario(Long userId) {
        refreshTokenRepository.deleteByUserId(userId);
    }

    @Transactional
    public void deletarPeloToken(String tokenStr) {
        refreshTokenRepository.findByToken(tokenStr)
                .ifPresent(refreshTokenRepository::delete);
    }
}