import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:8080"

// Cabeçalhos que não devem ser repassados ao Spring Boot: Origin/Referer
// identificam a origem do NAVEGADOR, e o filtro de CORS do backend rejeita
// (403 "Invalid CORS request") qualquer Origin que não seja a URL de
// produção configurada em `url.frontend`. Como essa chamada agora é
// servidor-a-servidor (a ponte do BFF), removemos esses cabeçalhos: não há
// CORS entre dois servidores, só entre navegador e servidor. Host/Content-
// Length também são recalculados pelo fetch para o novo destino.
const HOP_BY_HOP_HEADERS = new Set([
  "host",
  "origin",
  "referer",
  "connection",
  "content-length",
])

async function proxy(request: NextRequest, params: Promise<{ path: string[] }>) {
  const { path } = await params
  const destino = new URL(`${BACKEND_URL}/${path.join("/")}`)
  destino.search = request.nextUrl.search

  const headers = new Headers()
  request.headers.forEach((value, key) => {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      headers.set(key, value)
    }
  })

  const temCorpo = !["GET", "HEAD"].includes(request.method)

  const respostaBackend = await fetch(destino, {
    method: request.method,
    headers,
    body: temCorpo ? await request.arrayBuffer() : undefined,
    redirect: "manual",
    cache: "no-store",
  })

  const respostaHeaders = new Headers(respostaBackend.headers)
  respostaHeaders.delete("content-encoding")
  respostaHeaders.delete("content-length")

  const resposta = new NextResponse(respostaBackend.body, {
    status: respostaBackend.status,
    statusText: respostaBackend.statusText,
    headers: respostaHeaders,
  })

  // fetch/undici expõe múltiplos Set-Cookie via getSetCookie(); um simples
  // headers.get("set-cookie") perderia o refreshToken quando o backend
  // envia mais de um cookie na mesma resposta de login.
  const cookies = respostaBackend.headers.getSetCookie?.() ?? []
  resposta.headers.delete("set-cookie")
  for (const cookie of cookies) {
    resposta.headers.append("set-cookie", cookie)
  }

  return resposta
}

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxy(request, context.params)
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxy(request, context.params)
}

export async function PUT(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxy(request, context.params)
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxy(request, context.params)
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxy(request, context.params)
}
