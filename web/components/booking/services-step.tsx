"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import type { Service } from "@/lib/types";
import { Clock3 } from "lucide-react";

type ServicesStepProps = {
  services: Service[];
  selectedIds: number[];
  onToggle: (serviceId: number) => void;
  onContinue: () => void;
};

export function ServicesStep({
  services,
  selectedIds,
  onToggle,
  onContinue,
}: ServicesStepProps) {
  const totalMinutes = services
    .filter((service) => selectedIds.includes(service.id))
    .reduce((sum, service) => sum + service.duration_minutes, 0);

  const totalPrice = services
    .filter((service) => selectedIds.includes(service.id))
    .reduce((sum, service) => sum + service.price_cents, 0);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Escolha os serviços</h2>
        <p className="text-sm text-muted-foreground">
          Selecione um ou mais serviços. Calculamos a duração total
          automaticamente.
        </p>
      </div>

      <div className="space-y-3">
        {services.map((service) => {
          const checked = selectedIds.includes(service.id);

          return (
            <Card
              key={service.id}
              className={checked ? "border-[var(--tenant-secondary)]" : ""}
              style={checked ? { boxShadow: "0 0 0 1px var(--tenant-secondary)" } : undefined}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => onToggle(service.id)}
                    id={`service-${service.id}`}
                  />
                  <div className="flex-1 space-y-1">
                    <label
                      htmlFor={`service-${service.id}`}
                      className="cursor-pointer text-base font-medium"
                    >
                      {service.name}
                    </label>
                    {service.description ? (
                      <CardDescription>{service.description}</CardDescription>
                    ) : null}
                  </div>
                  <Badge variant="secondary">R$ {service.price_formatted}</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock3 className="h-4 w-4" />
                  {service.duration_minutes} min
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedIds.length > 0 ? (
        <Card>
          <CardContent className="flex items-center justify-between py-4 text-sm">
            <span>
              Total: {totalMinutes} min · R${" "}
              {(totalPrice / 100).toFixed(2).replace(".", ",")}
            </span>
            <Button
              onClick={onContinue}
              style={{
                backgroundColor: "var(--tenant-secondary)",
                color: "#111",
              }}
            >
              Continuar
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
