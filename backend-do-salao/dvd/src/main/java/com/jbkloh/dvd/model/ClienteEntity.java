package com.jbkloh.dvd.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "cliente")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ClienteEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "cliente_id")
    private Long clienteId;

    @Column(name = "nome", nullable = false)
    private String nome;

    @Column(name = "telefone", nullable = true)
    private String telefone;

    @Column(name = "email", nullable = false, unique = true)
    private String email;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", referencedColumnName = "usuario_id", nullable = true)
    private UsuarioEntity usuario;

    public ClienteEntity(String clienteNome, String clienteEmail, String clienteTelefone) {
        this.nome = clienteNome;
        this.email = clienteEmail;
        this.telefone = clienteTelefone;
        this.usuario = null; 
    }
}