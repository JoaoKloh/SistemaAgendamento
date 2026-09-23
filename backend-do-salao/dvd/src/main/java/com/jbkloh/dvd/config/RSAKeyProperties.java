package com.jbkloh.dvd.config;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.KeyFactory;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import lombok.Getter;

@Getter
@Component
public class RSAKeyProperties {

    private final RSAPublicKey publicKey;
    private final RSAPrivateKey privateKey;

    public RSAKeyProperties(
            @Value("${rsa.public-key-path}") String publicKeyPath,
            @Value("${rsa.private-key-path}") String privateKeyPath) throws Exception {

        this.publicKey = loadPublicKey(publicKeyPath);
        this.privateKey = loadPrivateKey(privateKeyPath);
    }

    private RSAPublicKey loadPublicKey(String path) throws Exception {

        String key = Files.readString(
                Path.of(path),
                StandardCharsets.UTF_8);

        key = key
                .replace("-----BEGIN PUBLIC KEY-----", "")
                .replace("-----END PUBLIC KEY-----", "")
                .replaceAll("\\s", "");

        byte[] decoded = Base64.getDecoder().decode(key);

        X509EncodedKeySpec spec = new X509EncodedKeySpec(decoded);

        return (RSAPublicKey) KeyFactory
                .getInstance("RSA")
                .generatePublic(spec);
    }

    private RSAPrivateKey loadPrivateKey(String path) throws Exception {

        String key = Files.readString(
                Path.of(path),
                StandardCharsets.UTF_8);

        key = key
                .replace("-----BEGIN PRIVATE KEY-----", "")
                .replace("-----END PRIVATE KEY-----", "")
                .replaceAll("\\s", "");

        byte[] decoded = Base64.getDecoder().decode(key);

        PKCS8EncodedKeySpec spec = new PKCS8EncodedKeySpec(decoded);

        return (RSAPrivateKey) KeyFactory
                .getInstance("RSA")
                .generatePrivate(spec);
    }
}