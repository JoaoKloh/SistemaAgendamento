import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { BookingForm } from "@/components/booking/booking-form"

export default function AgendamentoPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 md:py-16">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Agendamento
          </p>
          <h1 className="mt-3 text-balance font-serif text-3xl font-semibold text-foreground sm:text-4xl">
            Reserve seu horário
          </h1>
          <p className="mt-3 max-w-xl leading-relaxed text-muted-foreground">
            Escolha o serviço, o dia e o horário disponível. Em poucos passos você garante seu
            atendimento com David Rabello.
          </p>
          <div className="mt-10">
            <BookingForm />
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
