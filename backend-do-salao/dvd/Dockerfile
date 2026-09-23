# =========================
# Stage 1 — Build
# =========================
FROM maven:3.9-eclipse-temurin-21 AS builder

WORKDIR /app

COPY pom.xml .
COPY mvnw .
COPY .mvn .mvn

RUN chmod +x mvnw

# Baixa dependências antes de copiar o código,
# aproveitando melhor o cache do Docker.
RUN ./mvnw dependency:go-offline -DskipTests

COPY src src

RUN ./mvnw clean package -DskipTests


# =========================
# Stage 2 — Runtime
# =========================
FROM eclipse-temurin:21-jre

WORKDIR /app

# Usuário sem privilégios de root
RUN useradd --system --create-home --uid 1001 appuser

COPY --from=builder /app/target/*.jar app.jar

RUN chown appuser:appuser app.jar

USER appuser

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
