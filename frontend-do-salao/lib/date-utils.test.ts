import { describe, expect, it } from "vitest"
import { formatDuracao, formatLocalDate, formatPrice, getNextDays } from "./date-utils"

describe("formatLocalDate", () => {
  it("formata a data no padrão YYYY-MM-DD usando o fuso de São Paulo", () => {
    const data = new Date("2024-03-15T12:00:00Z")
    expect(formatLocalDate(data)).toBe("2024-03-15")
  })
})

describe("getNextDays", () => {
  it("retorna a quantidade solicitada de dias", () => {
    const dias = getNextDays(14)
    expect(dias).toHaveLength(14)
  })

  it("nunca inclui domingos entre os dias retornados", () => {
    const dias = getNextDays(30)
    const temDomingo = dias.some((d) => d.dateObj.getDay() === 0)
    expect(temDomingo).toBe(false)
  })

  it("cada dia tem a formattedDate consistente com o dateObj", () => {
    const dias = getNextDays(5)
    for (const dia of dias) {
      expect(dia.formattedDate).toBe(formatLocalDate(dia.dateObj))
    }
  })
})

describe("formatDuracao", () => {
  it("converte HH:mm:ss para minutos totais", () => {
    expect(formatDuracao("00:45:00")).toBe("45 min")
    expect(formatDuracao("01:20:00")).toBe("80 min")
  })

  it("retorna string vazia quando não há duração (produtos)", () => {
    expect(formatDuracao("")).toBe("")
  })
})

describe("formatPrice", () => {
  it("formata valores em reais", () => {
    expect(formatPrice(70)).toBe("R$ 70,00")
  })
})
