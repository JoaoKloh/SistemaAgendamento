package com.jbkloh.dvd.config;

import java.io.IOException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.DispatcherType;

@Component
public class LimitRequest extends OncePerRequestFilter {

    @Autowired
    private CacheManager cacheManager;

    @Override
    protected boolean shouldNotFilterAsyncDispatch() {
        return true;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) 
            throws ServletException, IOException {

        if (DispatcherType.ASYNC.equals(request.getDispatcherType()) || request.getRequestURI().endsWith("/admin/stream")) {
                    filterChain.doFilter(request, response);
                    return;
                }

        if (request.getRequestURI().contains("/gerarcodigo") && "POST".equalsIgnoreCase(request.getMethod())) {
            String ip = request.getRemoteAddr();
            Cache cache = cacheManager.getCache("ipRateLimit");

            if (cache != null) {
                Integer tentativas = cache.get(ip, Integer.class);

                if (tentativas != null && tentativas >= 3) {
                    response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                    response.setContentType("application/json");
                    response.setCharacterEncoding("UTF-8");
                    response.getWriter().write("{\"error\": \"Muitas solicitações\", \"message\": \"Limite atingido. Tente novamente em 1 minuto.\"}");
                    
                    // CORREÇÃO: Interrompe a cadeia de filtros e impede que o controller seja executado
                    return; 
                }

                int novasTentativas = (tentativas == null) ? 1 : tentativas + 1;
                cache.put(ip, novasTentativas);
            }
        }

        filterChain.doFilter(request, response);
    }
}