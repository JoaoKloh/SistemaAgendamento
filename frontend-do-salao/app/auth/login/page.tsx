"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2, ArrowRight } from "lucide-react"
import { toast } from "sonner"

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mounted, setMounted] = useState(false)
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")

  const apiUrl = process.env.NEXT_PUBLIC_API_URL

  const handleEnviarCodeGoogleAoBackend = async (codigoDoGoogle: string) => {
    setIsLoading(true)
    try {
      const res = await fetch(`${apiUrl}/login/oauthGoogle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code: codigoDoGoogle }),
      })

      const rawText = await res.text()
      let data: any = {}
      try { data = JSON.parse(rawText) } catch (_) {}

      if (!res.ok) {
        throw new Error(data.message || data.error || "Falha na autenticação com o Google.")
      }

      toast.success("Autenticado com sucesso!")

      if (data.urlDirecionamento) {
        window.location.href = data.urlDirecionamento
      } else {
        router.push("/")
        router.refresh()
      }
    } catch (error: any) {
      console.error("Erro na autenticação:", error)
      toast.error(error.message || "Falha na autenticação com o Google.")
      router.replace("/auth/login")
    } finally {
      setIsLoading(false)
    }
  }

  // "mounted" evita renderizar o formulário no servidor antes de checarmos o
  // cookie de autenticação no cliente, prevenindo divergência de hidratação.
  useEffect(() => {
    const getCookie = (name: string): string | null => {
      const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"))
      return match ? decodeURIComponent(match[2]) : null
    }

    const authCookie = getCookie("is-authenticated")
    if (authCookie) {
      router.replace("/")
      return
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
    const googleCode = searchParams.get("code")

    if (googleCode) {
      handleEnviarCodeGoogleAoBackend(googleCode)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, router])

  // Função auxiliar para verificar e aplicar o bloqueio de 5 minutos
  const checkBlockStatus = (userEmail: string): boolean => {
    const lockKey = `login_block_${userEmail.toLowerCase()}`
    const blockUntil = localStorage.getItem(lockKey)

    if (blockUntil) {
      const now = Date.now()
      const remainingSeconds = Math.ceil((parseInt(blockUntil, 10) - now) / 1000)

      if (remainingSeconds > 0) {
        const minutes = Math.floor(remainingSeconds / 60)
        const seconds = remainingSeconds % 60
        toast.error(
          `Acesso bloqueado temporariamente. Tente novamente em ${minutes}m ${seconds}s.`
        )
        return true // Está bloqueado
      } else {
        localStorage.removeItem(lockKey) // Bloqueio expirou
      }
    }
    return false // Liberado
  }

  const setBlockStatus = (userEmail: string) => {
    const lockKey = `login_block_${userEmail.toLowerCase()}`
    const fiveMinutesInMs = 5 * 60 * 1000
    const expiryTime = Date.now() + fiveMinutesInMs
    localStorage.setItem(lockKey, expiryTime.toString())
  }

  const handleGoogleLogin = () => {
    setIsLoading(true)
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    const redirectUri = `${window.location.origin}/auth/login`

    const googleAuthUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent("openid email profile")}` +
      `&prompt=select_account`

    window.location.href = googleAuthUrl
  }

  const handleRequestCode = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const cleanEmail = email.trim()
    if (!cleanEmail) return
  
    // 1. Checa se o e-mail já está no tempo de bloqueio
    if (checkBlockStatus(cleanEmail)) {
      return
    }
  
    setIsLoading(true)
    try {
      const res = await fetch(`${apiUrl}/login/gerarcodigo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: cleanEmail }),
      })
  
      // Parse do JSON da resposta (seja 200, 400 ou 429)
      const rawText = await res.text()
      let responseData: any = {}
      try {
        responseData = JSON.parse(rawText)
      } catch (_) {
        responseData = { message: rawText }
      }
  
      if (!res.ok) {
        // Se for 400 (Usuário já autenticado), ativa o bloqueio de 5 minutos para o e-mail
        if (res.status === 400) {
          setBlockStatus(cleanEmail)
        }
  
        // Extrai a mensagem "O e-mail informado já está autenticado no sistema." do JSON retornado pelo Spring
        const errorMessage =
          responseData.message ||
          responseData.error ||
          "Erro ao processar sua identificação."
  
        throw new Error(errorMessage)
      }
  
      toast.success("Código enviado com sucesso.")
      setStep("code")
    } catch (error: any) {
      // Exibe a mensagem capturada diretamente no Toast
      toast.error(error.message || "Erro ao processar sua identificação.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyCode = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (code.length < 6) return
  
    setIsLoading(true)
    try {
      const res = await fetch(`${apiUrl}/login/verificarcodigo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim(), codigo: code }),
      })
  
      const rawText = await res.text()
      let data: any = {}
      try { data = JSON.parse(rawText) } catch (_) {}
  
      if (!res.ok) {
        throw new Error(data.message || data.error || "Código inválido ou expirado.")
      }
  
      toast.success("Login realizado com sucesso!")
  
      // Determina a URL vinda do backend ou força o redirecionamento para o admin
      const destino = data.urlDirecionamento || "/admin"
      window.location.assign(destino)
  
    } catch (error: any) {
      console.error("Erro no login:", error)
      toast.error(error.message || "Código inválido ou expirado.")
      setIsLoading(false)
    }
  }

  if (!mounted) return <div className="min-h-screen bg-[#fef1f2]" />

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#fef1f2] px-6">
      <div className="w-full max-w-[380px] space-y-10">
        <header className="space-y-3 text-center">
          <h1 className="font-serif text-4xl tracking-tight text-slate-900">David Rabelo</h1>
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-slate-800">Fazer login</h2>
            <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-slate-400">
              {isLoading && searchParams.get("code")
                ? "Validando credenciais..."
                : step === "email"
                ? "Identificação"
                : "Verificação por E-mail"}
            </p>
          </div>
        </header>

        <main className="space-y-6">
          {step === "email" && (
            <>
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                ) : (
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                )}
                {isLoading && searchParams.get("code") ? "Verificando..." : "Continuar com Google"}
              </button>

              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-200" />
                </div>
                <span className="relative bg-[#fef1f2] px-4 text-xs uppercase tracking-widest text-slate-400">
                  ou
                </span>
              </div>
            </>
          )}

          <div className="rounded-xl border border-slate-100/50 bg-[#f8fafc] p-2 shadow-sm">
            {step === "email" ? (
              <form onSubmit={handleRequestCode} className="relative flex items-center">
                <input
                  type="email"
                  placeholder="E-mail"
                  required
                  autoFocus
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  className="h-14 w-full border-0 bg-transparent px-4 text-lg text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-0"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !email}
                  className="p-3 text-slate-300 transition-colors hover:text-pink-400 disabled:opacity-20"
                >
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-6 w-6" />}
                </button>
              </form>
            ) : (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <form onSubmit={handleVerifyCode} className="relative flex items-center">
                  <input
                    type="text"
                    placeholder="Código de 6 dígitos"
                    maxLength={6}
                    required
                    autoFocus
                    value={code}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCode(e.target.value.replace(/\D/g, ""))}
                    className="h-14 w-full border-0 bg-transparent px-4 text-center font-mono text-2xl tracking-[0.4em] text-slate-700 focus:outline-none focus:ring-0"
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={isLoading || code.length < 6}
                    className="p-3 text-slate-300 transition-colors hover:text-pink-400 disabled:opacity-20"
                  >
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-6 w-6" />}
                  </button>
                </form>
              </div>
            )}
          </div>
        </main>

        <footer className="border-t border-slate-100/50 pt-8 text-center">
          <p className="text-[10px] font-light uppercase tracking-[0.25em] text-slate-300">
            David Rabelo &copy; 2026
          </p>
        </footer>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fef1f2]" />}>
      <LoginContent />
    </Suspense>
  )
}