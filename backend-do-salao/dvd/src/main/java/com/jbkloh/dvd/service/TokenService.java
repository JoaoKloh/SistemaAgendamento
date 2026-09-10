package com.jbkloh.dvd.service;


import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import com.jbkloh.dvd.model.UsuarioEntity;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TokenService {

    private final JwtEncoder jwtEncoder;
    private final JwtDecoder jwtDecoder;
    
    public String extrairSubject(String token) {
        return jwtDecoder.decode(token).getSubject();
    }

    public String gerarToken(UsuarioEntity user) {
        return criarToken(user.getEmail(), user.getAuthorities());
    }

    public String criarToken(String email, Collection<? extends GrantedAuthority> authorities) {
        Instant agora = Instant.now();
        Instant expiracao = agora.plus(1, ChronoUnit.HOURS); 

        List<String> roles = authorities.stream()
                        .map(GrantedAuthority::getAuthority)
                        .distinct()
                        .collect(Collectors.toList());
                        
        JwtClaimsSet claims = JwtClaimsSet.builder()
                            .issuer("marieeanne-auth-server")
                            .issuedAt(agora)
                            .expiresAt(expiracao)
                            .subject(email)
                            .claim("roles", roles) 
                            .build();

        return jwtEncoder.encode(JwtEncoderParameters.from(claims)).getTokenValue();
    }
    }
