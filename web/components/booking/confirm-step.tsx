"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Barber, Service } from "@/lib/types";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2 } from "lucide-react";

type ConfirmStepProps = {
  services: Service[];
  barber: Barber | null;
  slot: string | null;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  notes: string;
  submitting: boolean;
  onChange: (field: "clientName" | "clientPhone" | "clientEmail" | "notes", value: string) => void;
  onBack: () => void;
  onSubmit: () => void;
};

export function ConfirmStep({
  services,
  barber,
  slot,
  clientName,
  clientPhone,
  clientEmail,
  notes,
  submitting,
  onChange,
  onBack,
  onSubmit,
}: ConfirmStepProps) {
  const totalMinutes = services.reduce(
    (sum, service) => sum + service.duration_minutes,
    0,
  );
  const totalPrice = services.reduce(
    (sum, service) => sum + service.price_cents,
    0,
  );

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Confirme seu agendamento</h2>
        <p className="text-sm text-muted-foreground">
          Revise os dados antes de finalizar.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resumo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Serviços:</span>{" "}
            {services.map((service) => service.name).join(" + ")}
          </p>
          <p>
            <span className="text-muted-foreground">Barbeiro:</span>{" "}
            {barber?.name}
          </p>
          <p>
            <span className="text-muted-foreground">Horário:</span>{" "}
            {slot
              ? format(parseISO(slot), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
              : "—"}
          </p>
          <p>
            <span className="text-muted-foreground">Duração:</span> {totalMinutes}{" "}
            min
          </p>
          <p>
            <span className="text-muted-foreground">Total:</span> R${" "}
            {(totalPrice / 100).toFixed(2).replace(".", ",")}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="clientName">Nome *</Label>
            <Input
              id="clientName"
              value={clientName}
              onChange={(event) => onChange("clientName", event.target.value)}
              placeholder="Seu nome"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clientPhone">Telefone</Label>
            <Input
              id="clientPhone"
              value={clientPhone}
              onChange={(event) => onChange("clientPhone", event.target.value)}
              placeholder="+55 11 99999-9999"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clientEmail">E-mail</Label>
            <Input
              id="clientEmail"
              type="email"
              value={clientEmail}
              onChange={(event) => onChange("clientEmail", event.target.value)}
              placeholder="voce@email.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(event) => onChange("notes", event.target.value)}
              placeholder="Preferências, alergias..."
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1" disabled={submitting}>
          Voltar
        </Button>
        <Button
          disabled={!clientName.trim() || submitting}
          onClick={onSubmit}
          className="flex-1"
          style={{
            backgroundColor: "var(--tenant-secondary)",
            color: "#111",
          }}
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Agendando...
            </>
          ) : (
            "Confirmar agendamento"
          )}
        </Button>
      </div>
    </div>
  );
}
