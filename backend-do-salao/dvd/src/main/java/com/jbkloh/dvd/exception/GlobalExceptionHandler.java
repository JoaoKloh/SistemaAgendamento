package com.jbkloh.dvd.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.jbkloh.dvd.exception.dto.RestErrorMessage;
import com.resend.core.exception.ResendException;

@RestControllerAdvice
public class GlobalExceptionHandler {

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
}
