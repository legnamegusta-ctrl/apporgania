"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import type { DateRange } from "react-day-picker"

interface DateRangeFilterProps {
  dateRange: {
    from: Date
    to: Date
  }
  onDateRangeChange: (range: { from: Date; to: Date }) => void
}

export function DateRangeFilter({ dateRange, onDateRangeChange }: DateRangeFilterProps) {
  const [open, setOpen] = useState(false)

  const handleSelect = (range: DateRange | undefined) => {
    if (range?.from && range?.to) {
      onDateRangeChange({
        from: range.from,
        to: range.to,
      })
      setOpen(false)
    }
  }

  const presetRanges = [
    {
      label: "Últimos 7 dias",
      range: {
        from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        to: new Date(),
      },
    },
    {
      label: "Últimos 30 dias",
      range: {
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        to: new Date(),
      },
    },
    {
      label: "Este mês",
      range: {
        from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        to: new Date(),
      },
    },
    {
      label: "Mês passado",
      range: {
        from: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
        to: new Date(new Date().getFullYear(), new Date().getMonth(), 0),
      },
    },
  ]

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("w-full sm:w-80 justify-start text-left font-normal", !dateRange && "text-muted-foreground")}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {dateRange?.from ? (
            dateRange.to ? (
              <>
                {format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                {format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
              </>
            ) : (
              format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })
            )
          ) : (
            <span>Selecione o período</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex">
          {/* Preset ranges */}
          <div className="border-r p-3 space-y-1">
            <div className="text-sm font-medium mb-2">Períodos</div>
            {presetRanges.map((preset, index) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                className="w-full justify-start text-xs"
                onClick={() => {
                  onDateRangeChange(preset.range)
                  setOpen(false)
                }}
              >
                {preset.label}
              </Button>
            ))}
          </div>

          {/* Calendar */}
          <div className="p-3">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={{
                from: dateRange.from,
                to: dateRange.to,
              }}
              onSelect={handleSelect}
              numberOfMonths={2}
              locale={ptBR}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
