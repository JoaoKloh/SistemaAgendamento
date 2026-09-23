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
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent sm:h-16 sm:w-16">
        <CheckCircle2 className="h-7 w-7 text-accent-foreground sm:h-8 sm:w-8" />
      </div>
      <h1 className="mt-5 text-balance font-title text-2xl font-semibold tracking-tight text-foreground sm:mt-6 sm:text-3xl">
        Agendamento confirmado!
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
        Tudo certo, {nome}. Seu horário com David Rabello está reservado.
      </p>

      <div className="mt-6 rounded-2xl border border-border bg-card p-4 text-left sm:mt-8 sm:p-6">
        <dl className="divide-y divide-border">
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
                <dd className="break-words text-sm font-medium text-foreground sm:text-right">{row.value}</dd>
              </div>
            )
          })}
          {preco && (
            <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
              <dt className="text-xs text-muted-foreground sm:text-sm">Valor</dt>
              <dd className="text-sm font-semibold text-foreground sm:text-right">{preco}</dd>
            </div>
          )}
        </dl>

        <div className="mt-4 flex items-start gap-2 rounded-xl bg-secondary p-3 text-left text-xs leading-relaxed text-muted-foreground">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent-foreground" />
          {salon.address}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:justify-center">
        <Link
          href="/"
          className="inline-flex w-full items-center justify-center rounded-full border border-border bg-card px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary sm:w-auto"
        >
          Voltar ao início
        </Link>
        <Link
          href="/agendamento"
          className="inline-flex w-full items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 sm:w-auto"
        >
          Novo agendamento
        </Link>
      </div>
    </div>
  )
}
