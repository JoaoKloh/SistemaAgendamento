"use client"

import { useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Calendar, CalendarX, Clock, Loader2, Scissors } from "lucide-react"
import { formatPrice } from "@/lib/date-utils"
import { montarUrlLogin, MEUS_AGENDAMENTOS_PATH } from "@/lib/auth-redirect"
import { SessaoExpiradaError, useMeusAgendamentos } from "@/lib/hooks/use-meus-agendamentos"
import type { AgendamentoUsuarioDTO } from "@/lib/types/booking"

interface MeusAgendamentosListaProps {
  agendamentosIniciais?: AgendamentoUsuarioDTO[]
}

function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.split("-").map(Number)
  return new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }).format(
    new Date(ano, mes - 1, dia)
  )
}

export function MeusAgendamentosLista({ agendamentosIniciais }: MeusAgendamentosListaProps) {
  const { agendamentos, isLoadingAgendamentos, errorAgendamentos, mutateAgendamentos } =
    useMeusAgendamentos(agendamentosIniciais)
  const [cancelandoId, setCancelandoId] = useState<number | null>(null)

  const handleCancelar = async (agendamento: AgendamentoUsuarioDTO) => {
    const confirmado = window.confirm(
      `Cancelar o agendamento de ${formatarData(agendamento.dataAgendamento)} às ${agendamento.horaAgendamento.substring(0, 5)}?`
    )
    if (!confirmado) return

    setCancelandoId(agendamento.idAgendamento)
    try {
      const res = await fetch(`/api/usuario/agendamentos/${agendamento.idAgendamento}/cancelar`, {
        method: "PATCH",
        credentials: "include",
      })

      const rawText = await res.text()
      let data: { message?: string; error?: string } = {}
      try {
        data = JSON.parse(rawText)
      } catch (_) {}

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Sua sessão expirou. Faça login novamente.")
        }
        // 404 (inexistente ou de outro usuário) e 409 (já cancelado) indicam
        // que a lista local está desatualizada: recarrega do backend.
        if (res.status === 404 || res.status === 409) {
          await mutateAgendamentos()
        }
        throw new Error(data.message || data.error || "Não foi possível cancelar o agendamento.")
      }

      toast.success("Agendamento cancelado.")
      await mutateAgendamentos(
        (atuais) => atuais?.filter((a) => a.idAgendamento !== agendamento.idAgendamento),
        { revalidate: true }
      )
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao conectar com o servidor.")
    } finally {
      setCancelandoId(null)
    }
  }

  if (isLoadingAgendamentos) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (errorAgendamentos) {
    const sessaoExpirada = errorAgendamentos instanceof SessaoExpiradaError
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
        <p>{errorAgendamentos.message}</p>
        {sessaoExpirada ? (
          <Link
            href={montarUrlLogin(MEUS_AGENDAMENTOS_PATH)}
            className="mt-4 inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Fazer login
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => mutateAgendamentos()}
            className="mt-4 inline-flex items-center justify-center rounded-full border border-border bg-card px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            Tentar novamente
          </button>
        )}
      </div>
    )
  }

  if (agendamentos.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
        <CalendarX className="mx-auto h-6 w-6" />
        <p className="mt-3">Você não possui agendamentos ativos.</p>
        <Link
          href="/agendamento"
          className="mt-4 inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Agendar horário
        </Link>
      </div>
    )
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {agendamentos.map((agendamento) => {
        const cancelando = cancelandoId === agendamento.idAgendamento
        const rows = [
          { icon: Calendar, label: "Data", value: formatarData(agendamento.dataAgendamento) },
          { icon: Clock, label: "Horário", value: agendamento.horaAgendamento.substring(0, 5) },
          {
            icon: Scissors,
            label: "Serviços e produtos",
            value: agendamento.servicosProdutos.map((item) => item.nome).join(", ") || "—",
          },
        ]

        return (
          <li
            key={agendamento.idAgendamento}
            className="flex flex-col rounded-2xl border border-border bg-card p-4 shadow-xs sm:p-6"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="font-sans text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
                Agendamento #{agendamento.idAgendamento}
              </span>
              <span className="rounded-full border border-emerald-400 bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-200">
                {agendamento.statusAgendamento ? "Confirmado" : "Cancelado"}
              </span>
            </div>

            <dl className="mt-4 flex-1 divide-y divide-border">
              {rows.map((row) => {
                const Icon = row.icon
                return (
                  <div
                    key={row.label}
                    className="flex flex-col gap-1 py-3 first:pt-0 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
                  >
                    <dt className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground sm:text-sm">
                      <Icon className="h-4 w-4 shrink-0" />
                      {row.label}
                    </dt>
                    <dd className="break-words text-sm font-medium text-foreground sm:text-right">
                      {row.value}
                    </dd>
                  </div>
                )
              })}
              <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                <dt className="text-xs text-muted-foreground sm:text-sm">Valor total</dt>
                <dd className="text-sm font-semibold text-foreground sm:text-right">
                  {formatPrice(agendamento.valorTotal)}
                </dd>
              </div>
            </dl>

            <button
              type="button"
              onClick={() => handleCancelar(agendamento)}
              disabled={cancelando}
              className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-destructive/30 px-6 py-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-60"
            >
              {cancelando && <Loader2 className="h-4 w-4 animate-spin" />}
              Cancelar agendamento
            </button>
          </li>
        )
      })}
    </ul>
  )
}
