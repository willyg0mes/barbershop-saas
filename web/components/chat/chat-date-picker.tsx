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

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <div className="chat-date-picker w-full rounded-2xl border border-white/10 bg-background/50 p-3.5">
      <div className="mb-3.5 flex items-center justify-between gap-2">
        <button
          type="button"
          aria-label="Mês anterior"
          className="chat-date-nav flex h-10 w-10 shrink-0 items-center justify-center rounded-full active:bg-white/10"
          onClick={() => setViewMonth((current) => subMonths(current, 1))}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <p className="min-w-0 truncate text-center text-[15px] font-semibold capitalize tracking-tight">
          {format(viewMonth, "MMMM yyyy", { locale: ptBR })}
        </p>

        <button
          type="button"
          aria-label="Próximo mês"
          className="chat-date-nav flex h-10 w-10 shrink-0 items-center justify-center rounded-full active:bg-white/10"
          onClick={() => setViewMonth((current) => addMonths(current, 1))}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="mb-1.5 grid grid-cols-7 gap-y-1">
        {weekDays.map((day) => (
          <span
            key={day}
            className="py-1.5 text-center text-[11px] font-semibold tracking-wide text-muted-foreground"
          >
            {day}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
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
                "chat-date-day aspect-square w-full min-h-11 rounded-2xl text-[15px] font-medium transition-all active:scale-95",
                outside && "text-muted-foreground/30",
                !outside && !disabled && !active && "text-foreground/90 active:bg-white/8",
                disabled && "cursor-not-allowed opacity-25",
                active && "chat-date-day-active font-bold",
              )}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>

      <p className="mt-3.5 text-center text-[13px] capitalize text-muted-foreground">
        {format(selected, "EEEE, dd 'de' MMMM", { locale: ptBR })}
      </p>
    </div>
  );
}
