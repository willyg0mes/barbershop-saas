import { describe, expect, it } from "vitest";
import { buildGoogleCalendarUrl, buildIcsFile } from "@/lib/calendar";
import type { Appointment, Service, TenantBranding } from "@/lib/types";

const tenant: TenantBranding = {
  name: "Barbearia Dom Corte",
  slug: "dom-corte",
  subdomain: "domcorte",
  custom_domain: null,
  logo_url: null,
  primary_color: "#121212",
  secondary_color: "#D4AF37",
  accent_color: "#E8E8E8",
  timezone: "America/Sao_Paulo",
  settings: { slot_interval_minutes: 15, booking_lead_minutes: 30 },
};

const services: Service[] = [
  {
    id: 1,
    name: "Corte",
    description: null,
    duration_minutes: 30,
    price_cents: 4500,
    price_formatted: "45,00",
    sort_order: 1,
  },
  {
    id: 2,
    name: "Barba",
    description: null,
    duration_minutes: 30,
    price_cents: 3500,
    price_formatted: "35,00",
    sort_order: 2,
  },
];

const appointment: Appointment = {
  id: 99,
  status: "pending",
  starts_at: "2026-07-21T14:00:00.000Z",
  ends_at: "2026-07-21T15:00:00.000Z",
  total_duration_minutes: 60,
  total_price_cents: 8000,
  client_name: "Maria",
  client_phone: null,
  client_email: null,
  notes: null,
};

describe("calendar helpers", () => {
  it("builds a valid ICS file", () => {
    const ics = buildIcsFile({ appointment, services, tenant });

    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("SUMMARY:Barbearia Dom Corte — Corte + Barba");
    expect(ics).toContain("END:VEVENT");
  });

  it("builds google calendar url", () => {
    const url = buildGoogleCalendarUrl({ appointment, services, tenant });

    expect(url).toContain("calendar.google.com");
    expect(url).toContain("action=TEMPLATE");
    expect(url).toContain("Corte");
    expect(url).toContain("Barba");
  });
});
