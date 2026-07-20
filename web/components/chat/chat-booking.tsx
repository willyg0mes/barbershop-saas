"use client";

import { ChatBubble, TypingIndicator } from "@/components/chat/chat-message";
import { ChatShell } from "@/components/chat/chat-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createAppointment,
  fetchAvailability,
} from "@/lib/api";
import {
  buildGoogleCalendarUrl,
  buildIcsFile,
  downloadIcs,
} from "@/lib/calendar";
import type {
  AvailabilityResponse,
  Barber,
  BookingStep,
  Service,
  TenantBranding,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CalendarPlus,
  Check,
  Clock3,
  Download,
  Loader2,
  RotateCcw,
  Send,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type ChatBookingProps = {
  tenant: TenantBranding;
  initialServices: Service[];
  initialBarbers: Barber[];
};

function formatTime(date = new Date()) {
  return format(date, "HH:mm", { locale: ptBR });
}

function formatSlotLabel(slot: string) {
  return format(parseISO(slot), "dd/MM 'às' HH:mm", { locale: ptBR });
}

export function ChatBooking({
  tenant,
  initialServices,
  initialBarbers,
}: ChatBookingProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<BookingStep>("services");
  const [serviceIds, setServiceIds] = useState<number[]>([]);
  const [barberId, setBarberId] = useState<number | null>(
    initialBarbers.length === 1 ? initialBarbers[0].id : null,
  );
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [slot, setSlot] = useState<string | null>(null);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [typing, setTyping] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appointment, setAppointment] = useState<import("@/lib/types").Appointment | null>(null);

  const [history, setHistory] = useState<
    Array<{ id: string; role: "bot" | "user"; text: string; time: string }>
  >([]);

  const services = initialServices;
  const barbers = initialBarbers;
  const skipBarberStep = barbers.length === 1;

  const selectedServices = useMemo(
    () => services.filter((service) => serviceIds.includes(service.id)),
    [services, serviceIds],
  );

  const selectedBarber = useMemo(
    () => barbers.find((barber) => barber.id === barberId) ?? null,
    [barbers, barberId],
  );

  const totalMinutes = selectedServices.reduce((sum, s) => sum + s.duration_minutes, 0);
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price_cents, 0);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    });
  }, []);

  const pushMessage = useCallback(
    (role: "bot" | "user", text: string) => {
      setHistory((current) => [
        ...current,
        { id: `${role}-${Date.now()}-${Math.random()}`, role, text, time: formatTime() },
      ]);
    },
    [],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setTyping(false);
      pushMessage(
        "bot",
        `Olá! 👋 Sou o assistente da ${tenant.name}. Vamos agendar seu horário rapidinho — escolha os serviços abaixo.`,
      );
    }, 900);

    return () => clearTimeout(timer);
  }, [pushMessage, tenant.name]);

  useEffect(() => {
    scrollToBottom();
  }, [history, step, typing, loadingAvailability, scrollToBottom]);

  const loadAvailability = useCallback(async () => {
    if (!barberId || serviceIds.length === 0 || !date) return;

    setLoadingAvailability(true);
    setError(null);

    try {
      const payload = await fetchAvailability(tenant.slug, {
        date,
        serviceIds,
        barberId,
      });
      setAvailability(payload);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Erro ao buscar horários");
      setAvailability(null);
    } finally {
      setLoadingAvailability(false);
    }
  }, [barberId, date, serviceIds, tenant.slug]);

  useEffect(() => {
    if (step === "datetime") {
      void loadAvailability();
    }
  }, [step, loadAvailability, date, barberId, serviceIds]);

  const toggleService = (id: number) => {
    setServiceIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  const confirmServices = () => {
    if (serviceIds.length === 0) return;

    const label = selectedServices.map((s) => s.name).join(" + ");
    pushMessage("user", `${label} · ${totalMinutes} min · R$ ${(totalPrice / 100).toFixed(2).replace(".", ",")}`);

    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      if (skipBarberStep) {
        pushMessage("bot", `Perfeito! O ${barbers[0].name} vai te atender. Agora escolha a data e o horário.`);
        setStep("datetime");
      } else {
        pushMessage("bot", "Ótima escolha! Com qual barbeiro você prefere ser atendido?");
        setStep("barber");
      }
    }, 700);
  };

  const confirmBarber = (id: number) => {
    const barber = barbers.find((b) => b.id === id);
    if (!barber) return;

    setBarberId(id);
    pushMessage("user", barber.name);

    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      pushMessage("bot", `Show! Horários disponíveis com ${barber.name}. Escolha quando quer vir.`);
      setStep("datetime");
    }, 700);
  };

  const confirmSlot = (value: string) => {
    setSlot(value);
    pushMessage("user", formatSlotLabel(value));

    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      pushMessage("bot", "Quase lá! Me passa seu nome e, se quiser, telefone ou e-mail para contato.");
      setStep("confirm");
    }, 700);
  };

  const submitBooking = async () => {
    if (!barberId || !slot || !clientName.trim()) return;

    pushMessage("user", `Confirmar agendamento · ${clientName.trim()}`);
    setSubmitting(true);
    setError(null);

    try {
      const result = await createAppointment(tenant.slug, {
        barber_id: barberId,
        service_ids: serviceIds,
        starts_at: slot,
        client_name: clientName.trim(),
        client_phone: clientPhone || undefined,
        client_email: clientEmail || undefined,
        notes: notes || undefined,
      });

      setAppointment(result);
      setStep("success");

      setTyping(true);
      setTimeout(() => {
        setTyping(false);
        pushMessage(
          "bot",
          `Pronto! ✅ Seu horário está confirmado para ${formatSlotLabel(slot)}. Adicione ao calendário abaixo.`,
        );
      }, 800);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Erro ao agendar");
    } finally {
      setSubmitting(false);
    }
  };

  const restart = () => {
    setStep("services");
    setServiceIds([]);
    setBarberId(skipBarberStep ? barbers[0].id : null);
    setDate(format(new Date(), "yyyy-MM-dd"));
    setSlot(null);
    setClientName("");
    setClientPhone("");
    setClientEmail("");
    setNotes("");
    setAppointment(null);
    setError(null);
    setHistory([]);
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      pushMessage("bot", "Vamos começar de novo! Escolha os serviços que deseja.");
    }, 600);
  };

  const slots = availability?.barbers[0]?.slots ?? [];

  const footer =
    step === "confirm" ? (
      <div className="space-y-2">
        <div className="flex gap-2">
          <Input
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Seu nome *"
            className="rounded-full border-white/10 bg-card/80"
          />
          <Button
            size="icon"
            disabled={!clientName.trim() || submitting}
            onClick={submitBooking}
            className="h-10 w-10 shrink-0 rounded-full"
            style={{ backgroundColor: "var(--tenant-secondary)", color: "#111" }}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <div className="flex gap-2">
          <Input
            value={clientPhone}
            onChange={(e) => setClientPhone(e.target.value)}
            placeholder="Telefone (opcional)"
            className="rounded-full border-white/10 bg-card/80 text-sm"
          />
          <Input
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
            placeholder="E-mail (opcional)"
            className="rounded-full border-white/10 bg-card/80 text-sm"
          />
        </div>
      </div>
    ) : null;

  return (
    <ChatShell tenant={tenant} scrollRef={scrollRef} footer={footer}>
      {history.map((message) => (
        <ChatBubble key={message.id} role={message.role} time={message.time}>
          {message.text}
        </ChatBubble>
      ))}

      {typing ? <TypingIndicator /> : null}

      {error ? (
        <ChatBubble role="bot" time={formatTime()}>
          <span className="text-destructive">{error}</span>
        </ChatBubble>
      ) : null}

      {!typing && step === "services" ? (
        <ChatBubble role="bot">
          <div className="space-y-3">
            <p className="font-medium">Nossos serviços</p>
            <div className="flex flex-col gap-2">
              {services.map((service) => {
                const active = serviceIds.includes(service.id);
                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => toggleService(service.id)}
                    className={cn(
                      "flex items-center justify-between rounded-xl border px-3 py-2.5 text-left transition",
                      active
                        ? "border-[var(--tenant-secondary)] bg-[var(--tenant-secondary)]/10"
                        : "border-white/10 bg-background/40 hover:bg-background/60",
                    )}
                  >
                    <div>
                      <p className="font-medium">{service.name}</p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock3 className="h-3 w-3" />
                        {service.duration_minutes} min · R$ {service.price_formatted}
                      </p>
                    </div>
                    {active ? (
                      <Check className="h-4 w-4" style={{ color: "var(--tenant-secondary)" }} />
                    ) : null}
                  </button>
                );
              })}
            </div>
            {serviceIds.length > 0 ? (
              <Button
                className="w-full rounded-full"
                onClick={confirmServices}
                style={{ backgroundColor: "var(--tenant-secondary)", color: "#111" }}
              >
                Continuar · {totalMinutes} min
              </Button>
            ) : null}
          </div>
        </ChatBubble>
      ) : null}

      {!typing && step === "barber" ? (
        <ChatBubble role="bot">
          <div className="flex flex-col gap-2">
            {barbers.map((barber) => (
              <button
                key={barber.id}
                type="button"
                onClick={() => confirmBarber(barber.id)}
                className="rounded-xl border border-white/10 bg-background/40 px-3 py-2.5 text-left transition hover:bg-background/60"
              >
                <p className="font-medium">{barber.name}</p>
                <p className="text-xs capitalize text-muted-foreground">{barber.role}</p>
              </button>
            ))}
          </div>
        </ChatBubble>
      ) : null}

      {!typing && step === "datetime" ? (
        <ChatBubble role="bot">
          <div className="space-y-3">
            <Input
              type="date"
              value={date}
              min={format(new Date(), "yyyy-MM-dd")}
              onChange={(e) => {
                setDate(e.target.value);
                setSlot(null);
              }}
              className="rounded-xl border-white/10 bg-background/40"
            />
            {loadingAvailability ? (
              <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Buscando horários...
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1.5">
                {slots.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => confirmSlot(item)}
                    className="rounded-lg border border-white/10 bg-background/40 px-2 py-2 text-sm transition hover:border-[var(--tenant-secondary)] hover:bg-[var(--tenant-secondary)]/10"
                  >
                    {format(parseISO(item), "HH:mm", { locale: ptBR })}
                  </button>
                ))}
              </div>
            )}
            {!loadingAvailability && slots.length === 0 ? (
              <p className="text-xs text-muted-foreground">Sem horários nesta data. Tente outro dia.</p>
            ) : null}
          </div>
        </ChatBubble>
      ) : null}

      {!typing && step === "success" && appointment ? (
        <ChatBubble role="bot">
          <div className="space-y-3">
            <div className="rounded-xl border border-white/10 bg-background/30 p-3 text-xs">
              <p className="font-medium">{selectedServices.map((s) => s.name).join(" + ")}</p>
              <p className="text-muted-foreground">
                {selectedBarber?.name} · {appointment.total_duration_minutes} min
              </p>
            </div>
            <div className="grid gap-2">
              <button
                type="button"
                onClick={() =>
                  downloadIcs(
                    `agendamento-${tenant.slug}.ics`,
                    buildIcsFile({ appointment, services: selectedServices, tenant }),
                  )
                }
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-background/40 px-3 py-2.5 text-sm transition hover:bg-background/60"
              >
                <Download className="h-4 w-4" />
                Baixar .ics
              </button>
              <a
                href={buildGoogleCalendarUrl({ appointment, services: selectedServices, tenant })}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-background/40 px-3 py-2.5 text-sm transition hover:bg-background/60"
              >
                <CalendarPlus className="h-4 w-4" />
                Google Calendar
              </a>
              <button
                type="button"
                onClick={restart}
                className="flex items-center justify-center gap-2 rounded-full px-3 py-2.5 text-sm font-medium"
                style={{ backgroundColor: "var(--tenant-secondary)", color: "#111" }}
              >
                <RotateCcw className="h-4 w-4" />
                Novo agendamento
              </button>
            </div>
          </div>
        </ChatBubble>
      ) : null}
    </ChatShell>
  );
}
