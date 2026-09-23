"use client"

import type React from "react"
import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { formatPrice, getNextDays, months, weekdays, type DiaAgenda } from "@/lib/date-utils"
import { useServicos } from "@/lib/hooks/use-servicos"
import { useProdutos } from "@/lib/hooks/use-produtos"
import { useHorariosOcupados } from "@/lib/hooks/use-horarios-ocupados"

import { ServicoSelector } from "@/components/booking/servico-selector"
import { DateSelector } from "@/components/booking/date-selector"
import { TimeSelector } from "@/components/booking/time-selector"
import { BookingSummary } from "@/components/booking/booking-summary"
import { ProdutoSelector } from "@/components/booking/produto-selector"
import { ProdutosResumo } from "@/components/booking/produtos-resumo"
import type { ServicoDTO } from "@/lib/types/booking"

type BookingStep = "form" | "produtos"

interface BookingFormProps {
  initialServicos?: ServicoDTO[]
}

export function BookingForm({ initialServicos }: BookingFormProps) {
  const router = useRouter()

  const [mounted, setMounted] = useState(false)
  const [days, setDays] = useState<DiaAgenda[]>([])

  const { servicos, isLoadingServicos } = useServicos(initialServicos)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [step, setStep] = useState<BookingStep>("form")
  const { produtos, isLoadingProdutos } = useProdutos(step === "produtos")
  const [selectedProdutosIds, setSelectedProdutosIds] = useState<number[]>([])

  const [selectedItensIds, setSelectedItensIds] = useState<number[]>([])
  const [selectedDayFormatted, setSelectedDayFormatted] = useState<string>("")
  const [time, setTime] = useState<string | null>(null)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")

  const { busyTimeSlots, isLoadingHorarios } = useHorariosOcupados(selectedDayFormatted || null)

  // Gera os dias estritamente no cliente após a montagem do DOM: getNextDays
  // depende do relógio local do navegador, então calculá-lo durante a
  // renderização (inclusive a passagem de pré-renderização no servidor)
  // causaria divergência de hidratação. Por isso o cálculo só acontece aqui.
  useEffect(() => {
    const generatedDays = getNextDays(14)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDays(generatedDays)
    if (generatedDays.length > 0) {
      setSelectedDayFormatted(generatedDays[0].formattedDate)
    }
    setMounted(true)
  }, [])

  // Seleciona automaticamente o primeiro serviço assim que a lista chega
  useEffect(() => {
    if (servicos.length > 0 && selectedItensIds.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedItensIds([servicos[0].id])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [servicos])

  const handleDaySelect = (formattedDate: string) => {
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

  const handleToggleProduto = (id: number) => {
    setSelectedProdutosIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const handleClienteChange = (campo: "name" | "email" | "phone", valor: string) => {
    if (campo === "name") setName(valor)
    if (campo === "email") setEmail(valor)
    if (campo === "phone") setPhone(valor)
  }

  const selectedServicos = useMemo(() => {
    return servicos.filter((s) => selectedItensIds.includes(s.id))
  }, [servicos, selectedItensIds])

  const selectedProdutos = useMemo(() => {
    return produtos.filter((p) => selectedProdutosIds.includes(p.id))
  }, [produtos, selectedProdutosIds])

  const valorTotal = useMemo(() => {
    return selectedServicos.reduce((acc, curr) => acc + curr.preco, 0)
  }, [selectedServicos])

  const valorTotalComProdutos = useMemo(() => {
    return valorTotal + selectedProdutos.reduce((acc, curr) => acc + curr.preco, 0)
  }, [valorTotal, selectedProdutos])

  const selectedDayObject = useMemo(() => {
    return days.find((d) => d.formattedDate === selectedDayFormatted)?.dateObj || new Date()
  }, [days, selectedDayFormatted])

  const dateLabel = useMemo(() => {
    return `${weekdays[selectedDayObject.getDay()]}, ${selectedDayObject.getDate()} de ${months[selectedDayObject.getMonth()]}`
  }, [selectedDayObject])

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

    // Primeira etapa: só avança para a tela de produtos. Os dados já
    // preenchidos (serviço, dia, horário e cliente) permanecem no estado
    // deste componente e serão reaproveitados no envio final.
    if (step === "form") {
      if (!canSubmit) return
      setStep("produtos")
      return
    }

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
      // Envia serviços e produtos (se houver) num único agendamento — o
      // backend valida cada id via /servicos, independente do tipo do item.
      itensIds: [...selectedItensIds, ...selectedProdutosIds],
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

      const params = new URLSearchParams({
        servico: [...selectedServicos, ...selectedProdutos].map((item) => item.nome).join(", "),
        data: dateLabel,
        hora: time,
        nome: name.trim(),
        preco: formatPrice(valorTotalComProdutos),
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
      {step === "form" ? (
        <>
          <div className="w-full min-w-0 space-y-6 sm:space-y-8">
            <ServicoSelector
              servicos={servicos}
              selectedItensIds={selectedItensIds}
              onToggle={handleToggleServico}
            />
            <DateSelector
              days={days}
              selectedDayFormatted={selectedDayFormatted}
              onSelect={handleDaySelect}
            />
            <TimeSelector
              time={time}
              busyTimeSlots={busyTimeSlots}
              isLoading={isLoadingHorarios}
              onSelect={setTime}
            />
          </div>

          <BookingSummary
            selectedServicos={selectedServicos}
            time={time}
            valorTotal={valorTotal}
            cliente={{ name, email, phone }}
            onClienteChange={handleClienteChange}
            canSubmit={canSubmit}
            isSubmitting={false}
          />
        </>
      ) : (
        <>
          <div className="w-full min-w-0 space-y-6 sm:space-y-8">
            <section className="w-full min-w-0">
              <h2 className="font-title text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                Deseja adicionar produtos?
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Selecione produtos para incluir no seu agendamento, ou apenas finalize com o
                serviço já escolhido.
              </p>
              <div className="mt-4">
                <ProdutoSelector
                  produtos={produtos}
                  isLoading={isLoadingProdutos}
                  selectedProdutosIds={selectedProdutosIds}
                  onToggle={handleToggleProduto}
                />
              </div>
            </section>
          </div>

          <ProdutosResumo
            selectedServicos={selectedServicos}
            selectedProdutos={selectedProdutos}
            dateLabel={dateLabel}
            time={time}
            valorTotal={valorTotalComProdutos}
            onVoltar={() => setStep("form")}
            isSubmitting={isSubmitting}
          />
        </>
      )}
    </form>
  )
}
