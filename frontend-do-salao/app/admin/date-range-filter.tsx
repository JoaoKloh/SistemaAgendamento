"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CalendarRange, RotateCcw } from "lucide-react"

interface DateRangeFilterProps {
  /** Data inicial do período atualmente exibido, já resolvida pelo backend. */
  dataInicio: string
  /** Data final do período atualmente exibido, já resolvida pelo backend. */
  dataFim: string
}

/**
 * Filtro de período do dashboard: atualiza a query string (?dataInicio=&dataFim=)
 * e deixa o Server Component (app/admin/page.tsx) refazer a busca no backend
 * com o novo intervalo. Sem período selecionado, a própria página volta a
 * usar os valores padrão (primeiro dia do mês atual até hoje).
 */
export function DateRangeFilter({ dataInicio, dataFim }: DateRangeFilterProps) {
  const router = useRouter()
  const [inicio, setInicio] = useState(dataInicio)
  const [fim, setFim] = useState(dataFim)

  const aplicarFiltro = () => {
    const params = new URLSearchParams()
    if (inicio) params.set("dataInicio", inicio)
    if (fim) params.set("dataFim", fim)
    router.push(`/admin?${params.toString()}`)
  }

  const limparFiltro = () => {
    router.push("/admin")
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3 sm:flex-row sm:items-end sm:gap-3 sm:p-4">
      <label className="flex flex-1 flex-col gap-1 sm:min-w-[140px]">
        <span className="text-xs font-medium text-muted-foreground">Data inicial</span>
        <input
          type="date"
          value={inicio}
          max={fim || undefined}
          onChange={(e) => setInicio(e.target.value)}
          className="rounded-lg border border-border bg-transparent px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </label>

      <label className="flex flex-1 flex-col gap-1 sm:min-w-[140px]">
        <span className="text-xs font-medium text-muted-foreground">Data final</span>
        <input
          type="date"
          value={fim}
          min={inicio || undefined}
          onChange={(e) => setFim(e.target.value)}
          className="rounded-lg border border-border bg-transparent px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </label>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={aplicarFiltro}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:opacity-90 sm:flex-none"
        >
          <CalendarRange className="h-4 w-4" />
          Filtrar
        </button>
        <button
          type="button"
          onClick={limparFiltro}
          title="Voltar ao período padrão (mês atual)"
          className="flex items-center justify-center rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
