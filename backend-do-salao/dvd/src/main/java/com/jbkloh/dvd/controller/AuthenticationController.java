package com.jbkloh.dvd.controller;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeTokenRequest;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.googleapis.auth.oauth2.GoogleTokenResponse;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.jbkloh.dvd.dto.request.OptTokenRequestDTO;
import com.jbkloh.dvd.dto.request.OptVerificacaoRequest;
import com.jbkloh.dvd.dto.request.TokenRequestDTO;
import com.jbkloh.dvd.dto.response.LoginResponseDTO;
import com.jbkloh.dvd.dto.response.TokenResponseDTO;
import com.jbkloh.dvd.exception.AppException;
import com.jbkloh.dvd.model.UsuarioEntity;
import com.jbkloh.dvd.service.AutenticationService;
import com.jbkloh.dvd.service.EmailService;
import com.jbkloh.dvd.service.OptService;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import jakarta.mail.MessagingException;


@RestController
@RequestMapping("/login")
@RequiredArgsConstructor
public class AuthenticationController {

    private final AutenticationService authenticationService;
    private final OptService otpService;
    private final EmailService emailService;
    
    @Value("${spring.security.oauth2.client.registration.google.client-id}")
    private String googleClientId;
    @Value("${spring.security.oauth2.client.registration.google.client-secret}")
    private String googleClientSecret;
    @Value("${url.frontend}")
    private String urlFront;

    @PostMapping("/oauthGoogle")
    public ResponseEntity<?> verificarLoginOauth2(@RequestBody Map<String, String> request) throws IOException, GeneralSecurityException {
        String authorizationCode = request.get("code");

        if (authorizationCode == null || authorizationCode.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Código de autorização ausente.");
        }

        GoogleTokenResponse tokenResponse = new GoogleAuthorizationCodeTokenRequest(
                new NetHttpTransport(),
                new GsonFactory(),
                "https://oauth2.googleapis.com/token",
                googleClientId,
                googleClientSecret, 
                authorizationCode,
                urlFront+"/auth/login" 
        ).execute();

        String token = tokenResponse.getIdToken();

        GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new GsonFactory())
                .setAudience(Collections.singletonList(googleClientId))
                .build();

        GoogleIdToken idToken = verifier.verify(token);

        try {
            if (idToken != null) {
                GoogleIdToken.Payload payload = idToken.getPayload();
                String email = payload.getEmail();
                
                UsuarioEntity usuario = authenticationService.getUserOrCreate(email);
                
                ResponseCookie accessCookie = authenticationService.gerarCookieToken(usuario);
                ResponseCookie refreshCookie = authenticationService.gerarCookieRefresh(usuario);
                ResponseCookie isAuthenticated = authenticationService.gerarCookieApoioAutenticacao();
                
                List<String> roles = usuario.getAuthorities().stream()
                        .map(GrantedAuthority::getAuthority)
                        .toList();

                String urlDirecionamento =urlFront+ "/";
                if (roles.contains("ROLE_ADMIN")) {
                    urlDirecionamento = urlFront+"/admin";
                }

                return ResponseEntity.ok()
                        .header(HttpHeaders.SET_COOKIE, accessCookie.toString())
                        .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                        .header(HttpHeaders.SET_COOKIE, isAuthenticated.toString())
                        .body(new LoginResponseDTO(email, roles, urlDirecionamento));
            } else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Token do Google inválido.");
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erro ao validar token: " + e.getMessage());
        }
    }
    @PostMapping("/gerarcodigo")
    public ResponseEntity<?> gerarCodigoLogin(@RequestBody @Valid OptTokenRequestDTO request) throws MessagingException, Exception {

        org.springframework.security.core.Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        boolean isAuthenticated = authentication != null 
                && authentication.isAuthenticated() 
                && !"anonymousUser".equals(authentication.getPrincipal());

        if (isAuthenticated) {
            throw new AppException("O e-mail informado já está autenticado no sistema.", HttpStatus.BAD_REQUEST);
        }

        String codigo = otpService.gerarCodigoValido(request.email());
        emailService.enviarCodigoOtp(request.email(), codigo);
        
        return ResponseEntity.ok().build();
    }
    @PostMapping("/verificarcodigo")
    public ResponseEntity<?>verificarCodigoLogin(@RequestBody OptVerificacaoRequest request, HttpServletResponse response){
        otpService.validarCodigoOtp(request.codigo(), request.email());
        UsuarioEntity user = authenticationService.getUserOrCreate(request.email());
        ResponseCookie accessCookie = authenticationService.gerarCookieToken(user);
        ResponseCookie refreshCookie = authenticationService.gerarCookieRefresh(user);
        ResponseCookie isAuthenticated = authenticationService.gerarCookieApoioAutenticacao();

        response.addHeader(HttpHeaders.SET_COOKIE, accessCookie.toString());
        response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.toString());
        response.addHeader(HttpHeaders.SET_COOKIE, isAuthenticated.toString());
        List<String> roles = user.getAuthorities().stream()
            .map(GrantedAuthority::getAuthority)
            .toList();
            
        String urlDirecionamento = roles.contains("ROLE_ADMIN") ? urlFront + "/admin" : urlFront + "/";
        return ResponseEntity.ok(new LoginResponseDTO(request.email(), roles, urlDirecionamento));
    }

    @PostMapping("/refresh")
    public ResponseEntity<TokenResponseDTO> refreshToken(@Valid @RequestBody TokenRequestDTO tokenRequestDTO) {
        TokenResponseDTO response = authenticationService.refreshToken(tokenRequestDTO.refreshToken());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request) {
        String refreshToken = null;
    
        if (request.getCookies() != null) {
            refreshToken = Arrays.stream(request.getCookies())
            .filter(cookie -> "refreshToken".equals(cookie.getName()))
            .findFirst()
            .map(Cookie::getValue)
            .orElse(null);
        }
        authenticationService.logout(refreshToken);

        List<ResponseCookie> cookiesParaLimpar = authenticationService.limparCookiesLogout();

        var responseBuilder = ResponseEntity.noContent();
    
        for (ResponseCookie cookie : cookiesParaLimpar) {
        responseBuilder.header(HttpHeaders.SET_COOKIE, cookie.toString());
        }

        return responseBuilder.build();
    }
}
