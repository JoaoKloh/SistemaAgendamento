package com.jbkloh.dvd.repository;

import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class OptRepository {
    
    private final CacheManager cacheManager;

    public void armazenarCodigo(String email, String codigo) {
        Cache cache = getCache();
        if (cache != null) {
            cache.put(email.toLowerCase().trim(), codigo); 
        }
    }

    public String getCodigo(String email) {
        Cache cache = getCache();
        if (cache != null) {
            return cache.get(email.toLowerCase().trim(), String.class);
        }
        return null;
    }

    public void removerCodigo(String email) {
        Cache cache = getCache();
        if (cache != null) {
            cache.evict(email.toLowerCase().trim());
        }
    }

    private Cache getCache() {
        return cacheManager.getCache("dvd");
    }
}