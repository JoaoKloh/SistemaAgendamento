import Image from "next/image"
import { CheckCircle2 } from "lucide-react"

const highlights = [
  "Especialista em taper fade e cortes freestyle",
  "Barboterapia e vibroterapia de alto padrão",
  "Avaliação máxima em agendamentos online",
  "Atendimento personalizado e refinado",
]

export function AboutSection() {
  return (
    <section id="sobre">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 md:grid-cols-2 md:py-24">
        <div className="relative order-2 md:order-1">
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-border shadow-sm">
            <Image
              src="/images/dvd_image_01.png"
              alt="David Rabello, barbeiro e profissional de estética masculina"
              fill
              className="object-cover"
            />
          </div>
        </div>

        <div className="order-1 md:order-2">
          <p className="font-sans text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Sobre o profissional
          </p>
          <h2 className="mt-3 text-balance font-title text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            David Rabello
          </h2>
          <p className="mt-5 leading-relaxed text-muted-foreground">
            Barbeiro e profissional de estética masculina bastante avaliado, com sede em Petrópolis,
            Rio de Janeiro. David atende no Salão Ideal e construiu uma reputação sólida, com nota
            máxima na plataforma de agendamentos online.
          </p>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Seu trabalho une técnica, precisão e um olhar apurado para cada cliente, transformando o
            cuidado masculino em uma experiência marcante.
          </p>
          <ul className="mt-6 space-y-3">
            {highlights.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-foreground">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent-foreground" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
