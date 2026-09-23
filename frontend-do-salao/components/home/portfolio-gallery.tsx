"use client"

import { motion } from "motion/react"
import { InView } from "@/components/ui/in-view"
import type { PortfolioFotoDTO } from "@/lib/types/portfolio"

interface PortfolioGalleryProps {
  fotos: PortfolioFotoDTO[]
}

/**
 * Presentational: recebe as fotos já carregadas via SSR em app/page.tsx
 * (GET /portfolio, alimentado pelo upload feito no painel admin). Precisa
 * ser Client Component porque a animação de entrada (motion/react) só roda
 * no navegador.
 */
export function PortfolioGallery({ fotos }: PortfolioGalleryProps) {
  if (fotos.length === 0) return null

  return (
    <InView
      viewOptions={{ once: true, margin: "0px 0px -120px 0px" }}
      variants={{
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
      }}
    >
      <div className="columns-2 gap-4 sm:columns-3">
        {fotos.map((foto) => (
          <motion.div
            key={foto.id}
            variants={{
              hidden: { opacity: 0, scale: 0.8, filter: "blur(10px)" },
              visible: { opacity: 1, scale: 1, filter: "blur(0px)" },
            }}
            className="relative mb-4 break-inside-avoid overflow-hidden rounded-2xl border border-border bg-muted"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- layout em colunas exige altura intrínseca da imagem, incompatível com next/image */}
            <img src={foto.url} alt={foto.descricao} className="w-full rounded-2xl object-cover" />
            {foto.descricao && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-3 pb-2.5 pt-8">
                <p className="text-sm font-medium text-white">{foto.descricao}</p>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </InView>
  )
}
