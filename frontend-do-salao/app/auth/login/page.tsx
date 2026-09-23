"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, ArrowRight, ChevronLeft, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { salon } from "@/lib/data"

export default function LoginPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [step, setStep] = useState<"email" | "code">("email")
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

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
      const res = await fetch(`/api/login/gerarcodigo`, {
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
      const res = await fetch(`/api/login/verificarcodigo`, {
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

  const handleVoltar = () => {
    setStep("email")
    setCode("")
  }

  if (!mounted) return <div className="min-h-screen bg-background" />

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12 sm:px-6">
      <Link
        href="/"
        className="absolute left-4 top-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground sm:left-6 sm:top-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar ao site
      </Link>

      <div className="w-full max-w-sm">
        <header className="mb-8 flex flex-col items-center text-center">
          <span className="font-title text-xl font-semibold tracking-tight text-foreground">
            David Rabello
          </span>
          <span className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {salon.name}
          </span>
        </header>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <div className="mb-6 space-y-1 text-center">
            <h1 className="font-title text-xl font-semibold tracking-tight text-foreground">
              Fazer login
            </h1>
            <p className="text-sm text-muted-foreground">
              {step === "email"
                ? "Informe seu e-mail para receber um código de acesso."
                : `Digite o código de 6 dígitos enviado para ${email}.`}
            </p>
          </div>

          {step === "email" ? (
            <form onSubmit={handleRequestCode} className="space-y-4">
              <div>
                <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-foreground">
                  E-mail
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  required
                  autoFocus
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  className="h-12 w-full rounded-lg border border-input bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !email}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Enviar código
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="animate-in fade-in slide-in-from-right-4 space-y-4 duration-500">
              <div>
                <label htmlFor="code" className="mb-1.5 block text-xs font-medium text-foreground">
                  Código de verificação
                </label>
                <input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  placeholder="000000"
                  maxLength={6}
                  required
                  autoFocus
                  value={code}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCode(e.target.value.replace(/\D/g, ""))}
                  className="h-12 w-full rounded-lg border border-input bg-background px-4 text-center font-mono text-lg tracking-[0.4em] text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || code.length < 6}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar código"}
              </button>

              <button
                type="button"
                onClick={handleVoltar}
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Usar outro e-mail
              </button>
            </form>
          )}
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} David Rabello · {salon.name}
        </p>
      </div>
    </div>
  )
}
