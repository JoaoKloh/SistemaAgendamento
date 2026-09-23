"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { Trash2, Scissors, Package, ImagePlus, Loader2 } from "lucide-react"

export interface ItemDTO {
  id: number
  nome: string
  detalhes: string
  duracao?: string
  preco: number
  urlImagem?: string | null
}

const TAMANHO_MAXIMO_BYTES = 4 * 1024 * 1024

interface ServicosManagerProps {
  initialServicos: ItemDTO[]
  initialProdutos: ItemDTO[]
}

/**
 * Client Component de mutações: recebe os dados já carregados via SSR pelo
 * Server Component (app/admin/servicos/page.tsx) e, a partir daí, cria/exclui
 * itens direto no estado local (sem recarregar a página nem refazer as duas
 * buscas). O backend não devolve o registro criado (POST retorna 201 sem
 * corpo), então após criar um item buscamos só aquela lista para pegar o id
 * real; a exclusão é 100% local, via filter, pois já sabemos o id removido.
 */
export function ServicosManager({ initialServicos, initialProdutos }: ServicosManagerProps) {
  const [servicos, setServicos] = useState<ItemDTO[]>(initialServicos)
  const [produtos, setProdutos] = useState<ItemDTO[]>(initialProdutos)

  const [formData, setFormData] = useState({
    nome: "",
    preco: "",
    detalhes: "",
    duracao: "00:30:00",
    tipo: "SERVICO",
    urlImagem: "",
  })
  const [mensagem, setMensagem] = useState<{ texto: string; erro: boolean } | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [enviandoImagem, setEnviandoImagem] = useState(false)
  const inputArquivoRef = useRef<HTMLInputElement>(null)

  // Fotos só existem para produtos: ao voltar para "Serviço" descartamos
  // qualquer imagem já enviada para não deixar um urlImagem "órfão" no form.
  const handleMudarTipo = (tipo: string) => {
    setFormData((prev) => ({ ...prev, tipo, urlImagem: tipo === "SERVICO" ? "" : prev.urlImagem }))
    if (tipo === "SERVICO") {
      setPreviewUrl(null)
      if (inputArquivoRef.current) inputArquivoRef.current.value = ""
    }
  }

  const handleSelecionarArquivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0]
    if (!arquivo) return

    if (!arquivo.type.startsWith("image/")) {
      setMensagem({ texto: "Selecione um arquivo de imagem.", erro: true })
      return
    }
    if (arquivo.size > TAMANHO_MAXIMO_BYTES) {
      setMensagem({ texto: "A imagem excede o limite de 4 MB.", erro: true })
      return
    }

    setPreviewUrl(URL.createObjectURL(arquivo))
    setFormData((prev) => ({ ...prev, urlImagem: "" }))
    setEnviandoImagem(true)

    try {
      const uploadData = new FormData()
      uploadData.append("file", arquivo)
      uploadData.append("pasta", "produtos")

      const res = await fetch("/api/upload", {
        method: "POST",
        credentials: "include",
        body: uploadData,
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.message || "Não foi possível enviar a imagem.")
      }

      setFormData((prev) => ({ ...prev, urlImagem: data.url }))
    } catch (err: any) {
      setMensagem({ texto: err.message || "Erro ao enviar a imagem.", erro: true })
      setPreviewUrl(null)
    } finally {
      setEnviandoImagem(false)
    }
  }

  const recarregarLista = async (isServico: boolean) => {
    const res = await fetch(isServico ? "/api/servicos" : "/api/servicos/produtos", {
      credentials: "include",
    })
    if (!res.ok) return
    const lista: ItemDTO[] = await res.json()
    if (isServico) setServicos(lista)
    else setProdutos(lista)
  }

  // --- CRIAÇÃO DE SERVIÇO OU PRODUTO ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMensagem(null)

    const isServico = formData.tipo === "SERVICO"
    const endpoint = isServico ? "/api/admin/criarServico" : "/api/admin/criarProduto"

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
          urlImagem: isServico ? null : formData.urlImagem || null,
        }),
      })

      if (!res.ok) {
        const errorBody = await res.json()
        throw new Error(errorBody.message || errorBody.error || "Erro ao cadastrar item.")
      }

      setMensagem({ texto: "Item cadastrado com sucesso!", erro: false })
      setFormData({ nome: "", preco: "", detalhes: "", duracao: "00:30:00", tipo: "SERVICO", urlImagem: "" })
      setPreviewUrl(null)
      if (inputArquivoRef.current) inputArquivoRef.current.value = ""

      await recarregarLista(isServico)
    } catch (err: any) {
      setMensagem({ texto: err.message, erro: true })
    }
  }

  // --- DELEÇÃO DE ITEM (SOFT DELETE NO BACKEND) ---
  const handleDeletar = async (id: number, isServico: boolean) => {
    if (!confirm("Deseja realmente apagar este item?")) return

    try {
      const res = await fetch(`/api/admin/apagarServico/${id}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!res.ok) {
        const errorBody = await res.json()
        throw new Error(errorBody.message || errorBody.error || "Erro ao remover item.")
      }

      setMensagem({ texto: "Item removido com sucesso!", erro: false })

      // Mutação local imutável: remove o item da lista já em memória, sem
      // refazer a busca dos dois catálogos inteiros.
      if (isServico) {
        setServicos((prev) => prev.filter((item) => item.id !== id))
      } else {
        setProdutos((prev) => prev.filter((item) => item.id !== id))
      }
    } catch (err: any) {
      setMensagem({ texto: err.message, erro: true })
    }
  }

  return (
    <div className="w-full space-y-6 sm:max-w-4xl sm:space-y-8">
      <div>
        <h1 className="font-title text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
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
        <h2 className="font-title text-base font-semibold tracking-tight text-foreground sm:text-lg">Cadastrar Novo Item</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-foreground">
              Tipo de Item
            </label>
            <select
              value={formData.tipo}
              onChange={(e) => handleMudarTipo(e.target.value)}
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

        {formData.tipo === "PRODUTO" && (
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-foreground">
              Foto do produto
            </label>
            <div className="flex items-center gap-4">
              <input
                ref={inputArquivoRef}
                type="file"
                accept="image/*"
                onChange={handleSelecionarArquivo}
                className="sr-only"
                id="produto-arquivo"
              />
              <label
                htmlFor="produto-arquivo"
                className="flex h-24 w-24 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-muted/40 hover:bg-muted"
              >
                {previewUrl ? (
                  <div className="relative h-full w-full">
                    <Image src={previewUrl} alt="Pré-visualização" fill className="object-cover" unoptimized />
                    {enviandoImagem && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <Loader2 className="h-5 w-5 animate-spin text-white" />
                      </div>
                    )}
                  </div>
                ) : (
                  <ImagePlus className="h-5 w-5 text-muted-foreground" />
                )}
              </label>
              <p className="text-xs text-muted-foreground">
                Opcional. JPG ou PNG, até 4 MB.
              </p>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={enviandoImagem}
          className="h-11 w-full rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 active:scale-95 disabled:opacity-50"
        >
          Salvar Item
        </button>
      </form>

      {/* LISTAGEM DE ITENS ATIVOS COM OPÇÃO DE EXCLUSÃO */}
      <div className="space-y-6">
        <div>
          <h2 className="font-title text-lg font-semibold tracking-tight text-foreground">Serviços Ativos</h2>
          <div className="mt-3 divide-y divide-border rounded-xl border border-border bg-card">
            {servicos.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <Scissors className="h-5 w-5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{item.nome}</p>
                    <p className="truncate text-xs text-muted-foreground">{item.detalhes}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2 sm:gap-4">
                  <span className="text-sm font-semibold text-foreground">
                    R$ {item.preco.toFixed(2)}
                  </span>
                  <button
                    onClick={() => handleDeletar(item.id, true)}
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
          <h2 className="font-title text-lg font-semibold tracking-tight text-foreground">Produtos Ativos</h2>
          <div className="mt-3 divide-y divide-border rounded-xl border border-border bg-card">
            {produtos.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 p-4">
                <div className="flex min-w-0 items-center gap-3">
                  {item.urlImagem ? (
                    <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                      <Image src={item.urlImagem} alt={item.nome} fill unoptimized className="object-cover" />
                    </div>
                  ) : (
                    <Package className="h-5 w-5 shrink-0 text-muted-foreground" />
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{item.nome}</p>
                    <p className="truncate text-xs text-muted-foreground">{item.detalhes}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2 sm:gap-4">
                  <span className="text-sm font-semibold text-foreground">
                    R$ {item.preco.toFixed(2)}
                  </span>
                  <button
                    onClick={() => handleDeletar(item.id, false)}
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
