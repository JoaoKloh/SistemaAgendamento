import { cookies } from "next/headers"

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:8080"

/**
 * Busca dados diretamente do backend Spring Boot a partir do servidor
 * Next.js (Server Components / Route Handlers), repassando o cookie
 * httpOnly da sessão. Use apenas em código de servidor: `cookies()` do
 * "next/headers" já lança erro se for importado dentro de um Client
 * Component, o que evita vazar BACKEND_API_URL para o navegador.
 */
export async function backendFetch(path: string, init: RequestInit = {}) {
  const cookieStore = await cookies()

  return fetch(`${BACKEND_URL}${path}`, {
    ...init,
    headers: {
      ...init.headers,
      Cookie: cookieStore.toString(),
    },
    cache: "no-store",
  })
}

export async function backendFetchJson<T>(path: string, fallback: T, init?: RequestInit): Promise<T> {
  try {
    const res = await backendFetch(path, init)
    if (!res.ok) return fallback
    return (await res.json()) as T
  } catch {
    return fallback
  }
}

export async function backendFetchText(path: string, fallback: string, init?: RequestInit): Promise<string> {
  try {
    const res = await backendFetch(path, init)
    if (!res.ok) return fallback
    return await res.text()
  } catch {
    return fallback
  }
}
