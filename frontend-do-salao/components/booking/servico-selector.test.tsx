import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ServicoSelector } from "./servico-selector"
import type { ServicoDTO } from "@/lib/types/booking"

const servicos: ServicoDTO[] = [
  { id: 1, nome: "Corte Masculino", duracao: "00:45:00", preco: 70 },
  { id: 2, nome: "Barboterapia", duracao: "00:40:00", preco: 55 },
]

describe("ServicoSelector", () => {
  it("renderiza todos os serviços recebidos", () => {
    render(
      <ServicoSelector servicos={servicos} selectedItensIds={[1]} onToggle={vi.fn()} />
    )

    expect(screen.getByText("Corte Masculino")).toBeInTheDocument()
    expect(screen.getByText("Barboterapia")).toBeInTheDocument()
  })

  it("chama onToggle com o id do serviço clicado", async () => {
    const onToggle = vi.fn()
    const user = userEvent.setup()

    render(
      <ServicoSelector servicos={servicos} selectedItensIds={[1]} onToggle={onToggle} />
    )

    await user.click(screen.getByText("Barboterapia"))

    expect(onToggle).toHaveBeenCalledWith(2)
  })

  it("marca visualmente apenas os serviços selecionados", () => {
    render(
      <ServicoSelector servicos={servicos} selectedItensIds={[2]} onToggle={vi.fn()} />
    )

    const botaoSelecionado = screen.getByText("Barboterapia").closest("button")
    const botaoNaoSelecionado = screen.getByText("Corte Masculino").closest("button")

    expect(botaoSelecionado?.className).toContain("border-foreground")
    expect(botaoNaoSelecionado?.className).not.toContain("border-foreground")
  })
})
