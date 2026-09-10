import Link from "next/link"
import { salon } from "@/lib/data"

export function SiteFooter() {
  const cleanNumber = (num: string) => {
    const digits = num.replace(/\D/g, "")
    return digits.startsWith("55") ? digits : `55${digits}`
  }

  return (
    <footer className="border-t border-border bg-secondary/60">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <p className="font-serif text-lg font-semibold text-foreground">David Rabello</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Barbearia e estética masculina no tradicional {salon.name}, no centro de Petrópolis.
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.15em] text-foreground">Contato</p>
          <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
            <li>
              <a
                href={`tel:+${cleanNumber(salon.phone)}`}
                className="transition-colors hover:text-foreground hover:underline"
              >
                {salon.phone}
              </a>
            </li>
            <li>
              <a
                href={`https://wa.me/${cleanNumber(salon.whatsapp)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-foreground hover:underline"
              >
                WhatsApp {salon.whatsapp}
              </a>
            </li>
            <li>{salon.address}</li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.15em] text-foreground">Agende</p>
          <p className="mt-3 text-sm text-muted-foreground">
            Reserve seu horário de forma rápida e online.
          </p>
          <Link
            href="/agendamento"
            className="mt-3 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Agendar horário
          </Link>
        </div>
      </div>
      <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} David Rabello · {salon.name}. Desde {salon.since}.
      </div>
    </footer>
  )
}