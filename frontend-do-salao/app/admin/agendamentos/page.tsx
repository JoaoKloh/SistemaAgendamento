"use client"

import { useEffect, useState } from "react"
import { Clock, User, Scissors } from "lucide-react"

export interface AgendamentoPainelDTO {
  agendamentoId: number
  clienteNome: string
  dataAgendamento: string
  horaAgendamento: string
  valorTotal: number
  itensNomes: string[]
}

// Retorna a data de hoje estritamente no fuso horário do Brasil (YYYY-MM-DD)
function getHojeFormatadoLocal(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date())

  const year = parts.find((p) => p.type === "year")?.value
  const month = parts.find((p) => p.type === "month")?.value
  const day = parts.find((p) => p.type === "day")?.value

  return `${year}-${month}-${day}`
}

export default function DashboardAgendamentosPage() {
  const [agendamentos, setAgendamentos] = useState<AgendamentoPainelDTO[]>([])
  const [isConnected, setIsConnected] = useState(false)

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

  // 1. Carga inicial dos agendamentos do dia via REST API
  useEffect(() => {
    const fetchAgendamentosDoDia = async () => {
      try {
        const hoje = getHojeFormatadoLocal()
        const res = await fetch(`${apiUrl}/api/agendamento/dia?data=${hoje}`, {
          credentials: "include",
        })
        if (res.ok) {
          const data = await res.json()
          setAgendamentos(data)
        }
      } catch (err) {
        console.error("Erro ao carregar agendamentos do dia:", err)
      }
    }

    fetchAgendamentosDoDia()
  }, [apiUrl])

  // 2. Conexão via SSE para receber novos agendamentos em tempo real
  useEffect(() => {
    const eventSource = new EventSource(`${apiUrl}/api/agendamento/stream`, {
      withCredentials: true,
    })

    eventSource.onopen = () => {
      setIsConnected(true)
    }

    eventSource.addEventListener("agendamento-atualizado", (event) => {
      try {
        const novoAgendamento: AgendamentoPainelDTO = JSON.parse(event.data)

        setAgendamentos((prev) => {
          // Evita duplicação caso já exista no estado
          const jaExiste = prev.some((a) => a.agendamentoId === novoAgendamento.agendamentoId)
          if (jaExiste) return prev

          // Adiciona e ordena por horário
          const atualizados = [novoAgendamento, ...prev]
          return atualizados.sort((a, b) => a.horaAgendamento.localeCompare(b.horaAgendamento))
        })
      } catch (err) {
        console.error("Erro ao processar evento SSE:", err)
      }
    })

    eventSource.onerror = () => {
      setIsConnected(false)
      eventSource.close()
    }

    return () => {
      eventSource.close()
    }
  }, [apiUrl])

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header do Painel */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Painel do Dia</h1>
          <p className="text-sm text-muted-foreground">Acompanhamento de agendamentos em tempo real</p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`h-3 w-3 rounded-full ${
              isConnected ? "bg-emerald-500 animate-pulse" : "bg-destructive"
            }`}
          />
          <span className="text-xs font-medium text-muted-foreground">
            {isConnected ? "Conectado ao vivo" : "Reconectando..."}
          </span>
        </div>
      </div>

      {/* Grid de Cards de Agendamentos */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {agendamentos.map((item) => (
          <div
            key={item.agendamentoId}
            className="rounded-2xl border border-border bg-card p-5 shadow-xs transition-all hover:border-ring"
          >
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <span className="inline-flex items-center gap-1.5 font-bold text-lg text-primary">
                <Clock className="h-4 w-4" />
                {item.horaAgendamento.substring(0, 5)}
              </span>
              <span className="text-sm font-semibold text-foreground">
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                  item.valorTotal
                )}
              </span>
            </div>

            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-foreground font-medium">
                <User className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="truncate">{item.clienteNome}</span>
              </div>

              <div className="flex items-start gap-2 text-muted-foreground text-xs">
                <Scissors className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{item.itensNomes?.join(", ") || "Serviço padrão"}</span>
              </div>
            </div>
          </div>
        ))}

        {agendamentos.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            Nenhum agendamento registrado para hoje até o momento.
          </div>
        )}
      </div>
    </div>
  )
}