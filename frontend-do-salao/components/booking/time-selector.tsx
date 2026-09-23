"use client"

import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { timeSlots } from "@/lib/data"

interface TimeSelectorProps {
  time: string | null
  busyTimeSlots: string[]
  isLoading: boolean
  onSelect: (slot: string) => void
}

export function TimeSelector({ time, busyTimeSlots, isLoading, onSelect }: TimeSelectorProps) {
  return (
    <section className="w-full min-w-0">
      <h2 className="flex items-center gap-2.5 text-sm font-medium text-foreground">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
          3
        </span>
        Selecione o horário
      </h2>

      {isLoading ? (
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
                onClick={() => onSelect(slot)}
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
  )
}
