package com.jbkloh.dvd.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.jbkloh.dvd.model.ClienteEntity;

public interface ClienteRepository extends JpaRepository<ClienteEntity, Long> {
    Optional<ClienteEntity> findByNome(String nome);
    Optional<ClienteEntity> findByEmail(String email);
}
