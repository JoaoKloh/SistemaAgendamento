"use client"

import { cn } from "@/lib/utils"
import { weekdays, months, type DiaAgenda } from "@/lib/date-utils"

interface DateSelectorProps {
  days: DiaAgenda[]
  selectedDayFormatted: string
  onSelect: (formattedDate: string) => void
}

export function DateSelector({ days, selectedDayFormatted, onSelect }: DateSelectorProps) {
  return (
    <section className="w-full min-w-0">
      <h2 className="flex items-center gap-2.5 text-sm font-medium text-foreground">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
          2
        </span>
        Selecione o dia
      </h2>
      <div className="mt-3 flex w-full gap-2 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-none">
        {days.map(({ dateObj, formattedDate }) => {
          const active = formattedDate === selectedDayFormatted
          return (
            <button
              key={formattedDate}
              type="button"
              onClick={() => onSelect(formattedDate)}
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
  )
}
