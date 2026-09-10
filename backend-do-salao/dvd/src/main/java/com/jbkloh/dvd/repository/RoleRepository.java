package com.jbkloh.dvd.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.jbkloh.dvd.model.PermissoesUsuarioEntity;

public interface RoleRepository extends JpaRepository<PermissoesUsuarioEntity, Long>{
    Optional<PermissoesUsuarioEntity> findByRole(String role);
}
