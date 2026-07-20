"use client";

import { cn } from "@/lib/utils";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

type ChatDatePickerProps = {
  value: string;
  onChange: (date: string) => void;
  min?: string;
};

export function ChatDatePicker({ value, onChange, min }: ChatDatePickerProps) {
  const selected = parseISO(value);
  const minDate = min ? parseISO(min) : startOfDay(new Date());
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(selected));

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(viewMonth), { weekStartsOn: 0 });

    return eachDayOfInterval({ start, end });
  }, [viewMonth]);

  const weekDays = ["D", "S", "T", "Q", "Q", "S", "S"];

  return (
    <div className="chat-date-picker rounded-2xl border border-white/10 bg-background/50 p-3">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          aria-label="Mês anterior"
          className="chat-date-nav flex h-9 w-9 items-center justify-center rounded-full active:bg-white/10"
          onClick={() => setViewMonth((current) => subMonths(current, 1))}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <p className="text-sm font-semibold capitalize">
          {format(viewMonth, "MMMM yyyy", { locale: ptBR })}
        </p>

        <button
          type="button"
          aria-label="Próximo mês"
          className="chat-date-nav flex h-9 w-9 items-center justify-center rounded-full active:bg-white/10"
          onClick={() => setViewMonth((current) => addMonths(current, 1))}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1">
        {weekDays.map((day, index) => (
          <span
            key={`${day}-${index}`}
            className="py-1 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
          >
            {day}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const disabled = isBefore(day, minDate);
          const outside = !isSameMonth(day, viewMonth);
          const active = isSameDay(day, selected);

          return (
            <button
              key={day.toISOString()}
              type="button"
              disabled={disabled}
              onClick={() => onChange(format(day, "yyyy-MM-dd"))}
              className={cn(
                "chat-date-day flex h-10 w-full items-center justify-center rounded-xl text-sm font-medium transition-all active:scale-95",
                outside && "text-muted-foreground/35",
                !outside && !disabled && !active && "text-foreground/90 hover:bg-white/5",
                disabled && "cursor-not-allowed opacity-30",
                active && "chat-date-day-active font-bold",
              )}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-center text-xs text-muted-foreground">
        {format(selected, "EEEE, dd 'de' MMMM", { locale: ptBR })}
      </p>
    </div>
  );
}
