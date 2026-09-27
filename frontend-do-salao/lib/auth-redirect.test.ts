import { describe, expect, it } from "vitest"
import { exigeAutenticacao, montarUrlLogin, obterDestinoSeguro } from "./auth-redirect"

describe("exigeAutenticacao", () => {
  it("protege o agendamento e suas subrotas", () => {
    expect(exigeAutenticacao("/agendamento")).toBe(true)
    expect(exigeAutenticacao("/agendamento/concluido")).toBe(true)
    expect(exigeAutenticacao("/meus-agendamentos")).toBe(true)
  })

  it("não protege rotas públicas nem prefixos parecidos", () => {
    expect(exigeAutenticacao("/")).toBe(false)
    expect(exigeAutenticacao("/agendamentos-antigos")).toBe(false)
    expect(exigeAutenticacao("/auth/login")).toBe(false)
  })
})

describe("obterDestinoSeguro", () => {
  it("aceita caminhos internos", () => {
    expect(obterDestinoSeguro("/agendamento")).toBe("/agendamento")
    expect(obterDestinoSeguro("/agendamento?data=2030-01-10")).toBe("/agendamento?data=2030-01-10")
  })

  it("rejeita destinos externos ou vazios", () => {
    expect(obterDestinoSeguro(null)).toBeNull()
    expect(obterDestinoSeguro("")).toBeNull()
    expect(obterDestinoSeguro("https://evil.com")).toBeNull()
    expect(obterDestinoSeguro("//evil.com")).toBeNull()
    expect(obterDestinoSeguro("/\\evil.com")).toBeNull()
  })

  it("rejeita a própria rota de login para evitar loop", () => {
    expect(obterDestinoSeguro("/auth/login")).toBeNull()
    expect(obterDestinoSeguro("/auth/login?redirect=/agendamento")).toBeNull()
  })
})

describe("montarUrlLogin", () => {
  it("codifica o destino no parâmetro redirect", () => {
    expect(montarUrlLogin("/agendamento?x=1")).toBe("/auth/login?redirect=%2Fagendamento%3Fx%3D1")
  })
})
