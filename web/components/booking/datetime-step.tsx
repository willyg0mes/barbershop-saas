"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { AvailabilityResponse } from "@/lib/types";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarDays, Loader2 } from "lucide-react";

type DateTimeStepProps = {
  date: string;
  slot: string | null;
  loading: boolean;
  availability: AvailabilityResponse | null;
  onDateChange: (date: string) => void;
  onSlotSelect: (slot: string) => void;
  onBack: () => void;
  onContinue: () => void;
};

export function DateTimeStep({
  date,
  slot,
  loading,
  availability,
  onDateChange,
  onSlotSelect,
  onBack,
  onContinue,
}: DateTimeStepProps) {
  const slots = availability?.barbers[0]?.slots ?? [];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Escolha data e horário</h2>
        <p className="text-sm text-muted-foreground">
          Horários contínuos disponíveis para a duração total dos serviços.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-3 py-4">
          <label className="flex items-center gap-2 text-sm font-medium">
            <CalendarDays className="h-4 w-4" />
            Data
          </label>
          <Input
            type="date"
            value={date}
            min={format(new Date(), "yyyy-MM-dd")}
            onChange={(event) => onDateChange(event.target.value)}
          />
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Buscando horários...
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {slots.map((item) => {
            const active = slot === item;
            const label = format(parseISO(item), "HH:mm", { locale: ptBR });

            return (
              <Button
                key={item}
                variant={active ? "default" : "outline"}
                onClick={() => onSlotSelect(item)}
                style={
                  active
                    ? {
                        backgroundColor: "var(--tenant-secondary)",
                        color: "#111",
                      }
                    : undefined
                }
              >
                {label}
              </Button>
            );
          })}
        </div>
      )}

      {!loading && slots.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">
          Nenhum horário disponível nesta data.
        </p>
      ) : null}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Voltar
        </Button>
        <Button
          disabled={!slot}
          onClick={onContinue}
          className="flex-1"
          style={{
            backgroundColor: "var(--tenant-secondary)",
            color: "#111",
          }}
        >
          Continuar
        </Button>
      </div>
    </div>
  );
}
