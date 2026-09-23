package com.jbkloh.dvd.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.jbkloh.dvd.model.PortfolioEntity;

public interface PortfolioRepository extends JpaRepository<PortfolioEntity, Long> {
    List<PortfolioEntity> findAllByOrderByCriadoEmDesc();
}
