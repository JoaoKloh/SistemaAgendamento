package com.jbkloh.dvd.config;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import com.jbkloh.dvd.exception.AppException;

import io.github.bucket4j.Bucket;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class RateLimitInterceptor implements HandlerInterceptor {

    private final RateLimiterService rateLimiterService;

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
        String ip;
        if (xfHeader == null || xfHeader.isEmpty()) {
            ip = request.getRemoteAddr();
        } else {
            ip = xfHeader.split(",")[0].trim();
        }
        if ("0:0:0:0:0:0:0:1".equals(ip)) {
            return "127.0.0.1";
        }
        return xfHeader.split(",")[0].trim();
    }
}