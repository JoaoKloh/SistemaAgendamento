export const weekdays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
export const months = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]

export interface DiaAgenda {
  dateObj: Date
  formattedDate: string
}

/** Formata uma data estritamente no fuso local do Brasil (YYYY-MM-DD). */
export function formatLocalDate(d: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d)

  const year = parts.find((p) => p.type === "year")?.value
  const month = parts.find((p) => p.type === "month")?.value
  const day = parts.find((p) => p.type === "day")?.value

  return `${year}-${month}-${day}`
}

/** Retorna os próximos `count` dias a partir de hoje, pulando domingos. */
export function getNextDays(count: number): DiaAgenda[] {
  const days: DiaAgenda[] = []
  const now = new Date()

  let adicionados = 0
  let incremento = 0

  while (adicionados < count) {
    const d = new Date(now)
    d.setDate(now.getDate() + incremento)
    incremento++

    // Pula domingos (0 = Domingo)
    if (d.getDay() !== 0) {
      days.push({
        dateObj: d,
        formattedDate: formatLocalDate(d),
      })
      adicionados++
    }
  }

  return days
}

export function formatDuracao(duracao: string): string {
  if (!duracao) return ""
  const partes = duracao.split(":")
  const horas = parseInt(partes[0], 10)
  const minutos = parseInt(partes[1], 10)
  const totalMinutos = horas * 60 + minutos
  return `${totalMinutos} min`
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(price)
}
