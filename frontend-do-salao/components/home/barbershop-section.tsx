import Image from "next/image"
import { Star, Clock, MapPin, Phone, CreditCard, Users } from "lucide-react"
import { salon } from "@/lib/data"

const facts = [
  { icon: Star, label: "Reputação", value: `${salon.rating} · ${salon.reviews} avaliações` },
  { icon: Users, label: "Perfil", value: "Espaço unissex" },
  { icon: CreditCard, label: "Pagamento", value: "Crédito, débito e NFC" },
  { icon: MapPin, label: "Tradição", value: `Desde ${salon.since}` },
]

export function BarbershopSection() {
  const cleanNumber = (num: string) => {
    const digits = num.replace(/\D/g, "")
    return digits.startsWith("55") ? digits : `55${digits}`
  }

  return (
    <section id="barbearia" className="border-t border-border bg-card">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
        <div className="grid gap-12 md:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              A Barbearia
            </p>
            <h2 className="mt-3 text-balance font-serif text-3xl font-semibold text-foreground sm:text-4xl">
              {salon.name}
            </h2>
            <p className="mt-5 leading-relaxed text-muted-foreground">
              Um dos salões de beleza e barbearias mais tradicionais do centro de Petrópolis. Em
              funcionamento desde {salon.since}, o {salon.name} acumula décadas de tradição e uma
              excelente reputação local.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {facts.map((fact) => {
                const Icon = fact.icon
                return (
                  <div
                    key={fact.label}
                    className="flex items-start gap-3 rounded-2xl border border-border bg-background p-4"
                  >
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        {fact.label}
                      </p>
                      <p className="text-sm font-medium text-foreground">{fact.value}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="relative mt-6 aspect-[16/9] overflow-hidden rounded-2xl border border-border">
              <Image
                src="/images/haircut-service.png"
                alt="Serviço de corte masculino em detalhe"
                fill
                className="object-cover"
              />
            </div>
          </div>

          <div id="contato" className="flex flex-col gap-6">
            <div className="rounded-2xl border border-border bg-background p-6">
              <h3 className="flex items-center gap-2 font-serif text-xl font-semibold text-foreground">
                <Clock className="h-5 w-5 text-accent-foreground" />
                Horário de funcionamento
              </h3>
              <ul className="mt-4 divide-y divide-border">
                {salon.hours.map((h) => (
                  <li key={h.day} className="flex items-center justify-between py-2.5 text-sm">
                    <span className="text-muted-foreground">{h.day}</span>
                    <span className="font-medium text-foreground">{h.time}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-border bg-background p-6">
              <h3 className="font-serif text-xl font-semibold text-foreground">Localização e contato</h3>
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent-foreground" />
                  {salon.address}
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="h-4 w-4 shrink-0 text-accent-foreground" />
                  <a
                    href={`tel:+${cleanNumber(salon.phone)}`}
                    className="transition-colors hover:text-foreground hover:underline"
                  >
                    {salon.phone}
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="h-4 w-4 shrink-0 text-accent-foreground" />
                  <a
                    href={`https://wa.me/${cleanNumber(salon.whatsapp)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-foreground hover:underline"
                  >
                    WhatsApp {salon.whatsapp}
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}