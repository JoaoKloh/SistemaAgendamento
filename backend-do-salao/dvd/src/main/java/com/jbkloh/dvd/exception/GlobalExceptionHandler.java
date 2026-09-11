package com.jbkloh.dvd.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.jbkloh.dvd.exception.dto.RestErrorMessage;
import com.resend.core.exception.ResendException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(AppException.class)
    public ResponseEntity<RestErrorMessage> handleAppException(AppException ex) {
        RestErrorMessage errorResponse = new RestErrorMessage(ex.getHttpStatus(), ex.getMessage());
        return ResponseEntity.status(ex.getHttpStatus()).body(errorResponse);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<RestErrorMessage> handleValidationExceptions(MethodArgumentNotValidException ex) {
        String mensagemErro = ex.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getDefaultMessage())
                .findFirst()
                .orElse("Dados inválidos na requisição");

        RestErrorMessage response = new RestErrorMessage(HttpStatus.BAD_REQUEST, mensagemErro);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<RestErrorMessage> handleHttpMessageNotReadable(HttpMessageNotReadableException ex) {
        String mensagemErro = "Formato de requisição inválido";
        
        if (ex.getCause() != null && ex.getCause().getCause() != null) {
            mensagemErro = ex.getCause().getCause().getMessage();
        } else if (ex.getCause() != null) {
            mensagemErro = ex.getCause().getMessage();
        }

        RestErrorMessage response = new RestErrorMessage(HttpStatus.BAD_REQUEST, mensagemErro);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }
    @ExceptionHandler(ResendException.class)
    public ResponseEntity<RestErrorMessage> handleResendException(ResendException ex) {
        HttpStatus status = HttpStatus.INTERNAL_SERVER_ERROR;
        String mensagem = "Falha ao enviar e-mail de verificação.";

        if (ex.getStatusCode() == 403 || ex.getMessage().contains("domain is not verified")) {
            status = HttpStatus.BAD_REQUEST;
            mensagem = "O domínio do remetente configurado não é válido ou não foi verificado.";
        }

        RestErrorMessage response = new RestErrorMessage(status, mensagem);
        return ResponseEntity.status(status).body(response);
    }
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<RestErrorMessage> handleIllegalArgumentException(IllegalArgumentException ex) {
        RestErrorMessage response = new RestErrorMessage(HttpStatus.BAD_REQUEST, ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    /**
     * Cobre tanto o {@code AccessDeniedException} clássico (regras de URL do
     * Spring Security) quanto o {@code AuthorizationDeniedException} lançado
     * por {@code @PreAuthorize} (que estende {@code AccessDeniedException}).
     * Sem este handler explícito, o catch-all de {@link Exception} abaixo
     * transformaria uma negação de autorização em 500 em vez de 403.
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<RestErrorMessage> handleAccessDenied(AccessDeniedException ex) {
        RestErrorMessage response = new RestErrorMessage(
            HttpStatus.FORBIDDEN,
            "Você não tem permissão para acessar este recurso."
        );
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<RestErrorMessage> handleAuthenticationException(AuthenticationException ex) {
        RestErrorMessage response = new RestErrorMessage(
            HttpStatus.UNAUTHORIZED,
            "Autenticação necessária para acessar este recurso."
        );
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
    }

    /**
     * Rede de segurança para qualquer exceção não mapeada explicitamente.
     * Evita vazar stack traces ou detalhes internos ao cliente, mas registra
     * o erro completo nos logs para investigação.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<RestErrorMessage> handleGenericException(Exception ex) {
        logger.error("Erro inesperado não tratado", ex);

        RestErrorMessage response = new RestErrorMessage(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "Ocorreu um erro inesperado. Tente novamente mais tarde."
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
}
