import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error("Não foi possível carregar os horários ocupados.")
  return res.json()
})

/**
 * Carrega os horários já reservados para a data informada (formato YYYY-MM-DD).
 * A chave do SWR já muda a cada dia selecionado, então o cache/deduplicação
 * substitui o controle manual de "já busquei essa data" feito antes com refs.
 */
export function useHorariosOcupados(dataFormatada: string | null) {
  const { data, isLoading } = useSWR<string[]>(
    dataFormatada ? `/api/agendamento/ocupados?data=${dataFormatada}` : null,
    fetcher
  )

  return {
    busyTimeSlots: data ?? [],
    isLoadingHorarios: isLoading,
  }
}
