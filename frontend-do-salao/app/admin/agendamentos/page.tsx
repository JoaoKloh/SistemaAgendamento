import type { Metadata } from "next"
import { backendFetchJson } from "@/lib/server-fetch"
import { AgendamentosPainel, type AgendamentoDetalhadoResponseDTO } from "./agendamentos-painel"

export const metadata: Metadata = {
  title: "Agendamentos",
  robots: { index: false, follow: false },
}

function getHojeFormatadoLocal(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date())

  const year = parts.find((p) => p.type === "year")?.value
  const month = parts.find((p) => p.type === "month")?.value
  const day = parts.find((p) => p.type === "day")?.value

  return `${year}-${month}-${day}`
}

export default async function DashboardAgendamentosPage() {
  const dataInicial = getHojeFormatadoLocal()

  // Busca inicial única no servidor para o dia de hoje; a partir daí o
  // AgendamentosPainel assume as trocas de data e o stream em tempo real.
  const agendamentosIniciais = await backendFetchJson<AgendamentoDetalhadoResponseDTO[]>(
    `/admin/agendamento/dia?data=${dataInicial}`,
    []
  )

  return <AgendamentosPainel dataInicial={dataInicial} agendamentosIniciais={agendamentosIniciais} />
}
