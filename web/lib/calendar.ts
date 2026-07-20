import type { Appointment, Service, TenantBranding } from "./types";

function formatIcsDate(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

function escapeIcsText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,");
}

export function buildIcsFile(options: {
  appointment: Appointment;
  services: Service[];
  tenant: TenantBranding;
}): string {
  const { appointment, services, tenant } = options;
  const startsAt = new Date(appointment.starts_at);
  const endsAt = new Date(appointment.ends_at);
  const summary = `${tenant.name} — ${services.map((service) => service.name).join(" + ")}`;
  const description = [
    `Barbearia: ${tenant.name}`,
    `Serviços: ${services.map((service) => service.name).join(", ")}`,
    appointment.client_name ? `Cliente: ${appointment.client_name}` : null,
  ]
    .filter(Boolean)
    .join("\\n");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//BarberShop SaaS//PT",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:appointment-${appointment.id}@barbershop-saas`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${formatIcsDate(startsAt)}`,
    `DTEND:${formatIcsDate(endsAt)}`,
    `SUMMARY:${escapeIcsText(summary)}`,
    `DESCRIPTION:${description}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function buildGoogleCalendarUrl(options: {
  appointment: Appointment;
  services: Service[];
  tenant: TenantBranding;
}): string {
  const { appointment, services, tenant } = options;
  const startsAt = new Date(appointment.starts_at);
  const endsAt = new Date(appointment.ends_at);
  const format = (date: Date) => formatIcsDate(date).replace(/Z$/, "Z");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${tenant.name} — ${services.map((service) => service.name).join(" + ")}`,
    dates: `${format(startsAt)}/${format(endsAt)}`,
    details: `Agendamento na ${tenant.name}`,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function downloadIcs(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
