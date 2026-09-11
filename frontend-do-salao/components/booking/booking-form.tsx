"use client"

import type React from "react"
import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { formatPrice, getNextDays, months, weekdays, type DiaAgenda } from "@/lib/date-utils"
import { useServicos } from "@/lib/hooks/use-servicos"
import { useHorariosOcupados } from "@/lib/hooks/use-horarios-ocupados"

import { ServicoSelector } from "@/components/booking/servico-selector"
import { DateSelector } from "@/components/booking/date-selector"
import { TimeSelector } from "@/components/booking/time-selector"
import { BookingSummary } from "@/components/booking/booking-summary"

export function BookingForm() {
  const router = useRouter()

  const [mounted, setMounted] = useState(false)
  const [days, setDays] = useState<DiaAgenda[]>([])

  const { servicos, isLoadingServicos } = useServicos()
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  const handleClienteChange = (campo: "name" | "email" | "phone", valor: string) => {
    if (campo === "name") setName(valor)
    if (campo === "email") setEmail(valor)
    if (campo === "phone") setPhone(valor)
  }

  const selectedServicos = useMemo(() => {
    return servicos.filter((s) => selectedItensIds.includes(s.id))
  }, [servicos, selectedItensIds])

  const valorTotal = useMemo(() => {
    return selectedServicos.reduce((acc, curr) => acc + curr.preco, 0)
  }, [selectedServicos])

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
        isSubmitting={isSubmitting}
      />
    </form>
  )
}
