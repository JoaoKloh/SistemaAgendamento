package com.jbkloh.dvd.service;

import java.time.Duration;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.jbkloh.dvd.dto.response.TokenResponseDTO;
import com.jbkloh.dvd.exception.AppException;
import com.jbkloh.dvd.model.PermissoesUsuarioEntity;
import com.jbkloh.dvd.model.RefreshTokenEntity;
import com.jbkloh.dvd.model.UsuarioEntity;
import com.jbkloh.dvd.repository.RoleRepository;
import com.jbkloh.dvd.repository.UsuarioRepository;


import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AutenticationService {

    private final TokenService tokenService;
    private final TokenRefreshService tokenRefreshService;
    private final RoleRepository roleRepository;
    private final UsuarioRepository usuarioRepository;

    @Transactional
    public UsuarioEntity getUserOrCreate(String email){
        PermissoesUsuarioEntity rolePadrao = roleRepository.findByRole("ROLE_USER")
                    .orElseGet(() -> {
                        PermissoesUsuarioEntity novaRole = new PermissoesUsuarioEntity();
                        novaRole.setRole("ROLE_USER");
                        return roleRepository.save(novaRole);
                    });
        Set<PermissoesUsuarioEntity> permissoes = new HashSet<>();
        permissoes.add(rolePadrao);
        return usuarioRepository.findByEmail(email)
            .orElseGet(() -> {
                UsuarioEntity newUser = new UsuarioEntity();
                newUser.setEmail(email);
                newUser.setPermissoes(permissoes);
                return usuarioRepository.save(newUser);
            });
    }

    @Transactional
    public TokenResponseDTO refreshToken(String refreshToken) {
        RefreshTokenEntity refreshTokenEntity = tokenRefreshService.validarRefreshToken(refreshToken);
        UsuarioEntity user = refreshTokenEntity.getUser();

        String novoAccessToken = tokenService.gerarToken(user);
        var novoRefreshToken = tokenRefreshService.criarRefreshToken(user);

        return new TokenResponseDTO(novoAccessToken, novoRefreshToken.getToken(), "Bearer");
    }

    @Transactional
    public void logout(String refreshTokenStr) {
        if (refreshTokenStr == null || refreshTokenStr.isEmpty()) {
            throw new AppException("Refresh Token inválido", HttpStatus.BAD_REQUEST);
        }
        tokenRefreshService.deletarPeloToken(refreshTokenStr);
    }

    public UsuarioEntity getUser(String email){
        return usuarioRepository.findByEmail(email)
            .orElseThrow(()-> new AppException("Não foi possível encontrar o usuario pelo email inserido.", HttpStatus.NOT_FOUND));
    }

    public ResponseCookie gerarCookieToken(UsuarioEntity usuario) {
        String token = tokenService.gerarToken(usuario);
        return ResponseCookie.from("accessToken", token)
            .httpOnly(true)                     
            .secure(true)                      
            .path("/")          
            .sameSite("None")  
            .maxAge(Duration.ofHours(1))           
            .build();
    }
    public ResponseCookie gerarCookieRefresh(UsuarioEntity usuario) {
        var refreshToken = tokenRefreshService.criarRefreshToken(usuario);
        return ResponseCookie.from("refreshToken", refreshToken.getToken())
            .httpOnly(true)
            .secure(true)            
            .path("/")
            .sameSite("None")
            .maxAge(Duration.ofDays(7))  
            .build();
    }
    public ResponseCookie gerarCookieApoioAutenticacao() {
    return ResponseCookie.from("is-authenticated", "true")
        .httpOnly(false)     
        .secure(true)       
        .path("/")
        .sameSite("None")
        .maxAge(Duration.ofHours(1))
        .build();
    }
    public List<ResponseCookie> limparCookiesLogout() {
        return List.of(
            criarCookieLimpo("accessToken", true),
            criarCookieLimpo("refreshToken", true),
            criarCookieLimpo("is-authenticated", false)
        );
    }

    private ResponseCookie criarCookieLimpo(String nome, boolean httpOnly) {
    return ResponseCookie.from(nome, "")
        .path("/")
        .httpOnly(httpOnly)
        .secure(true)
        .sameSite("None")
        .maxAge(0) 
        .build();
    }
}