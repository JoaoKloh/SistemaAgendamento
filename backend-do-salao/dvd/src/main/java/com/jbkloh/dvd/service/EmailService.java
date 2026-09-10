package com.jbkloh.dvd.service;

import org.springframework.beans.factory.annotation.Value; // IMPORT CORRETO
import org.springframework.stereotype.Service;

import com.resend.Resend;
import com.resend.core.exception.ResendException;
import com.resend.services.emails.model.CreateEmailOptions;

import jakarta.annotation.PostConstruct;
import jakarta.mail.MessagingException;

@Service
public class EmailService {

    @Value("${resend.api.key}")
    private String resendApiKey;

    @Value("${resend.api.email.from}")
    private String emailFrom;

    private Resend resend;

    @PostConstruct
    public void init() {
        this.resend = new Resend(resendApiKey);
    }

    public void enviarCodigoOtp(String para, String codigo) throws MessagingException, ResendException {
        String logoUrl = "https://seu-dominio.com/assets/logo.png"; // Defina a URL da sua logo aqui

        String htmlContent = """
                <div style="text-align: center; font-family: sans-serif;">
                    <img src="%s" alt="Logo Barbearia" style="width: 150px; margin-bottom: 20px;">
                    <h2>Olá!</h2>
                    <p>Seu código de verificação de acesso é:</p>
                    <h1 style="color: #d4a373; letter-spacing: 5px;">%s</h1>
                    <p style="font-size: 12px; color: #666;">Este código expira em 10 minutos.</p>
                </div>
            """.formatted(logoUrl, codigo); // 2 argumentos para os 2 %s

        CreateEmailOptions emailOptions = CreateEmailOptions.builder()
            .from(emailFrom)
            .to(para)
            .subject("Seu código de verificação")
            .html(htmlContent)
            .build();

        resend.emails().send(emailOptions);
    }
}