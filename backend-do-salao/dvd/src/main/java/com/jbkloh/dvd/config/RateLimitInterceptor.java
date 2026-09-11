package com.jbkloh.dvd.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import com.jbkloh.dvd.exception.AppException;

import io.github.bucket4j.Bucket;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class RateLimitInterceptor implements HandlerInterceptor {

    private static final Logger log = LoggerFactory.getLogger(RateLimitInterceptor.class);

    private final RateLimiterService rateLimiterService;

    public RateLimitInterceptor(RateLimiterService rateLimiterService) {
        this.rateLimiterService = rateLimiterService;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String clientIp = extrairIpCliente(request);
        Bucket bucket = rateLimiterService.resolveBucket(clientIp);

        if (bucket.tryConsume(1)) {
            log.info("[RATE LIMIT] Acesso permitido para o IP: {} | Tokens restantes: {}", 
                    clientIp, bucket.getAvailableTokens());
            return true;
        }

        log.warn("[RATE LIMIT EXCEDIDO] Tentativa de bloqueio para o IP: {} na rota: {}", 
                clientIp, request.getRequestURI());

        throw new AppException(
            "Limite de requisições excedido. Tente novamente em alguns minutos.", 
            HttpStatus.TOO_MANY_REQUESTS
        );
    }

    private String extrairIpCliente(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        
        if (xfHeader == null || xfHeader.trim().isEmpty()) {
            String remoteAddr = request.getRemoteAddr();
            if ("0:0:0:0:0:0:0:1".equals(remoteAddr)) {
                return "127.0.0.1";
            }
            return remoteAddr;
        }

        String clientIp = xfHeader.split(",")[0].trim();
        if ("0:0:0:0:0:0:0:1".equals(clientIp)) {
            return "127.0.0.1";
        }
        return clientIp;
    }
}