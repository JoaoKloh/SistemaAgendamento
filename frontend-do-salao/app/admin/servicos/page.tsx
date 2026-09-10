"use client"

import { useState } from "react"
import useSWR from "swr"
import { Trash2, Scissors, Package } from "lucide-react"

export interface ItemDTO {
  id: number
  nome: string
  detalhes: string
  duracao?: string
  preco: number
}

const fetcher = async (url: string) => {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  })

  if (!res.ok) {
    try {
      const errorBody = await res.json()
      throw new Error(errorBody.message || errorBody.error || "Erro ao carregar itens.")
    } catch (e: any) {
      throw new Error(e.message || `Erro ${res.status}`)
    }
  }

  return res.json()
}

export default function AdminServicosPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL 

  const [formData, setFormData] = useState({
    nome: "",
    preco: "",
    detalhes: "",
    duracao: "00:30:00",
    tipo: "SERVICO",
  })
  const [mensagem, setMensagem] = useState<{ texto: string; erro: boolean } | null>(null)

  // SWR para carregar dados atuais
  const { data: servicos, mutate: mutateServicos } = useSWR<ItemDTO[]>(`${apiUrl}/servicos`, fetcher, {
    shouldRetryOnError: false,
  })
  const { data: produtos, mutate: mutateProdutos } = useSWR<ItemDTO[]>(`${apiUrl}/servicos/produtos`, fetcher, {
    shouldRetryOnError: false,
  })

  // --- CRIAÇÃO DE SERVIÇO OU PRODUTO ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMensagem(null)

    const isServico = formData.tipo === "SERVICO"
    const endpoint = isServico ? `${apiUrl}/admin/criarServico` : `${apiUrl}/admin/criarProduto`

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          nome: formData.nome,
          preco: parseFloat(formData.preco),
          detalhes: formData.detalhes,
          duracao: isServico ? formData.duracao : null,
          tipo: formData.tipo,
        }),
      })

      if (!res.ok) {
        const errorBody = await res.json()
        throw new Error(errorBody.message || errorBody.error || "Erro ao cadastrar item.")
      }

      setMensagem({ texto: "Item cadastrado com sucesso!", erro: false })
      setFormData({ nome: "", preco: "", detalhes: "", duracao: "00:30:00", tipo: "SERVICO" })

      // Invalida o SWR para atualizar a listagem local e exibir o novo item
      mutateServicos()
      mutateProdutos()
    } catch (err: any) {
      setMensagem({ texto: err.message, erro: true })
    }
  }

  // --- DELEÇÃO DE ITEM (SOFT DELETE NO BACKEND) ---
  const handleDeletar = async (id: number) => {
    if (!confirm("Deseja realmente apagar este item?")) return

    try {
      const res = await fetch(`${apiUrl}/admin/apagarServico/${id}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!res.ok) {
        const errorBody = await res.json()
        throw new Error(errorBody.message || errorBody.error || "Erro ao remover item.")
      }

      setMensagem({ texto: "Item removido com sucesso!", erro: false })
      mutateServicos()
      mutateProdutos()
    } catch (err: any) {
      setMensagem({ texto: err.message, erro: true })
    }
  }

  return (
    <div className="w-full space-y-6 sm:max-w-4xl sm:space-y-8">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl">
          Gestão de Serviços & Produtos
        </h1>
        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
          Cadastre novos itens ou remova opções ativas do catálogo
        </p>
      </div>

      {mensagem && (
        <div
          className={`rounded-lg border p-3.5 text-xs sm:p-4 sm:text-sm ${
            mensagem.erro
              ? "border-destructive/20 bg-destructive/10 text-destructive"
              : "border-border bg-accent text-foreground"
          }`}
        >
          {mensagem.texto}
        </div>
      )}

      {/* FORMULÁRIO DE CADASTRO */}
      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
        <h2 className="font-serif text-base font-semibold text-foreground sm:text-lg">Cadastrar Novo Item</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-foreground">
              Tipo de Item
            </label>
            <select
              value={formData.tipo}
              onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
              className="h-11 w-full rounded-lg border border-border bg-background px-3 text-base text-foreground sm:text-sm"
            >
              <option value="SERVICO">Serviço (Corte, Barba, etc.)</option>
              <option value="PRODUTO">Produto (Pomada, Gel, etc.)</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-foreground">
              Nome
            </label>
            <input
              type="text"
              required
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className="h-11 w-full rounded-lg border border-border bg-background px-3 text-base text-foreground sm:text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-foreground">
              Preço (R$)
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={formData.preco}
              onChange={(e) => setFormData({ ...formData, preco: e.target.value })}
              className="h-11 w-full rounded-lg border border-border bg-background px-3 text-base text-foreground sm:text-sm"
            />
          </div>

          {formData.tipo === "SERVICO" && (
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-foreground">
                Duração (HH:mm:ss)
              </label>
              <input
                type="text"
                required
                value={formData.duracao}
                onChange={(e) => setFormData({ ...formData, duracao: e.target.value })}
                className="h-11 w-full rounded-lg border border-border bg-background px-3 text-base text-foreground sm:text-sm"
              />
            </div>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-foreground">
            Detalhes
          </label>
          <textarea
            rows={2}
            value={formData.detalhes}
            onChange={(e) => setFormData({ ...formData, detalhes: e.target.value })}
            className="w-full rounded-lg border border-border bg-background p-3 text-base text-foreground sm:text-sm"
          />
        </div>

        <button
          type="submit"
          className="h-11 w-full rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 active:scale-95"
        >
          Salvar Item
        </button>
      </form>

      {/* LISTAGEM DE ITENS ATIVOS COM OPÇÃO DE EXCLUSÃO */}
      <div className="space-y-6">
        <div>
          <h2 className="font-serif text-lg font-semibold text-foreground">Serviços Ativos</h2>
          <div className="mt-3 divide-y divide-border rounded-xl border border-border bg-card">
            {servicos?.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Scissors className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">{item.nome}</p>
                    <p className="text-xs text-muted-foreground">{item.detalhes}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-foreground">
                    R$ {item.preco.toFixed(2)}
                  </span>
                  <button
                    onClick={() => handleDeletar(item.id)}
                    className="rounded-lg p-2 text-destructive hover:bg-destructive/10"
                    title="Apagar serviço"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="font-serif text-lg font-semibold text-foreground">Produtos Ativos</h2>
          <div className="mt-3 divide-y divide-border rounded-xl border border-border bg-card">
            {produtos?.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">{item.nome}</p>
                    <p className="text-xs text-muted-foreground">{item.detalhes}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-foreground">
                    R$ {item.preco.toFixed(2)}
                  </span>
                  <button
                    onClick={() => handleDeletar(item.id)}
                    className="rounded-lg p-2 text-destructive hover:bg-destructive/10"
                    title="Apagar produto"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}