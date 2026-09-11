"use client"

import { ChevronRight, Clock, Loader2, Mail, Phone, User } from "lucide-react"
import { formatPrice } from "@/lib/date-utils"
import type { ServicoDTO } from "@/lib/types/booking"

interface ClienteData {
  name: string
  email: string
  phone: string
}

interface BookingSummaryProps {
  selectedServicos: ServicoDTO[]
  time: string | null
  valorTotal: number
  cliente: ClienteData
  onClienteChange: (campo: keyof ClienteData, valor: string) => void
  canSubmit: boolean
  isSubmitting: boolean
}

export function BookingSummary({
  selectedServicos,
  time,
  valorTotal,
  cliente,
  onClienteChange,
  canSubmit,
  isSubmitting,
}: BookingSummaryProps) {
  return (
    <aside className="w-full min-w-0 lg:sticky lg:top-24 lg:self-start">
      <div className="rounded-2xl border border-border bg-card p-4 shadow-xs sm:p-6">
        <h2 className="font-serif text-lg font-semibold text-foreground sm:text-xl">Resumo do agendamento</h2>

        <dl className="mt-4 space-y-2.5 text-sm">
          <div className="flex flex-col gap-1">
            <dt className="text-muted-foreground">Itens Selecionados</dt>
            <dd className="font-medium text-foreground">
              {selectedServicos.length > 0
                ? selectedServicos.map((s) => s.nome).join(", ")
                : "Nenhum item selecionado"}
            </dd>
          </div>
          <div className="flex items-center justify-between pt-1">
            <dt className="text-muted-foreground">Horário</dt>
            <dd className="flex items-center gap-1 font-medium text-foreground">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              {time ?? "--:--"}
            </dd>
          </div>
          <div className="flex items-center justify-between border-t border-border/80 pt-2.5">
            <dt className="text-muted-foreground">Valor total</dt>
            <dd className="text-base font-semibold text-foreground">{formatPrice(valorTotal)}</dd>
          </div>
        </dl>

        {/* Dados do Cliente */}
        <div className="mt-5 space-y-3.5 border-t border-border/80 pt-4">
          <div>
            <label htmlFor="nome" className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-foreground">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              Nome completo
            </label>
            <input
              id="nome"
              type="text"
              required
              value={cliente.name}
              onChange={(e) => onClienteChange("name", e.target.value)}
              placeholder="Seu nome"
              autoComplete="name"
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-base text-foreground outline-none transition-colors focus:border-ring sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-foreground">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              E-mail
            </label>
            <input
              id="email"
              type="email"
              required
              value={cliente.email}
              onChange={(e) => onClienteChange("email", e.target.value)}
              placeholder="seu@email.com"
              autoComplete="email"
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-base text-foreground outline-none transition-colors focus:border-ring sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="telefone" className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-foreground">
              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
              Telefone / Whatsapp
            </label>
            <input
              id="telefone"
              type="tel"
              required
              value={cliente.phone}
              onChange={(e) => onClienteChange("phone", e.target.value)}
              placeholder="(24) 99999-9999"
              autoComplete="tel"
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-base text-foreground outline-none transition-colors focus:border-ring sm:text-sm"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-xs transition-all hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSubmitting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <span>Confirmar agendamento</span>
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
