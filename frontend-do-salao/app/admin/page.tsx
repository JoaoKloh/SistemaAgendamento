"use client"

import useSWR, { SWRConfiguration } from "swr"
import { Scissors, Package, CalendarCheck, TrendingUp } from "lucide-react"

interface ItemRankingDTO {
  nome: string
  quantidadeAgendamentos: number
}

const fetcherText = async (url: string) => {
  const res = await fetch(url, { credentials: "include" })
  if (!res.ok) throw new Error("Erro ao carregar dados")
  return res.text()
}

const fetcherJson = async (url: string) => {
  const res = await fetch(url, { credentials: "include" })
  if (!res.ok) throw new Error("Erro ao carregar dados")
  return res.json()
}

// Configuração estrita para requisição única sem retentativas automáticas
const swrStaticConfig: SWRConfiguration = {
  shouldRetryOnError: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  revalidateIfStale: false,
}

export default function DashboardPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

  // 1. Requisições das Métricas Principais (Apenas 1 tentativa por load de página)
  const { data: agendamentosCount, isLoading: loadingAgendamentos } = useSWR<number>(
    `${apiUrl}/admin/agendamentosDoMes`,
    fetcherJson,
    swrStaticConfig
  )

  const { data: faturamentoCount, isLoading: loadingFaturamento } = useSWR<number>(
    `${apiUrl}/admin/faturamentoDoMes`,
    fetcherJson,
    swrStaticConfig
  )

  const { data: servicoMaisSolicitado, isLoading: loadingServicoTop } = useSWR<string>(
    `${apiUrl}/admin/servicoMaisSolicitado`,
    fetcherText,
    swrStaticConfig
  )

  const { data: produtoMaisSolicitado, isLoading: loadingProdutoTop } = useSWR<string>(
    `${apiUrl}/admin/produtoMaisSolicitado`,
    fetcherText,
    swrStaticConfig
  )

  // 2. Requisições dos Rankings (Apenas 1 tentativa por load de página)
  const { data: topServicos, isLoading: loadingTopServicos } = useSWR<ItemRankingDTO[]>(
    `${apiUrl}/admin/topServicos?limite=5`,
    fetcherJson,
    swrStaticConfig
  )

  const { data: topProdutos, isLoading: loadingTopProdutos } = useSWR<ItemRankingDTO[]>(
    `${apiUrl}/admin/topProdutos?limite=5`,
    fetcherJson,
    swrStaticConfig
  )

  return (
    <div className="w-full space-y-6 sm:space-y-8">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl">
          Visão Geral
        </h1>
        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
          Métricas de desempenho e itens mais vendidos do mês atual
        </p>
      </div>

      {/* CARDS DE MÉTRICAS */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        {/* Card 1: Agendamentos do Mês */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Agendamentos do Mês</span>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="mt-2 font-serif text-xl font-bold text-foreground sm:mt-3 sm:text-2xl">
            {loadingAgendamentos ? "..." : agendamentosCount ?? 0}
          </p>
        </div>

        {/* Card 2: Serviço Mais Solicitado */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Serviço Mais Solicitado</span>
            <Scissors className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="mt-2 truncate font-serif text-lg font-bold text-foreground sm:mt-3">
            {loadingServicoTop ? "..." : servicoMaisSolicitado || "Nenhum"}
          </p>
        </div>

        {/* Card 3: Produto Mais Vendido */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Produto Mais Vendido</span>
            <Package className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="mt-2 truncate font-serif text-lg font-bold text-foreground sm:mt-3">
            {loadingProdutoTop ? "..." : produtoMaisSolicitado || "Nenhum"}
          </p>
        </div>

        {/* Card 4: Faturamento Estimado */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Faturamento Estimado</span>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="mt-2 font-serif text-xl font-bold text-foreground sm:mt-3 sm:text-2xl">
            {loadingFaturamento
              ? "..."
              : new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(faturamentoCount ?? 0)}
          </p>
        </div>
      </div>

      {/* TABELAS DE RANKING */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
        {/* Top Serviços */}
        <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
          <h2 className="font-serif text-base font-semibold text-foreground sm:text-lg">
            Top Serviços Requisitados
          </h2>
          <ul className="mt-3 divide-y divide-border">
            {loadingTopServicos && (
              <li className="py-3 text-xs text-muted-foreground sm:text-sm">Carregando ranking...</li>
            )}

            {!loadingTopServicos && (!topServicos || topServicos.length === 0) && (
              <li className="py-3 text-xs text-muted-foreground sm:text-sm">
                Nenhum serviço registrado neste mês.
              </li>
            )}

            {topServicos?.map((item, idx) => (
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
          <h2 className="font-serif text-base font-semibold text-foreground sm:text-lg">
            Top Produtos Vendidos
          </h2>
          <ul className="mt-3 divide-y divide-border">
            {loadingTopProdutos && (
              <li className="py-3 text-xs text-muted-foreground sm:text-sm">Carregando ranking...</li>
            )}

            {!loadingTopProdutos && (!topProdutos || topProdutos.length === 0) && (
              <li className="py-3 text-xs text-muted-foreground sm:text-sm">
                Nenhum produto registrado neste mês.
              </li>
            )}

            {topProdutos?.map((item, idx) => (
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