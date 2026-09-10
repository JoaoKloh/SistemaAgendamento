package com.jbkloh.dvd.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.jbkloh.dvd.enums.TipoItem;
import com.jbkloh.dvd.model.ServicoEntity;

public interface ServicoRepository extends JpaRepository<ServicoEntity, Long>{
    List<ServicoEntity> findByTipoAndEstaAtivoTrue(TipoItem tipo);
    Optional<ServicoEntity> findByIdAndEstaAtivoTrue(Long id);
}
