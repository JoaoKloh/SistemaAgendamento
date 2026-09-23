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
    "RESEND_API_KEY=test",
    "GOOGLE_CLIENT_ID=test",
    "GOOGLE_CLIENT_SECRET=test",
    "RSA_PUBLIC_KEY_PATH=src/test/resources/keys/public.pem",
    "RSA_PRIVATE_KEY_PATH=src/test/resources/keys/private.pem"})
class DvdApplicationTests {

@Test
void contextLoads() {
}

}