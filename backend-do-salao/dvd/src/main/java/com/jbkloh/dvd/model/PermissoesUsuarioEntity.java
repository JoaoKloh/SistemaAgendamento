package com.jbkloh.dvd.model;

import org.springframework.security.core.GrantedAuthority;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;

@Entity
@Setter
@Getter
@RequiredArgsConstructor
@Table(name = "roles")
public class PermissoesUsuarioEntity implements GrantedAuthority{

    @Id
    @GeneratedValue(strategy=GenerationType.IDENTITY)
    @Column(name="roles_id",unique=true)
    private Long id;

    @Column(name = "autorizacoes")
    private String role;

    @Override
    public String getAuthority() {
        return this.role;
    }
}
