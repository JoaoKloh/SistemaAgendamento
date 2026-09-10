"use client"

import type React from "react"
import { useState, useMemo, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Check, Clock, ChevronRight, User, Loader2, Scissors, Mail, Phone } from "lucide-react"
import { toast } from "sonner"
import { timeSlots } from "@/lib/data"
import { cn } from "@/lib/utils"

export interface ServicoDTO {
  id: number
  nome: string
  detalhes?: string
  duracao: string
  preco: number
}

// Formata uma data estritamente no fuso local do Brasil (YYYY-MM-DD)
function formatLocalDate(d: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d)

  const year = parts.find((p) => p.type === "year")?.value
  const month = parts.find((p) => p.type === "month")?.value
  const day = parts.find((p) => p.type === "day")?.value

  return `${year}-${month}-${day}`
}

function getNextDays(count: number) {
  const days: { dateObj: Date; formattedDate: string }[] = []
  
  // Instancia o momento atual e força a base da data no fuso local do Brasil
  const now = new Date()

  let adicionados = 0
  let incremento = 0

  while (adicionados < count) {
    const d = new Date(now)
    d.setDate(now.getDate() + incremento)
    incremento++

    // Pula domingos (0 = Domingo)
    if (d.getDay() !== 0) {
      days.push({
        dateObj: d,
        formattedDate: formatLocalDate(d),
      })
      adicionados++
    }
  }

  return days
}

const weekdays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
const months = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]

export function BookingForm() {
  const router = useRouter()

  const [mounted, setMounted] = useState(false)
  const [days, setDays] = useState<{ dateObj: Date; formattedDate: string }[]>([])

  const [servicos, setServicos] = useState<ServicoDTO[]>([])
  const [isLoadingServicos, setIsLoadingServicos] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [selectedItensIds, setSelectedItensIds] = useState<number[]>([])
  
  const [selectedDayFormatted, setSelectedDayFormatted] = useState<string>("")
  const [time, setTime] = useState<string | null>(null)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")

  const [busyTimeSlots, setBusyTimeSlots] = useState<string[]>([])
  const [isLoadingHorarios, setIsLoadingHorarios] = useState(false)

  // 1. Gera os dias estritamente no cliente após a montagem do DOM
  useEffect(() => {
    const generatedDays = getNextDays(14)
    setDays(generatedDays)
    if (generatedDays.length > 0) {
      setSelectedDayFormatted(generatedDays[0].formattedDate)
    }
    setMounted(true)
  }, [])

  const hasFetchedServicos = useRef(false)

  // 2. Carrega os serviços
  useEffect(() => {
    if (hasFetchedServicos.current) return
    hasFetchedServicos.current = true

    const fetchServicos = async () => {
      try {
        const res = await fetch("/api/servicos", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        })

        if (res.ok) {
          const data: ServicoDTO[] = await res.json()
          setServicos(data)

          if (data.length > 0) {
            setSelectedItensIds([data[0].id])
          }
        }
      } catch (error) {
        console.error("Erro ao carregar serviços:", error)
        toast.error("Não foi possível carregar os serviços.")
      } finally {
        setIsLoadingServicos(false)
      }
    }

    fetchServicos()
  }, [])

  const lastFetchedDateRef = useRef<string | null>(null)
  const isFetchingRef = useRef(false)

  // 3. Consulta os horários ocupados
  useEffect(() => {
    if (!selectedDayFormatted || lastFetchedDateRef.current === selectedDayFormatted || isFetchingRef.current) return

    lastFetchedDateRef.current = selectedDayFormatted
    isFetchingRef.current = true

    const fetchHorariosOcupados = async () => {
      setIsLoadingHorarios(true)

      try {
        const res = await fetch(`/api/agendamento/ocupados?data=${selectedDayFormatted}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        })

        if (res.ok) {
          const horariosOcupados: string[] = await res.json()
          setBusyTimeSlots(horariosOcupados)
        }
      } catch (error) {
        console.error("Erro ao carregar horários ocupados:", error)
      } finally {
        setIsLoadingHorarios(false)
        isFetchingRef.current = false
      }
    }

    fetchHorariosOcupados()
  }, [selectedDayFormatted])

  const handleDaySelect = (formattedDate: string) => {
    if (formattedDate !== selectedDayFormatted) {
      lastFetchedDateRef.current = null
      isFetchingRef.current = false
    }

    setSelectedDayFormatted(formattedDate)
    setTime(null)
  }

  const handleToggleServico = (id: number) => {
    setSelectedItensIds((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev
        return prev.filter((item) => item !== id)
      }
      return [...prev, id]
    })
  }

  const selectedServicos = useMemo(() => {
    return servicos.filter((s) => selectedItensIds.includes(s.id))
  }, [servicos, selectedItensIds])

  const valorTotal = useMemo(() => {
    return selectedServicos.reduce((acc, curr) => acc + curr.preco, 0)
  }, [selectedServicos])

  const formatDuracao = (duracao: string) => {
    if (!duracao) return ""
    const partes = duracao.split(":")
    const horas = parseInt(partes[0], 10)
    const minutos = parseInt(partes[1], 10)
    const totalMinutos = horas * 60 + minutos
    return `${totalMinutos} min`
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(price)
  }

  const selectedDayObject = useMemo(() => {
    return days.find((d) => d.formattedDate === selectedDayFormatted)?.dateObj || new Date()
  }, [days, selectedDayFormatted])

  const canSubmit = Boolean(
    selectedItensIds.length > 0 &&
    selectedDayFormatted &&
    time &&
    name.trim() &&
    email.trim() &&
    phone.trim() &&
    !isSubmitting
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit || !time) return

    setIsSubmitting(true)

    const dataAgendamento = selectedDayFormatted
    const horaAgendamento = time.length === 5 ? `${time}:00` : time

    const payload = {
      dataAgendamento,
      horaAgendamento,
      nome: name.trim(),
      email: email.trim(),
      telefone: phone.trim(),
      itensIds: selectedItensIds,
    }

    try {
      const res = await fetch("/api/agendamento/criar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const rawText = await res.text()
      let data: any = {}
      try {
        data = JSON.parse(rawText)
      } catch (_) {}

      if (!res.ok) {
        throw new Error(data.message || data.error || "Erro ao realizar o agendamento.")
      }

      toast.success("Agendamento realizado com sucesso!")

      const dateLabel = `${weekdays[selectedDayObject.getDay()]}, ${selectedDayObject.getDate()} de ${months[selectedDayObject.getMonth()]}`

      const params = new URLSearchParams({
        servico: selectedServicos.map((s) => s.nome).join(", "),
        data: dateLabel,
        hora: time,
        nome: name.trim(),
        preco: formatPrice(valorTotal),
      })

      router.push(`/agendamento/concluido?${params.toString()}`)
    } catch (error: any) {
      console.error("Erro no envio do agendamento:", error)
      toast.error(error.message || "Erro ao conectar com o servidor.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!mounted || isLoadingServicos) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-full overflow-x-hidden grid gap-6 lg:grid-cols-[1fr_360px] lg:gap-8">
      <div className="w-full min-w-0 space-y-6 sm:space-y-8">
        {/* Step 1: Serviços */}
        <section className="w-full min-w-0">
          <h2 className="flex items-center gap-2.5 text-sm font-medium text-foreground">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              1
            </span>
            Escolha os serviços ou produtos
          </h2>
          <div className="mt-3 grid gap-2.5 sm:grid-cols-2 sm:gap-3">
            {servicos.map((s) => {
              const isSelected = selectedItensIds.includes(s.id)
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleToggleServico(s.id)}
                  className={cn(
                    "flex min-h-[72px] w-full items-center gap-3.5 rounded-2xl border p-3.5 text-left transition-all active:scale-[0.99]",
                    isSelected
                      ? "border-foreground bg-accent shadow-sm"
                      : "border-border bg-card hover:border-ring"
                  )}
                >
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background text-accent-foreground shadow-xs">
                    <Scissors className="h-5 w-5" />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block truncate text-sm font-medium text-foreground">{s.nome}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {formatDuracao(s.duracao)} · {formatPrice(s.preco)}
                    </span>
                  </span>
                  {isSelected && <Check className="h-5 w-5 shrink-0 text-foreground" />}
                </button>
              )
            })}
          </div>
        </section>

        {/* Step 2: Data */}
        <section className="w-full min-w-0">
          <h2 className="flex items-center gap-2.5 text-sm font-medium text-foreground">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              2
            </span>
            Escolha o dia
          </h2>
          <div className="mt-3 flex w-full gap-2 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-none">
            {days.map(({ dateObj, formattedDate }) => {
              const active = formattedDate === selectedDayFormatted
              return (
                <button
                  key={formattedDate}
                  type="button"
                  onClick={() => handleDaySelect(formattedDate)}
                  className={cn(
                    "flex h-20 min-w-[64px] shrink-0 snap-start flex-col items-center justify-center rounded-2xl border transition-all active:scale-95 sm:min-w-[72px]",
                    active
                      ? "border-foreground bg-primary text-primary-foreground shadow-sm"
                      : "border-border bg-card text-foreground hover:border-ring"
                  )}
                >
                  <span
                    className={cn(
                      "text-[10px] font-medium uppercase tracking-wider",
                      active ? "text-primary-foreground/80" : "text-muted-foreground"
                    )}
                  >
                    {weekdays[dateObj.getDay()]}
                  </span>
                  <span className="my-0.5 text-base font-bold leading-none sm:text-lg">{dateObj.getDate()}</span>
                  <span
                    className={cn(
                      "text-[10px]",
                      active ? "text-primary-foreground/80" : "text-muted-foreground"
                    )}
                  >
                    {months[dateObj.getMonth()]}
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        {/* Step 3: Horários */}
        <section className="w-full min-w-0">
          <h2 className="flex items-center gap-2.5 text-sm font-medium text-foreground">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              3
            </span>
            Escolha o horário
          </h2>

          {isLoadingHorarios ? (
            <div className="mt-3 flex h-11 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-3 gap-1.5 sm:grid-cols-4 sm:gap-2.5">
              {timeSlots.map((slot) => {
                const active = slot === time
                const isOcupado = busyTimeSlots.includes(slot)

                return (
                  <button
                    key={slot}
                    type="button"
                    disabled={isOcupado}
                    onClick={() => setTime(slot)}
                    className={cn(
                      "flex h-11 w-full items-center justify-center rounded-xl border text-xs font-medium transition-all sm:text-sm",
                      isOcupado
                        ? "cursor-not-allowed border-dashed border-border bg-muted/50 text-muted-foreground/40 line-through opacity-60"
                        : active
                        ? "border-foreground bg-primary text-primary-foreground shadow-sm active:scale-95"
                        : "border-border bg-card text-foreground hover:border-ring active:scale-95"
                    )}
                  >
                    {slot}
                  </button>
                )
              })}
            </div>
          )}
        </section>
      </div>

      {/* Resumo do Agendamento */}
      <aside className="w-full min-w-0 lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-xs sm:p-6">
          <h2 className="font-serif text-lg font-semibold text-foreground sm:text-xl">Resumo do agendamento</h2>

          <dl className="mt-4 space-y-2.5 text-sm">
            <div className="flex flex-col gap-1">
              <dt className="text-muted-foreground">Itens Selecionados</dt>
              <dd className="font-medium text-foreground">
                {selectedServicos.length > 0
                  ? selectedServicos.map((s) => s.nome).join(", ")
                  : "Nenhum item selecionado"}
              </dd>
            </div>
            <div className="flex items-center justify-between pt-1">
              <dt className="text-muted-foreground">Horário</dt>
              <dd className="flex items-center gap-1 font-medium text-foreground">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                {time ?? "--:--"}
              </dd>
            </div>
            <div className="flex items-center justify-between border-t border-border/80 pt-2.5">
              <dt className="text-muted-foreground">Valor total</dt>
              <dd className="text-base font-semibold text-foreground">{formatPrice(valorTotal)}</dd>
            </div>
          </dl>

          {/* Dados do Cliente */}
          <div className="mt-5 space-y-3.5 border-t border-border/80 pt-4">
            <div>
              <label htmlFor="nome" className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-foreground">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                Nome completo
              </label>
              <input
                id="nome"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                autoComplete="name"
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-base text-foreground outline-none transition-colors focus:border-ring sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-foreground">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                E-mail
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                autoComplete="email"
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-base text-foreground outline-none transition-colors focus:border-ring sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="telefone" className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-foreground">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                Telefone / Whatsapp
              </label>
              <input
                id="telefone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(24) 99999-9999"
                autoComplete="tel"
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-base text-foreground outline-none transition-colors focus:border-ring sm:text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-xs transition-all hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSubmitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <span>Confirmar agendamento</span>
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </aside>
    </form>
  )
}