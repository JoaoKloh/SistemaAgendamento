import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { decodeJwt } from 'jose'

export function middleware(request: NextRequest) {
  const tokenCookie = request.cookies.get('accessToken')
  const token = tokenCookie?.value
  const { pathname } = request.nextUrl

  const isAdminRoute = pathname.startsWith('/admin')
  const isAuthRoute = pathname.startsWith('/auth')

  // 1. Se já está autenticado com token válido e tenta acessar /auth/login
  if (isAuthRoute && token) {
    try {
      const payload = decodeJwt(token)
      
      // Checa se o token AINDA NÃO expirou
      if (payload.exp && Date.now() < payload.exp * 1000) {
        const roles = (payload.roles as string[]) || []
        const isTargetAdmin = roles.includes('ROLE_ADMIN') || roles.includes('ADMIN')
        return NextResponse.redirect(new URL(isTargetAdmin ? '/admin' : '/', request.url))
      }
    } catch (_) {
      // Se o token for inválido/corrompido, permite continuar para carregar a página de login
    }
  }

  // 3. Tenta acessar rota de Admin sem nenhum token — antes só o passo abaixo
  // (isAdminRoute && token) existia, então uma visita SEM cookie nenhum caía
  // direto no NextResponse.next() e a casca visual do admin era renderizada
  // mesmo deslogado (o backend barrava só os dados, via Spring Security).
  if (isAdminRoute && !token) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // 4. Tenta acessar rota de Admin E possui token
  if (isAdminRoute && token) {
    try {
      const payload = decodeJwt(token)

      // Valida se o token EXPIROU
      if (payload.exp && Date.now() >= payload.exp * 1000) {
        const response = NextResponse.redirect(new URL('/auth/login', request.url))
        response.cookies.delete('accessToken')
        response.cookies.delete('refreshToken')
        response.cookies.delete('is-authenticated')
        return response
      }

      const roles = (payload.roles as string[]) || []
      const temAcessoAdmin = roles.includes('ROLE_ADMIN') || roles.includes('ADMIN')

      // Se NÃO for Admin, redireciona para a home
      if (!temAcessoAdmin) {
        return NextResponse.redirect(new URL('/', request.url))
      }
    } catch (error) {
      // Em caso de erro de decode, apaga os cookies e força login
      const response = NextResponse.redirect(new URL('/auth/login', request.url))
      response.cookies.delete('accessToken')
      response.cookies.delete('refreshToken')
      response.cookies.delete('is-authenticated')
      return response
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*', '/auth/:path*'],
}