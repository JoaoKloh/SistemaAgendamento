import useSWR from "swr"
import type { AgendamentoUsuarioDTO } from "@/lib/types/booking"

export class SessaoExpiradaError extends Error {}

const fetcher = (url: string) => fetch(url).then((res) => {
  if (res.status === 401) throw new SessaoExpiradaError("Sua sessão expirou. Faça login novamente.")
  if (!res.ok) throw new Error("Não foi possível carregar seus agendamentos.")
  return res.json()
})

/**
 * Carrega os agendamentos ativos do usuário autenticado (GET
 * /usuario/agendamentos via proxy). O usuário é identificado pelo cookie de
 * sessão no backend — nenhum e-mail é enviado daqui. `fallbackData` recebe a
 * lista já buscada via SSR (app/meus-agendamentos/page.tsx); quando ela vem,
 * o primeiro render não refaz a busca.
 */
export function useMeusAgendamentos(fallbackData?: AgendamentoUsuarioDTO[]) {
  const { data, error, isLoading, mutate } = useSWR<AgendamentoUsuarioDTO[]>("/api/usuario/agendamentos", fetcher, {
    revalidateOnFocus: false,
    revalidateOnMount: fallbackData === undefined,
    fallbackData,
  })

  return {
    agendamentos: data ?? [],
    isLoadingAgendamentos: isLoading,
    errorAgendamentos: error as Error | undefined,
    mutateAgendamentos: mutate,
  }
}
