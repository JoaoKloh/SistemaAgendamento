"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { CheckCircle2, Calendar, Clock, Scissors, MapPin } from "lucide-react"
import { salon } from "@/lib/data"

export function ConfirmationCard() {
  const params = useSearchParams()
  const servico = params.get("servico") ?? "Serviço"
  const data = params.get("data") ?? "A definir"
  const hora = params.get("hora") ?? "--:--"
  const nome = params.get("nome") ?? "Cliente"
  const preco = params.get("preco") ?? ""

  const rows = [
    { icon: Scissors, label: "Serviço", value: servico },
    { icon: Calendar, label: "Data", value: data },
    { icon: Clock, label: "Horário", value: hora },
  ]

  return (
    <div className="w-full max-w-md text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent">
        <CheckCircle2 className="h-8 w-8 text-accent-foreground" />
      </div>
      <h1 className="mt-6 text-balance font-serif text-3xl font-semibold text-foreground">
        Agendamento confirmado!
      </h1>
      <p className="mt-2 leading-relaxed text-muted-foreground">
        Tudo certo, {nome}. Seu horário com David Rabello está reservado.
      </p>

      <div className="mt-8 rounded-2xl border border-border bg-card p-6 text-left">
        <dl className="divide-y divide-border">
          {rows.map((row) => {
            const Icon = row.icon
            return (
              <div key={row.label} className="flex items-center justify-between py-3 first:pt-0">
                <dt className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Icon className="h-4 w-4" />
                  {row.label}
                </dt>
                <dd className="text-sm font-medium text-foreground">{row.value}</dd>
              </div>
            )
          })}
          {preco && (
            <div className="flex items-center justify-between py-3">
              <dt className="text-sm text-muted-foreground">Valor</dt>
              <dd className="text-sm font-semibold text-foreground">{preco}</dd>
            </div>
          )}
        </dl>

        <div className="mt-4 flex items-start gap-2 rounded-xl bg-secondary p-3 text-left text-xs leading-relaxed text-muted-foreground">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent-foreground" />
          {salon.address}
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-full border border-border bg-card px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
        >
          Voltar ao início
        </Link>
        <Link
          href="/agendamento"
          className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Novo agendamento
        </Link>
      </div>
    </div>
  )
}
