"use client"

import { Check, Scissors } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDuracao, formatPrice } from "@/lib/date-utils"
import type { ServicoDTO } from "@/lib/types/booking"

interface ServicoSelectorProps {
  servicos: ServicoDTO[]
  selectedItensIds: number[]
  onToggle: (id: number) => void
}

export function ServicoSelector({ servicos, selectedItensIds, onToggle }: ServicoSelectorProps) {
  return (
    <section className="w-full min-w-0">
      <h2 className="flex items-center gap-2.5 text-sm font-medium text-foreground">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
          1
        </span>
        Selecione os serviços desejado:
      </h2>
      <div className="mt-3 grid gap-2.5 sm:grid-cols-2 sm:gap-3">
        {servicos.map((s) => {
          const isSelected = selectedItensIds.includes(s.id)
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onToggle(s.id)}
              className={cn(
                "flex min-h-[72px] w-full items-center gap-3.5 rounded-2xl border p-3.5 text-left transition-all active:scale-[0.99]",
                isSelected
                  ? "border-foreground bg-accent shadow-sm"
                  : "border-border bg-card hover:border-ring"
              )}
            >
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background text-accent-foreground shadow-xs">
                <Scissors className="h-5 w-5" />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block truncate text-sm font-medium text-foreground">{s.nome}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {formatDuracao(s.duracao)} · {formatPrice(s.preco)}
                </span>
              </span>
              {isSelected && <Check className="h-5 w-5 shrink-0 text-foreground" />}
            </button>
          )
        })}
      </div>
    </section>
  )
}
