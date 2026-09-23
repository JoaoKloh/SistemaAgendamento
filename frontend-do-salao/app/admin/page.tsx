import { Scissors, Package, CalendarCheck, TrendingUp } from "lucide-react"
import type { Metadata } from "next"
import { backendFetchJson } from "@/lib/server-fetch"
import { DateRangeFilter } from "./date-range-filter"

export const metadata: Metadata = {
  title: "Painel administrativo",
  robots: { index: false, follow: false },
}

interface ItemRankingDTO {
  nome: string
  quantidadeAgendamentos: number
}

interface DashboardResumoDTO {
  dataInicio: string
  dataFim: string
  agendamentosCount: number
  faturamento: number
  servicoMaisSolicitado: string
  produtoMaisSolicitado: string
  topServicos: ItemRankingDTO[]
  topProdutos: ItemRankingDTO[]
}

const RESUMO_VAZIO: DashboardResumoDTO = {
  dataInicio: "",
  dataFim: "",
  agendamentosCount: 0,
  faturamento: 0,
  servicoMaisSolicitado: "",
  produtoMaisSolicitado: "",
  topServicos: [],
  topProdutos: [],
}

interface DashboardPageProps {
  searchParams: Promise<{ dataInicio?: string; dataFim?: string }>
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const { dataInicio, dataFim } = await searchParams

  const params = new URLSearchParams()
  if (dataInicio) params.set("dataInicio", dataInicio)
  if (dataFim) params.set("dataFim", dataFim)
  const query = params.toString()

  // Única busca no servidor: todas as métricas do período selecionado
  // (ou, na ausência de filtro, do mês atual até hoje) chegam prontas no
  // primeiro HTML enviado ao navegador, sem estados de loading no cliente.
  const resumo = await backendFetchJson<DashboardResumoDTO>(
    `/admin/dashboardResumo${query ? `?${query}` : ""}`,
    RESUMO_VAZIO
  )

  const {
    agendamentosCount,
    faturamento,
    servicoMaisSolicitado,
    produtoMaisSolicitado,
    topServicos,
    topProdutos,
  } = resumo

  return (
    <div className="w-full space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-title text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Visão Geral
          </h1>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            Métricas de desempenho e itens mais vendidos do período selecionado
          </p>
        </div>

        <DateRangeFilter dataInicio={resumo.dataInicio} dataFim={resumo.dataFim} />
      </div>

      {/* CARDS DE MÉTRICAS */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        {/* Card 1: Agendamentos do Período */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Agendamentos do Período</span>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="mt-2 text-xl font-bold text-foreground sm:mt-3 sm:text-2xl">
            {agendamentosCount}
          </p>
        </div>

        {/* Card 2: Serviço Mais Solicitado */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Serviço Mais Solicitado</span>
            <Scissors className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="mt-2 truncate text-lg font-bold text-foreground sm:mt-3">
            {servicoMaisSolicitado || "Nenhum"}
          </p>
        </div>

        {/* Card 3: Produto Mais Vendido */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Produto Mais Vendido</span>
            <Package className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="mt-2 truncate text-lg font-bold text-foreground sm:mt-3">
            {produtoMaisSolicitado || "Nenhum"}
          </p>
        </div>

        {/* Card 4: Faturamento Estimado */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Faturamento Estimado</span>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="mt-2 text-xl font-bold text-foreground sm:mt-3 sm:text-2xl">
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(faturamento)}
          </p>
        </div>
      </div>

      {/* TABELAS DE RANKING */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
        {/* Top Serviços */}
        <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
          <h2 className="font-title text-base font-semibold tracking-tight text-foreground sm:text-lg">
            Top Serviços Requisitados
          </h2>
          <ul className="mt-3 divide-y divide-border">
            {topServicos.length === 0 && (
              <li className="py-3 text-xs text-muted-foreground sm:text-sm">
                Nenhum serviço registrado neste período.
              </li>
            )}

            {topServicos.map((item, idx) => (
              <li key={idx} className="flex items-center justify-between py-3 text-xs sm:text-sm">
                <span className="font-medium text-foreground">{item.nome}</span>
                <span className="text-muted-foreground">
                  {item.quantidadeAgendamentos} agendamento{item.quantidadeAgendamentos > 1 ? "s" : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Top Produtos */}
        <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
          <h2 className="font-title text-base font-semibold tracking-tight text-foreground sm:text-lg">
            Top Produtos Vendidos
          </h2>
          <ul className="mt-3 divide-y divide-border">
            {topProdutos.length === 0 && (
              <li className="py-3 text-xs text-muted-foreground sm:text-sm">
                Nenhum produto registrado neste período.
              </li>
            )}

            {topProdutos.map((item, idx) => (
              <li key={idx} className="flex items-center justify-between py-3 text-xs sm:text-sm">
                <span className="font-medium text-foreground">{item.nome}</span>
                <span className="text-muted-foreground">
                  {item.quantidadeAgendamentos} unidade{item.quantidadeAgendamentos > 1 ? "s" : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
