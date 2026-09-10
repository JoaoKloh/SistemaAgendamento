package com.jbkloh.dvd.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;

import com.jbkloh.dvd.model.RefreshTokenEntity;

import jakarta.transaction.Transactional;

public interface RefreshTokenRepository extends JpaRepository<RefreshTokenEntity, Long> {
    @Modifying
    @Transactional
    void deleteByUserId(Long id);   
    Optional<RefreshTokenEntity> findByToken(String token);
    
}
