"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  buildGoogleCalendarUrl,
  buildIcsFile,
  downloadIcs,
} from "@/lib/calendar";
import type { Appointment, Service, TenantBranding } from "@/lib/types";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarPlus, CheckCircle2, Download } from "lucide-react";

type SuccessStepProps = {
  tenant: TenantBranding;
  appointment: Appointment;
  services: Service[];
  onRestart: () => void;
};

export function SuccessStep({
  tenant,
  appointment,
  services,
  onRestart,
}: SuccessStepProps) {
  const handleDownloadIcs = () => {
    const content = buildIcsFile({ appointment, services, tenant });
    downloadIcs(`agendamento-${tenant.slug}.ics`, content);
  };

  const googleUrl = buildGoogleCalendarUrl({ appointment, services, tenant });

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <CheckCircle2
          className="h-12 w-12"
          style={{ color: "var(--tenant-secondary)" }}
        />
        <div>
          <h2 className="text-xl font-semibold">Agendamento confirmado!</h2>
          <p className="text-sm text-muted-foreground">
            {format(parseISO(appointment.starts_at), "EEEE, dd/MM 'às' HH:mm", {
              locale: ptBR,
            })}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{tenant.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>{services.map((service) => service.name).join(" + ")}</p>
          <p className="text-muted-foreground">
            Duração: {appointment.total_duration_minutes} min
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-3">
        <Button
          onClick={handleDownloadIcs}
          variant="outline"
          className="justify-start gap-2"
        >
          <Download className="h-4 w-4" />
          Baixar .ics (Apple / Outlook)
        </Button>
        <a
          href={googleUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-9 w-full items-center justify-start gap-2 rounded-lg border px-4 text-sm"
        >
          <CalendarPlus className="h-4 w-4" />
          Adicionar ao Google Calendar
        </a>
        <Button
          onClick={onRestart}
          style={{
            backgroundColor: "var(--tenant-secondary)",
            color: "#111",
          }}
        >
          Novo agendamento
        </Button>
      </div>
    </div>
  );
}
