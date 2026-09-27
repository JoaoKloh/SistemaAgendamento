import type { Metadata } from "next"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { MeusAgendamentosLista } from "@/components/meus-agendamentos/meus-agendamentos-lista"
import { backendFetchJson } from "@/lib/server-fetch"
import type { AgendamentoUsuarioDTO } from "@/lib/types/booking"

export const metadata: Metadata = {
  title: "Meus agendamentos",
  robots: { index: false, follow: false },
}

export default async function MeusAgendamentosPage() {
  // Busca inicial no servidor com o cookie da sessão (o middleware já barrou
  // quem não está autenticado). Em caso de falha vem `undefined` e a lista
  // refaz a busca no cliente, exibindo loading/erro normalmente.
  const agendamentosIniciais = await backendFetchJson<AgendamentoUsuarioDTO[] | undefined>(
    "/usuario/agendamentos",
    undefined
  )

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 md:py-16">
          <p className="font-sans text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Minha conta
          </p>
          <h1 className="mt-3 text-balance font-title text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Meus agendamentos
          </h1>
          <p className="mt-3 max-w-xl leading-relaxed text-muted-foreground">
            Acompanhe seus horários reservados com David Rabello e cancele, se precisar.
          </p>
          <div className="mt-10">
            <MeusAgendamentosLista agendamentosIniciais={agendamentosIniciais} />
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
