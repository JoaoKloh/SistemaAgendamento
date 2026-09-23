"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { toast } from "sonner"
import { ImagePlus, Loader2, Trash2, Upload } from "lucide-react"
import type { PortfolioFotoDTO } from "@/lib/types/portfolio"

interface PortfolioManagerProps {
  fotosIniciais: PortfolioFotoDTO[]
}

const TAMANHO_MAXIMO_BYTES = 4 * 1024 * 1024

/**
 * Client Component: recebe a galeria já carregada via SSR e assume upload,
 * criação e exclusão no cliente a partir daí. O upload do arquivo em si vai
 * direto para /api/upload (Vercel Blob); só a URL resultante + a descrição
 * são enviadas para o backend Spring, que é quem persiste o registro.
 */
export function PortfolioManager({ fotosIniciais }: PortfolioManagerProps) {
  const [fotos, setFotos] = useState<PortfolioFotoDTO[]>(fotosIniciais)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [urlEnviada, setUrlEnviada] = useState<string | null>(null)
  const [descricao, setDescricao] = useState("")
  const [enviandoImagem, setEnviandoImagem] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [excluindoId, setExcluindoId] = useState<number | null>(null)

  const inputArquivoRef = useRef<HTMLInputElement>(null)

  const limparFormulario = () => {
    setPreviewUrl(null)
    setUrlEnviada(null)
    setDescricao("")
    if (inputArquivoRef.current) inputArquivoRef.current.value = ""
  }

  const handleSelecionarArquivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0]
    if (!arquivo) return

    if (!arquivo.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem.")
      return
    }
    if (arquivo.size > TAMANHO_MAXIMO_BYTES) {
      toast.error("A imagem excede o limite de 4 MB.")
      return
    }

    setPreviewUrl(URL.createObjectURL(arquivo))
    setUrlEnviada(null)
    setEnviandoImagem(true)

    try {
      const formData = new FormData()
      formData.append("file", arquivo)

      const res = await fetch("/api/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.message || "Não foi possível enviar a imagem.")
      }

      setUrlEnviada(data.url)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao conectar com o servidor.")
      setPreviewUrl(null)
    } finally {
      setEnviandoImagem(false)
    }
  }

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!urlEnviada) {
      toast.error("Envie uma foto antes de salvar.")
      return
    }
    if (!descricao.trim()) {
      toast.error("Escreva uma descrição para a foto.")
      return
    }

    setSalvando(true)
    try {
      const res = await fetch("/api/admin/criar/portfolio", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlEnviada, descricao: descricao.trim() }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.message || "Não foi possível salvar a foto no portfólio.")
      }

      setFotos((prev) => [data, ...prev])
      toast.success("Foto adicionada ao portfólio!")
      limparFormulario()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao conectar com o servidor.")
    } finally {
      setSalvando(false)
    }
  }

  const handleExcluir = async (foto: PortfolioFotoDTO) => {
    const confirmado = window.confirm("Remover essa foto do portfólio? Essa ação não pode ser desfeita.")
    if (!confirmado) return

    setExcluindoId(foto.id)
    try {
      const res = await fetch(`/api/admin/deletar/portfolio/${foto.id}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || "Não foi possível remover a foto.")
      }

      setFotos((prev) => prev.filter((f) => f.id !== foto.id))
      toast.success("Foto removida.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao conectar com o servidor.")
    } finally {
      setExcluindoId(null)
    }
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div>
        <h1 className="font-title text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Portfólio</h1>
        <p className="text-sm text-muted-foreground">
          Envie fotos do seu dispositivo para exibir no site.
        </p>
      </div>

      {/* Formulário de upload */}
      <form
        onSubmit={handleSalvar}
        className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-xs sm:flex-row"
      >
        <input
          ref={inputArquivoRef}
          type="file"
          accept="image/*"
          onChange={handleSelecionarArquivo}
          className="sr-only"
          id="portfolio-arquivo"
        />

        <label
          htmlFor="portfolio-arquivo"
          className="flex h-40 w-full shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-muted/40 hover:bg-muted sm:w-52"
        >
          {previewUrl ? (
            <div className="relative h-full w-full">
              <Image src={previewUrl} alt="Pré-visualização" fill className="object-cover" unoptimized />
              {enviandoImagem && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
              <ImagePlus className="h-6 w-6" />
              <span className="text-xs font-medium">Escolher foto</span>
            </div>
          )}
        </label>

        <div className="flex flex-1 flex-col gap-3">
          <label className="flex flex-1 flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">Descrição</span>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex.: Corte degradê com barba desenhada"
              rows={4}
              className="flex-1 resize-none rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </label>

          <button
            type="submit"
            disabled={!urlEnviada || enviandoImagem || salvando}
            className="flex items-center justify-center gap-1.5 self-end rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Adicionar ao portfólio
          </button>
        </div>
      </form>

      {/* Galeria */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
          {fotos.length} {fotos.length === 1 ? "foto publicada" : "fotos publicadas"}
        </h2>

        {fotos.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
            Nenhuma foto no portfólio ainda.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {fotos.map((foto) => (
              <div
                key={foto.id}
                className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted"
              >
                <Image
                  src={foto.url}
                  alt={foto.descricao}
                  fill
                  unoptimized
                  className="object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 pt-6">
                  <p className="truncate text-xs font-medium text-white">{foto.descricao}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleExcluir(foto)}
                  disabled={excluindoId === foto.id}
                  aria-label="Remover foto"
                  className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white opacity-100 transition-opacity hover:bg-destructive disabled:opacity-70 sm:opacity-0 sm:group-hover:opacity-100"
                >
                  {excluindoId === foto.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
