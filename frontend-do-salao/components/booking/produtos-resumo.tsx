"use client"

import { ChevronLeft, ChevronRight, Clock, Loader2 } from "lucide-react"
import { formatPrice } from "@/lib/date-utils"
import type { ProdutoDTO, ServicoDTO } from "@/lib/types/booking"

interface ProdutosResumoProps {
  selectedServicos: ServicoDTO[]
  selectedProdutos: ProdutoDTO[]
  dateLabel: string
  time: string | null
  valorTotal: number
  onVoltar: () => void
  isSubmitting: boolean
}

export function ProdutosResumo({
  selectedServicos,
  selectedProdutos,
  dateLabel,
  time,
  valorTotal,
  onVoltar,
  isSubmitting,
}: ProdutosResumoProps) {
  return (
    <aside className="w-full min-w-0 lg:sticky lg:top-24 lg:self-start">
      <div className="rounded-2xl border border-border bg-card p-4 shadow-xs sm:p-6">
        <h2 className="font-title text-lg font-semibold tracking-tight text-foreground sm:text-xl">
          Resumo do agendamento
        </h2>

        <dl className="mt-4 space-y-2.5 text-sm">
          <div className="flex flex-col gap-1">
            <dt className="text-muted-foreground">Serviços</dt>
            <dd className="font-medium text-foreground">
              {selectedServicos.map((s) => s.nome).join(", ")}
            </dd>
          </div>
          <div className="flex items-center justify-between pt-1">
            <dt className="text-muted-foreground">Data</dt>
            <dd className="font-medium text-foreground">{dateLabel}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Horário</dt>
            <dd className="flex items-center gap-1 font-medium text-foreground">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              {time ?? "--:--"}
            </dd>
          </div>

          <div className="flex flex-col gap-1 border-t border-border/80 pt-2.5">
            <dt className="text-muted-foreground">Produtos adicionados</dt>
            <dd className="font-medium text-foreground">
              {selectedProdutos.length > 0
                ? selectedProdutos.map((p) => p.nome).join(", ")
                : "Nenhum produto adicionado"}
            </dd>
          </div>

          <div className="flex items-center justify-between border-t border-border/80 pt-2.5">
            <dt className="text-muted-foreground">Valor total</dt>
            <dd className="text-base font-semibold text-foreground">{formatPrice(valorTotal)}</dd>
          </div>
        </dl>

        <div className="mt-5 flex flex-col gap-2.5">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-xs transition-all hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSubmitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <span>Finalizar agendamento</span>
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onVoltar}
            disabled={isSubmitting}
            className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-card text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Voltar</span>
          </button>
        </div>
      </div>
    </aside>
  )
}
