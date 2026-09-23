"use client"

import Image from "next/image"
import { Check, Loader2, Package } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatPrice } from "@/lib/date-utils"
import type { ProdutoDTO } from "@/lib/types/booking"

interface ProdutoSelectorProps {
  produtos: ProdutoDTO[]
  isLoading: boolean
  selectedProdutosIds: number[]
  onToggle: (id: number) => void
}

export function ProdutoSelector({ produtos, isLoading, selectedProdutosIds, onToggle }: ProdutoSelectorProps) {
  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  if (produtos.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
        Nenhum produto disponível no momento.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {produtos.map((produto) => {
        const isSelected = selectedProdutosIds.includes(produto.id)
        return (
          <button
            key={produto.id}
            type="button"
            onClick={() => onToggle(produto.id)}
            className={cn(
              "group flex flex-col overflow-hidden rounded-2xl border bg-card text-left transition-all active:scale-[0.98]",
              isSelected ? "border-foreground shadow-sm ring-1 ring-foreground" : "border-border hover:border-ring"
            )}
          >
            <span className="relative block aspect-[4/3] w-full shrink-0 overflow-hidden bg-muted">
              {produto.urlImagem ? (
                <Image
                  src={produto.urlImagem}
                  alt={produto.nome}
                  fill
                  unoptimized
                  className="object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center">
                  <Package className="h-7 w-7 text-muted-foreground" />
                </span>
              )}
              {isSelected && (
                <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-background shadow-sm">
                  <Check className="h-3.5 w-3.5" />
                </span>
              )}
            </span>
            <span className="flex flex-col gap-0.5 p-3">
              <span className="truncate text-sm font-semibold text-foreground">{produto.nome}</span>
              <span className="text-xs text-muted-foreground">{formatPrice(produto.preco)}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
