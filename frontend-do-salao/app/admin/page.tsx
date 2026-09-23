import { Scissors, Package, CalendarCheck, TrendingUp } from "lucide-react"
import { backendFetchJson, backendFetchText } from "@/lib/server-fetch"

interface ItemRankingDTO {
  nome: string
  quantidadeAgendamentos: number
}

export default async function DashboardPage() {
  // Única busca no servidor: todas as métricas chegam prontas no primeiro
  // HTML enviado ao navegador, sem estados de loading no cliente.
  const [
    agendamentosCount,
    faturamentoCount,
    servicoMaisSolicitado,
    produtoMaisSolicitado,
    topServicos,
    topProdutos,
  ] = await Promise.all([
    backendFetchJson<number>("/admin/agendamentosDoMes", 0),
    backendFetchJson<number>("/admin/faturamentoDoMes", 0),
    backendFetchText("/admin/servicoMaisSolicitado", ""),
    backendFetchText("/admin/produtoMaisSolicitado", ""),
    backendFetchJson<ItemRankingDTO[]>("/admin/topServicos?limite=5", []),
    backendFetchJson<ItemRankingDTO[]>("/admin/topProdutos?limite=5", []),
  ])

  return (
    <div className="w-full space-y-6 sm:space-y-8">
      <div>
        <h1 className="font-title text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
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
            }).format(faturamentoCount)}
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
                Nenhum serviço registrado neste mês.
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
                Nenhum produto registrado neste mês.
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
