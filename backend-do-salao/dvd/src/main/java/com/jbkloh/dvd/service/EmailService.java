package com.jbkloh.dvd.service;

import java.text.NumberFormat;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

import org.springframework.beans.factory.annotation.Value; // IMPORT CORRETO
import org.springframework.stereotype.Service;

import com.jbkloh.dvd.dto.response.AgendamentoDetalhadoResponseDTO;
import com.resend.Resend;
import com.resend.core.exception.ResendException;
import com.resend.services.emails.model.CreateEmailOptions;

import jakarta.annotation.PostConstruct;
import jakarta.mail.MessagingException;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class EmailService {

    @Value("${resend.api.key}")
    private String resendApiKey;

    @Value("${resend.api.email.from}")
    private String emailFrom;

    private Resend resend;

    private static final DateTimeFormatter DATA_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter HORA_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");
    private static final NumberFormat MOEDA_FORMATTER = NumberFormat.getCurrencyInstance(Locale.of("pt", "BR"));

    // Paleta espelhada de app/globals.css (frontend): tokens oklch convertidos
    // para hex, já que clientes de e-mail não suportam oklch()/CSS custom
    // properties.
    private static final String COR_BACKGROUND = "#f4f1ec";
    private static final String COR_CARD = "#ffffff";
    private static final String COR_BORDER = "#e1ddd8";
    private static final String COR_FOREGROUND = "#13110f";
    private static final String COR_MUTED_FOREGROUND = "#656360";
    private static final String COR_PRIMARY = "#171614";
    private static final String COR_PRIMARY_FOREGROUND = "#faf8f5";
    private static final String COR_ACCENT = "#e9e0d0";
    private static final String COR_ACCENT_FOREGROUND = "#2d2824";
    private static final String COR_SECONDARY = "#f2eee6";
    private static final String FONT_STACK =
        "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

    @PostConstruct
    public void init() {
        this.resend = new Resend(resendApiKey);
    }

    public void enviarCodigoOtp(String para, String codigo) throws MessagingException, ResendException {
        String htmlContent = OTP_TEMPLATE.replace("{{CODIGO}}", codigo);

        CreateEmailOptions emailOptions = CreateEmailOptions.builder()
            .from(emailFrom)
            .to(para)
            .subject("Seu código de verificação")
            .html(htmlContent)
            .build();

        resend.emails().send(emailOptions);
    }

    /**
     * Disparado após o commit do agendamento no banco (ver
     * AgendamentoService#criarAgendamento). Falha de envio não deve afetar o
     * agendamento já confirmado, por isso o erro fica só registrado em log.
     */
    public void enviarEmailAgendamentoConfirmado(AgendamentoDetalhadoResponseDTO agendamento) {
        try {
            String htmlContent = AGENDAMENTO_CONFIRMADO_TEMPLATE
                .replace("{{NOME}}", agendamento.clienteNome())
                .replace("{{SERVICOS}}", String.join(", ", agendamento.itens()))
                .replace("{{DATA}}", agendamento.dataAgendamento().format(DATA_FORMATTER))
                .replace("{{HORA}}", agendamento.horaAgendamento().format(HORA_FORMATTER))
                .replace("{{VALOR}}", MOEDA_FORMATTER.format(agendamento.valorTotal()));

            CreateEmailOptions emailOptions = CreateEmailOptions.builder()
                .from(emailFrom)
                .to(agendamento.clienteEmail())
                .subject("Agendamento confirmado · Salão Ideal")
                .html(htmlContent)
                .build();

            resend.emails().send(emailOptions);
        } catch (ResendException e) {
            log.error("Falha ao enviar e-mail de confirmação de agendamento para {}", agendamento.clienteEmail(), e);
        }
    }

    private static final String OTP_TEMPLATE = """
            <div style="background-color:{{BG}};padding:40px 16px;font-family:{{FONT}};">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:420px;margin:0 auto;">
                <tr>
                  <td style="background-color:{{CARD}};border:1px solid {{BORDER}};border-radius:20px;padding:40px 32px;text-align:center;">
                    <p style="margin:0 0 28px;font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:{{MUTED}};">
                      David Rabello
                    </p>
                    <h1 style="margin:0 0 8px;font-size:20px;font-weight:600;color:{{FG}};">
                      Código de verificação
                    </h1>
                    <p style="margin:0 0 28px;font-size:14px;line-height:1.6;color:{{MUTED}};">
                      Use o código abaixo para confirmar seu acesso.
                    </p>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
                      <tr>
                        <td style="background-color:{{PRIMARY}};border-radius:14px;padding:18px 0;text-align:center;">
                          <span style="font-size:32px;font-weight:700;letter-spacing:10px;color:{{PRIMARY_FG}};">{{CODIGO}}</span>
                        </td>
                      </tr>
                    </table>
                    <p style="margin:0;font-size:12px;line-height:1.6;color:{{MUTED}};">
                      Este código expira em 10 minutos. Se você não solicitou, ignore este e-mail.
                    </p>
                  </td>
                </tr>
              </table>
            </div>
            """
        .replace("{{BG}}", COR_BACKGROUND)
        .replace("{{CARD}}", COR_CARD)
        .replace("{{BORDER}}", COR_BORDER)
        .replace("{{FG}}", COR_FOREGROUND)
        .replace("{{MUTED}}", COR_MUTED_FOREGROUND)
        .replace("{{PRIMARY}}", COR_PRIMARY)
        .replace("{{PRIMARY_FG}}", COR_PRIMARY_FOREGROUND)
        .replace("{{FONT}}", FONT_STACK);

    private static final String AGENDAMENTO_CONFIRMADO_TEMPLATE = """
            <div style="background-color:{{BG}};padding:40px 16px;font-family:{{FONT}};">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:440px;margin:0 auto;">
                <tr>
                  <td style="background-color:{{CARD}};border:1px solid {{BORDER}};border-radius:20px;padding:40px 32px;text-align:center;">
                    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 20px;">
                      <tr>
                        <td style="width:56px;height:56px;border-radius:9999px;background-color:{{ACCENT}};text-align:center;vertical-align:middle;">
                          <span style="font-size:24px;line-height:56px;color:{{ACCENT_FG}};">&#10003;</span>
                        </td>
                      </tr>
                    </table>
                    <h1 style="margin:0 0 8px;font-size:22px;font-weight:600;color:{{FG}};">
                      Agendamento confirmado!
                    </h1>
                    <p style="margin:0 0 28px;font-size:14px;line-height:1.6;color:{{MUTED}};">
                      Tudo certo, {{NOME}}. Seu horário com o David no Salão Ideal está reservado.
                    </p>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid {{BORDER}};border-radius:16px;text-align:left;">
                      <tr>
                        <td style="padding:14px 20px;border-bottom:1px solid {{BORDER}};font-size:13px;color:{{MUTED}};">Serviço</td>
                        <td style="padding:14px 20px;border-bottom:1px solid {{BORDER}};font-size:13px;font-weight:600;color:{{FG}};text-align:right;">{{SERVICOS}}</td>
                      </tr>
                      <tr>
                        <td style="padding:14px 20px;border-bottom:1px solid {{BORDER}};font-size:13px;color:{{MUTED}};">Data</td>
                        <td style="padding:14px 20px;border-bottom:1px solid {{BORDER}};font-size:13px;font-weight:600;color:{{FG}};text-align:right;">{{DATA}}</td>
                      </tr>
                      <tr>
                        <td style="padding:14px 20px;border-bottom:1px solid {{BORDER}};font-size:13px;color:{{MUTED}};">Horário</td>
                        <td style="padding:14px 20px;border-bottom:1px solid {{BORDER}};font-size:13px;font-weight:600;color:{{FG}};text-align:right;">{{HORA}}</td>
                      </tr>
                      <tr>
                        <td style="padding:14px 20px;font-size:13px;color:{{MUTED}};">Valor</td>
                        <td style="padding:14px 20px;font-size:13px;font-weight:600;color:{{FG}};text-align:right;">{{VALOR}}</td>
                      </tr>
                    </table>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
                      <tr>
                        <td style="background-color:{{SECONDARY}};border-radius:12px;padding:12px 16px;font-size:12px;line-height:1.6;color:{{MUTED}};text-align:left;">
                          Shopping Center Dom Pedro II — Rua do Imperador, 288, Loja 14, Centro, Petrópolis - RJ
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </div>
            """
        .replace("{{BG}}", COR_BACKGROUND)
        .replace("{{CARD}}", COR_CARD)
        .replace("{{BORDER}}", COR_BORDER)
        .replace("{{FG}}", COR_FOREGROUND)
        .replace("{{MUTED}}", COR_MUTED_FOREGROUND)
        .replace("{{ACCENT}}", COR_ACCENT)
        .replace("{{ACCENT_FG}}", COR_ACCENT_FOREGROUND)
        .replace("{{SECONDARY}}", COR_SECONDARY)
        .replace("{{FONT}}", FONT_STACK);
}
