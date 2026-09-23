import useSWR from "swr"
import type { ServicoDTO } from "@/lib/types/booking"

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error("Não foi possível carregar os serviços.")
  return res.json()
})

/**
 * Carrega a lista de serviços/produtos disponíveis para agendamento.
 * Usa SWR para cache e deduplicação de requisições entre montagens.
 * `fallbackData` recebe o array já buscado via SSR pelo Server Component
 * (app/agendamento/page.tsx), então nenhum fetch roda no primeiro render —
 * o hook só revalida em segundo plano a partir daí.
 */
export function useServicos(fallbackData?: ServicoDTO[]) {
  const { data, error, isLoading } = useSWR<ServicoDTO[]>("/api/servicos", fetcher, {
    revalidateOnFocus: false,
    fallbackData,
  })

  return {
    servicos: data ?? [],
    isLoadingServicos: isLoading,
    errorServicos: error as Error | undefined,
  }
}
