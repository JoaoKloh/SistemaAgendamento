package com.jbkloh.dvd.dto.request;

import jakarta.validation.constraints.Email;


public record OptTokenRequestDTO(

    @Email(message = "O email inserido deve ser válido.")
    String email
) {
    
}