"use client";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import type { Barber } from "@/lib/types";
import { UserRound } from "lucide-react";

type BarberStepProps = {
  barbers: Barber[];
  selectedId: number | null;
  onSelect: (barberId: number) => void;
  onBack: () => void;
  onContinue: () => void;
};

export function BarberStep({
  barbers,
  selectedId,
  onSelect,
  onBack,
  onContinue,
}: BarberStepProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Escolha o barbeiro</h2>
        <p className="text-sm text-muted-foreground">
          Selecione quem vai te atender.
        </p>
      </div>

      <div className="grid gap-3">
        {barbers.map((barber) => {
          const active = selectedId === barber.id;

          return (
            <Card
              key={barber.id}
              className={`cursor-pointer transition ${active ? "border-[var(--tenant-secondary)]" : ""}`}
              onClick={() => onSelect(barber.id)}
            >
              <CardHeader className="flex flex-row items-center gap-3 py-4">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full"
                  style={{ backgroundColor: "var(--tenant-secondary)", color: "#111" }}
                >
                  <UserRound className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base">{barber.name}</CardTitle>
                  <p className="text-sm text-muted-foreground capitalize">
                    {barber.role}
                  </p>
                </div>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Voltar
        </Button>
        <Button
          disabled={!selectedId}
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
