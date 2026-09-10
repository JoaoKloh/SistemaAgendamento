"use client"

import Link from "next/link"
import useSWR from "swr"
import { Scissors } from "lucide-react"

export interface ServiceDTO {
  id: number
  nome: string
  detalhes: string
  duracao: string
  preco: number
}

const fetcher = async (url: string) => {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
  })

  if (!res.ok) {
    try {
      const errorBody = await res.json()
      throw new Error(errorBody.message || errorBody.error || "Erro ao carregar serviços.")
    } catch (e: any) {
      if (e.message && e.message !== "[object Object]") throw e
      throw new Error(`Erro ${res.status}: ${res.statusText}`)
    }
  }

  return res.json()
}

function formatarDuracao(duracao: string): string {
  if (!duracao) return ""
  const partes = duracao.split(":")
  const horas = parseInt(partes[0], 10)
  const minutos = parseInt(partes[1], 10)

  if (horas > 0) {
    return `${horas}h ${minutos > 0 ? `${minutos}min` : ""}`
  }
  return `${minutos} min`
}

export function ServicesSection() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

  const { data: services, error, isLoading } = useSWR<ServiceDTO[]>(
    `${apiUrl}/servicos`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      shouldRetryOnError: false,
    }
  )

  return (
    <section id="servicos" className="w-full overflow-hidden border-t border-border bg-card">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 md:py-24">
        <div className="max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Serviços
          </p>
          <h2 className="mt-3 text-balance font-serif text-2xl font-semibold text-foreground sm:text-4xl">
            Cada detalhe pensado para o seu estilo
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:mt-4 sm:text-base">
            Técnicas apuradas e produtos selecionados para uma experiência completa de cuidado masculino.
          </p>
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-xs text-destructive sm:text-sm">
            {error.message}
          </div>
        )}

        {/* Grid Contido: 1 coluna no mobile, 2 no tablet, 4 no desktop */}
        <div className="mt-8 grid w-full grid-cols-1 gap-4 sm:mt-12 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading &&
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-[230px] w-full animate-pulse rounded-2xl border border-border/60 bg-background/50 p-6"
              />
            ))}

          {!isLoading &&
            services?.map((service) => (
              <div
                key={service.id}
                className="flex w-full min-w-0 flex-col justify-between rounded-2xl border border-border bg-background p-5 shadow-sm transition-shadow hover:shadow-md sm:p-6"
              >
                <div>
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent text-accent-foreground sm:h-11 sm:w-11">
                    <Scissors className="h-5 w-5" />
                  </span>
                  
                  {/* Força a quebra do título se for longo */}
                  <h3 className="mt-4 break-words font-serif text-lg font-semibold capitalize text-foreground sm:text-xl">
                    {service.nome}
                  </h3>
                  
                  {/* break-words garante que strings contínuas sem espaço não estourem a box */}
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground break-words line-clamp-3 sm:text-sm">
                    {service.detalhes}
                  </p>
                </div>

                {/* Footer do Card com alinhamento fixo na parte inferior */}
                <div className="mt-6 flex items-center justify-between border-t border-border pt-4 text-xs sm:text-sm">
                  <span className="text-muted-foreground">
                    {formatarDuracao(service.duracao)}
                  </span>
                  <span className="font-semibold text-foreground">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(service.preco)}
                  </span>
                </div>
              </div>
            ))}
        </div>

        <div className="mt-8 sm:mt-10">
          <Link
            href="/agendamento"
            className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 active:scale-95"
          >
            Reservar um serviço
          </Link>
        </div>
      </div>
    </section>
  )
}