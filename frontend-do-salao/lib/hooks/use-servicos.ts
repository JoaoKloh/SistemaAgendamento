import useSWR from "swr"
import type { ServicoDTO } from "@/lib/types/booking"

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error("Não foi possível carregar os serviços.")
  return res.json()
})

/**
 * Carrega a lista de serviços/produtos disponíveis para agendamento.
 * Usa SWR para cache e deduplicação de requisições entre montagens.
 */
export function useServicos() {
  const { data, error, isLoading } = useSWR<ServicoDTO[]>("/api/servicos", fetcher, {
    revalidateOnFocus: false,
  })

  return {
    servicos: data ?? [],
    isLoadingServicos: isLoading,
    errorServicos: error as Error | undefined,
  }
}
