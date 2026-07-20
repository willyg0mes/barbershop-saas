"use client";

import { Progress } from "@/components/ui/progress";
import type { BookingStep } from "@/lib/types";

const STEPS: BookingStep[] = [
  "services",
  "barber",
  "datetime",
  "confirm",
  "success",
];

const LABELS: Record<BookingStep, string> = {
  services: "Serviços",
  barber: "Barbeiro",
  datetime: "Horário",
  confirm: "Confirmar",
  success: "Pronto",
};

export function StepIndicator({ step }: { step: BookingStep }) {
  const index = STEPS.indexOf(step);
  const progress = ((index + 1) / STEPS.length) * 100;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground">
        <span>
          Passo {index + 1} de {STEPS.length}
        </span>
        <span>{LABELS[step]}</span>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );
}
