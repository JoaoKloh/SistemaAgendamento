export const LOGIN_PATH = "/auth/login"
export const MEUS_AGENDAMENTOS_PATH = "/meus-agendamentos"
export const REDIRECT_PARAM = "redirect"

// Rotas que exigem usuário autenticado (não apenas admin).
const ROTAS_AUTENTICADAS = ["/agendamento", MEUS_AGENDAMENTOS_PATH]

export function exigeAutenticacao(pathname: string): boolean {
  return ROTAS_AUTENTICADAS.some((rota) => pathname === rota || pathname.startsWith(`${rota}/`))
}

/**
 * Valida o destino recebido em `?redirect=` antes de usá-lo após o login.
 * Aceita apenas caminhos internos ("/agendamento"): URLs absolutas e
 * caminhos protocol-relative ("//site.com", "/\\site.com") permitiriam um
 * open redirect para outro domínio. Retorna null quando o destino é inválido.
 */
export function obterDestinoSeguro(destino: string | null | undefined): string | null {
  if (!destino || !destino.startsWith("/")) return null
  if (destino.startsWith("//") || destino.startsWith("/\\")) return null
  if (destino === LOGIN_PATH || destino.startsWith(`${LOGIN_PATH}?`) || destino.startsWith(`${LOGIN_PATH}/`)) {
    return null
  }
  return destino
}

export function montarUrlLogin(destino: string): string {
  return `${LOGIN_PATH}?${REDIRECT_PARAM}=${encodeURIComponent(destino)}`
}
