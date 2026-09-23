import type { Metadata } from "next"
import Link from "next/link"
import { Home, SearchX } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Página não encontrada",
}

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-16 sm:px-6">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent sm:h-16 sm:w-16">
            <SearchX className="h-7 w-7 text-accent-foreground sm:h-8 sm:w-8" />
          </div>
          <p className="mt-5 font-sans text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground sm:mt-6">
            Erro 404
          </p>
          <h1 className="mt-3 text-balance font-title text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Página não encontrada
          </h1>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            O endereço que você tentou acessar não existe ou foi movido.
          </p>

          <Button render={<Link href="/" />} className="mt-8" size="lg">
            <Home />
            Voltar para o início
          </Button>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
