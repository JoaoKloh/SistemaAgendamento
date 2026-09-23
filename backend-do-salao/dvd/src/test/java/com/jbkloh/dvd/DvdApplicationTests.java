package com.jbkloh.dvd;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
    "URL_DB=jdbc:h2:mem:testdb",
    "POSTGRES_USER=sa",
    "POSTGRES_PASSWORD=",
    "APPLICATION_NAME=dvd",
    "api.security.refresh.expiration-days=7",
    "url.frontend=http://localhost:3000",
	"resend.api.key=test",
	"resend.api.email.from=onboarding@resend.dev",
    "spring.security.oauth2.client.registration.google.client-id=test",
    "spring.security.oauth2.client.registration.google.client-secret=test",
    "RSA_PUBLIC_KEY_PATH=src/test/resources/keys/public.pem",
    "RSA_PRIVATE_KEY_PATH=src/test/resources/keys/private.pem"})
class DvdApplicationTests {

@Test
void contextLoads() {
}

}