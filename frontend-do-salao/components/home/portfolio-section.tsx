import { salon } from "@/lib/data"
import type { PortfolioFotoDTO } from "@/lib/types/portfolio"
import { PortfolioGallery } from "@/components/home/portfolio-gallery"

interface PortfolioSectionProps {
  fotos: PortfolioFotoDTO[]
}

/**
 * Placeholder exibido via Suspense enquanto a busca de /portfolio (feita no
 * servidor) ainda está em andamento, para a seção não travar o restante da
 * home no streaming da resposta.
 */
export function PortfolioSectionSkeleton() {
  return (
    <section className="border-t border-border bg-card">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
        <div className="max-w-2xl">
          <p className="font-sans text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Portfólio
          </p>
          <h2 className="mt-3 text-balance font-title text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Trabalhos realizados
          </h2>
        </div>

        <div className="mt-10 columns-2 gap-4 sm:columns-3">
          {[220, 160, 260, 180, 240, 200].map((height, index) => (
            <div
              key={index}
              style={{ height }}
              className="mb-4 animate-pulse break-inside-avoid rounded-2xl border border-border bg-muted/50"
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export function PortfolioSection({ fotos }: PortfolioSectionProps) {
  return (
    <section id="portfolio" className="border-t border-border bg-card">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
        <div className="max-w-2xl">
          <p className="font-sans text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Portfólio
          </p>
          <h2 className="mt-3 text-balance font-title text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Trabalhos realizados
          </h2>
          <p className="mt-5 leading-relaxed text-muted-foreground">
            Confira alguns dos cortes e atendimentos feitos no {salon.name}.
          </p>
        </div>

        <div className="mt-10">
          {fotos.length > 0 ? (
            <PortfolioGallery fotos={fotos} />
          ) : (
            <p className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
              Em breve, fotos dos nossos trabalhos.
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
