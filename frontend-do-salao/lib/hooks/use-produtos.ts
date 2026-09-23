import useSWR from "swr"
import type { ProdutoDTO } from "@/lib/types/booking"

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error("Não foi possível carregar os produtos.")
  return res.json()
})

/**
 * Carrega os produtos ativos disponíveis para adicionar ao agendamento
 * (GET /servicos/produtos via proxy). A chave do SWR só é montada quando
 * `enabled` é true, para não disparar a busca antes do usuário chegar na
 * etapa de produtos do formulário.
 */
export function useProdutos(enabled: boolean) {
  const { data, error, isLoading } = useSWR<ProdutoDTO[]>(
    enabled ? "/api/servicos/produtos" : null,
    fetcher,
    { revalidateOnFocus: false }
  )

  return {
    produtos: data ?? [],
    isLoadingProdutos: isLoading,
    errorProdutos: error as Error | undefined,
  }
}
