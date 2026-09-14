# DVD Workspace — Sistema de agendamento para salão/barbearia

Monorepo com dois projetos independentes:

- [`backend-do-salao/dvd`](backend-do-salao/dvd) — API REST em Spring Boot 3 / Java 21 (autenticação via Google OAuth2 e código OTP por e-mail, agendamentos, catálogo de serviços/produtos, painel administrativo).
- [`frontend-do-salao`](frontend-do-salao) — aplicação Next.js 16 / React 19 (site público de agendamento e painel `/admin`).

## Pré-requisitos

- Java 21 e Maven Wrapper (incluso, `./mvnw`)
- Docker (para subir o Postgres local) ou um Postgres já rodando
- Node.js 20+ e [pnpm](https://pnpm.io) (o projeto usa `pnpm-lock.yaml`)

## Backend (`backend-do-salao/dvd`)

1. Suba o banco de dados local:

   ```bash
   cd backend-do-salao/dvd
   cp .env.example .env   # ajuste as credenciais se quiser
   docker compose up -d
   ```

2. Gere um par de chaves RSA para assinar os JWTs (nunca commitadas — veja `.gitignore`):

   ```bash
   mkdir -p src/main/resources/keys
   openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out /tmp/private.pem
   openssl rsa -pubout -in /tmp/private.pem -out src/main/resources/keys/public.pem
   openssl pkcs8 -topk8 -inform PEM -outform PEM -nocrypt -in /tmp/private.pem -out src/main/resources/keys/private.pem
   ```

3. Configure a aplicação: copie `src/main/resources/application.properties.example` para
   `src/main/resources/application.properties` (também gitignored) e preencha:
   - credenciais do Postgres (mesmas do `.env`);
   - Client ID/Secret do OAuth2 do Google;
   - API key da [Resend](https://resend.com) para o e-mail com o código OTP.

   Qualquer uma dessas chaves também pode ser definida como variável de ambiente
   (ex.: `URL_FRONTEND`, `RESEND_API_KEY`) em vez de usar o arquivo.

4. Rode a aplicação:

   ```bash
   ./mvnw spring-boot:run
   ```

   A API sobe em `http://localhost:8080`.

### Testes

```bash
cd backend-do-salao/dvd
./mvnw test
```

Os testes usam um banco H2 em memória e um par de chaves RSA de teste
(`src/test/resources`), então não dependem do Postgres nem das chaves reais.

## Frontend (`frontend-do-salao`)

```bash
cd frontend-do-salao
cp .env.example .env.local   # aponte para a API do backend
pnpm install
pnpm dev
```

O site sobe em `http://localhost:3000`.

### Lint, testes e build

```bash
pnpm lint
pnpm test
pnpm build
```

## Integração contínua

O workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml) roda em todo push/PR para `main`:
testes e build do backend (Maven) e lint + type-check + testes + build do frontend (pnpm).

## Arquitetura (resumo)

- **Backend**: camadas `controller` → `service` → `repository`, DTOs de request/response
  separados das entidades JPA, autenticação stateless com JWT (chave RSA), OAuth2 do
  Google e login por código OTP, rate limiting em `/login/gerarcodigo`, cache com Caffeine.
- **Frontend**: Next.js App Router, `middleware.ts` faz a guarda de rota (apenas UX —
  quem garante permissão de fato é o backend), componentes de agendamento em
  `components/booking` compostos por um formulário orquestrador + subcomponentes de UI,
  dados remotos via SWR (`lib/hooks`).
