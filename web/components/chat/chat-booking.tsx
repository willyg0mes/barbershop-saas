"use client";

import { ChatAvatar } from "@/components/chat/chat-avatar";
import { ChatBubble, TypingIndicator } from "@/components/chat/chat-message";
import { ChatShell } from "@/components/chat/chat-shell";
import { MobileInputBar, QuickRepliesBar } from "@/components/chat/quick-replies";
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
import { addDays, format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CalendarPlus,
  Check,
  Download,
  Loader2,
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

function vibrate(ms = 8) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(ms);
  }
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
  const displayUserName = clientName.trim() || undefined;

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    });
  }, []);

  const pushMessage = useCallback((role: "bot" | "user", text: string) => {
    setHistory((current) => [
      ...current,
      { id: `${role}-${Date.now()}-${Math.random()}`, role, text, time: formatTime() },
    ]);
  }, []);

  const botReply = useCallback(
    (text: string, nextStep?: BookingStep) => {
      setTyping(true);
      setTimeout(() => {
        setTyping(false);
        pushMessage("bot", text);
        if (nextStep) setStep(nextStep);
        vibrate(6);
      }, 650);
    },
    [pushMessage],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setTyping(false);
      pushMessage(
        "bot",
        `Fala! 👋 Sou o assistente da ${tenant.name}. Toque nos serviços abaixo ou use os chips para agendar rápido.`,
      );
      vibrate(10);
    }, 800);
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
    if (step === "datetime") void loadAvailability();
  }, [step, loadAvailability, date, barberId, serviceIds]);

  const toggleService = useCallback((id: number) => {
    vibrate(5);
    setServiceIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }, []);

  const confirmServices = useCallback(() => {
    if (serviceIds.length === 0) return;
    vibrate(12);

    const label = selectedServices.map((s) => s.name).join(" + ");
    pushMessage(
      "user",
      `${label} · ${totalMinutes} min · R$ ${(totalPrice / 100).toFixed(2).replace(".", ",")}`,
    );

    if (skipBarberStep) {
      botReply(
        `Fechou! ${barbers[0].name} te espera. Escolha o horário nos chips ou no calendário.`,
        "datetime",
      );
    } else {
      botReply("Boa! Agora escolhe o barbeiro — toque no nome ou no chip.", "barber");
    }
  }, [
    serviceIds.length,
    selectedServices,
    totalMinutes,
    totalPrice,
    pushMessage,
    skipBarberStep,
    botReply,
    barbers,
  ]);

  const confirmBarber = useCallback((id: number) => {
    const barber = barbers.find((b) => b.id === id);
    if (!barber) return;
    vibrate(10);

    setBarberId(id);
    pushMessage("user", barber.name);
    botReply(`Show! Horários do ${barber.name.split(" ")[0]} — escolhe o melhor pra você.`, "datetime");
  }, [barbers, pushMessage, botReply]);

  const confirmSlot = useCallback((value: string) => {
    vibrate(10);
    setSlot(value);
    pushMessage("user", formatSlotLabel(value));
    botReply("Quase lá! Digita seu nome na barra de baixo e manda ✈️", "confirm");
  }, [pushMessage, botReply]);

  const setQuickDate = useCallback((offset: number) => {
    vibrate(5);
    const next = format(addDays(new Date(), offset), "yyyy-MM-dd");
    setDate(next);
    setSlot(null);
  }, []);

  const submitBooking = async () => {
    if (!barberId || !slot || !clientName.trim()) return;
    vibrate(15);

    pushMessage("user", `Confirmar · ${clientName.trim()}`);
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
      });

      setAppointment(result);
      setStep("success");
      botReply(
        `Confirmado! ✅ ${formatSlotLabel(slot)}. Salva no calendário ou agenda de novo quando quiser.`,
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Erro ao agendar");
    } finally {
      setSubmitting(false);
    }
  };

  const restart = useCallback(() => {
    vibrate(8);
    setStep("services");
    setServiceIds([]);
    setBarberId(skipBarberStep ? barbers[0].id : null);
    setDate(format(new Date(), "yyyy-MM-dd"));
    setSlot(null);
    setClientName("");
    setClientPhone("");
    setClientEmail("");
    setAppointment(null);
    setError(null);
    setHistory([]);
    botReply("Bora de novo! Escolhe os serviços 👇");
  }, [skipBarberStep, barbers, botReply]);

  const slots = useMemo(
    () => availability?.barbers[0]?.slots ?? [],
    [availability],
  );

  const quickReplies = useMemo(() => {
    if (typing || step === "confirm") return [];

    if (step === "services") {
      const chips = services.map((service) => ({
        id: `svc-${service.id}`,
        label: serviceIds.includes(service.id) ? `✓ ${service.name}` : service.name,
        active: serviceIds.includes(service.id),
        onClick: () => toggleService(service.id),
      }));
      if (serviceIds.length > 0) {
        chips.push({
          id: "continue",
          label: `Continuar (${totalMinutes} min)`,
          active: true,
          onClick: confirmServices,
        });
      }
      return chips;
    }

    if (step === "barber") {
      return barbers.map((barber) => ({
        id: `barber-${barber.id}`,
        label: barber.name.split(" ")[0],
        active: barberId === barber.id,
        onClick: () => confirmBarber(barber.id),
      }));
    }

    if (step === "datetime") {
      const dateChips = [
        { id: "today", label: "Hoje", active: date === format(new Date(), "yyyy-MM-dd"), onClick: () => setQuickDate(0) },
        { id: "tomorrow", label: "Amanhã", active: date === format(addDays(new Date(), 1), "yyyy-MM-dd"), onClick: () => setQuickDate(1) },
      ];
      const slotChips = slots.slice(0, 8).map((item) => ({
        id: `slot-${item}`,
        label: format(parseISO(item), "HH:mm", { locale: ptBR }),
        active: slot === item,
        disabled: loadingAvailability,
        onClick: () => confirmSlot(item),
      }));
      return [...dateChips, ...slotChips];
    }

    if (step === "success" && appointment) {
      return [
        {
          id: "ics",
          label: "📅 .ics",
          onClick: () =>
            downloadIcs(
              `agendamento-${tenant.slug}.ics`,
              buildIcsFile({ appointment, services: selectedServices, tenant }),
            ),
        },
        {
          id: "gcal",
          label: "Google Cal",
          onClick: () => window.open(
            buildGoogleCalendarUrl({ appointment, services: selectedServices, tenant }),
            "_blank",
          ),
        },
        { id: "restart", label: "Novo horário", onClick: restart },
      ];
    }

    return [];
  }, [
    typing,
    step,
    services,
    serviceIds,
    totalMinutes,
    barbers,
    barberId,
    date,
    slots,
    slot,
    loadingAvailability,
    appointment,
    selectedServices,
    tenant,
    confirmServices,
    confirmBarber,
    confirmSlot,
    restart,
    toggleService,
    setQuickDate,
  ]);

  const footer =
    step === "confirm" ? (
      <MobileInputBar>
        <div className="flex items-end gap-2">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Seu nome *"
              className="mobile-touch-input rounded-full"
              enterKeyHint="send"
              onKeyDown={(e) => e.key === "Enter" && submitBooking()}
            />
            <div className="flex gap-2">
              <Input
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="WhatsApp"
                type="tel"
                inputMode="tel"
                className="mobile-touch-input rounded-full text-sm"
              />
            </div>
          </div>
          <button
            type="button"
            disabled={!clientName.trim() || submitting}
            onClick={submitBooking}
            className={cn(
              "mobile-send-btn flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-transform active:scale-90",
              !clientName.trim() && "opacity-40",
            )}
            style={{ backgroundColor: "var(--tenant-secondary)", color: "#111" }}
            aria-label="Enviar"
          >
            {submitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
      </MobileInputBar>
    ) : null;

  return (
    <ChatShell
      tenant={tenant}
      scrollRef={scrollRef}
      footer={footer}
      quickReplies={
        quickReplies.length > 0 ? (
          <QuickRepliesBar
            hint={
              step === "services"
                ? "Toque rápido"
                : step === "datetime"
                  ? "Horários"
                  : undefined
            }
            replies={quickReplies}
          />
        ) : null
      }
    >
      {history.map((message, index) => (
        <ChatBubble
          key={message.id}
          role={message.role}
          time={message.time}
          tenantName={tenant.name}
          tenantLogo={tenant.logo_url}
          userName={message.role === "user" ? displayUserName : undefined}
          delayMs={index * 30}
        >
          {message.text}
        </ChatBubble>
      ))}

      {typing ? (
        <TypingIndicator tenantName={tenant.name} tenantLogo={tenant.logo_url} />
      ) : null}

      {error ? (
        <ChatBubble role="bot" time={formatTime()} tenantName={tenant.name} tenantLogo={tenant.logo_url}>
          <span className="text-destructive">{error}</span>
        </ChatBubble>
      ) : null}

      {!typing && step === "services" ? (
        <ChatBubble role="bot" tenantName={tenant.name} tenantLogo={tenant.logo_url}>
          <div className="space-y-3">
            <p className="font-semibold">Serviços disponíveis</p>
            <div className="flex flex-col gap-2">
              {services.map((service) => {
                const active = serviceIds.includes(service.id);
                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => toggleService(service.id)}
                    className={cn(
                      "mobile-touch-card flex items-center gap-3 rounded-2xl border px-3 py-3 text-left active:scale-[0.98]",
                      active
                        ? "border-[var(--tenant-secondary)] bg-[var(--tenant-secondary)]/12"
                        : "border-white/10 bg-background/50",
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                        active
                          ? "border-[var(--tenant-secondary)] bg-[var(--tenant-secondary)]"
                          : "border-white/20",
                      )}
                    >
                      {active ? <Check className="h-3.5 w-3.5 text-[#111]" /> : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{service.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {service.duration_minutes} min · R$ {service.price_formatted}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </ChatBubble>
      ) : null}

      {!typing && step === "barber" ? (
        <ChatBubble role="bot" tenantName={tenant.name} tenantLogo={tenant.logo_url}>
          <div className="flex flex-col gap-2">
            {barbers.map((barber) => (
              <button
                key={barber.id}
                type="button"
                onClick={() => confirmBarber(barber.id)}
                className="mobile-touch-card flex items-center gap-3 rounded-2xl border border-white/10 bg-background/50 px-3 py-3 active:scale-[0.98]"
              >
                <ChatAvatar variant="barber" name={barber.name} />
                <div className="text-left">
                  <p className="font-medium">{barber.name}</p>
                  <p className="text-xs capitalize text-muted-foreground">{barber.role}</p>
                </div>
              </button>
            ))}
          </div>
        </ChatBubble>
      ) : null}

      {!typing && step === "datetime" ? (
        <ChatBubble role="bot" tenantName={tenant.name} tenantLogo={tenant.logo_url}>
          <div className="space-y-3">
            <Input
              type="date"
              value={date}
              min={format(new Date(), "yyyy-MM-dd")}
              onChange={(e) => {
                setDate(e.target.value);
                setSlot(null);
              }}
              className="mobile-touch-input rounded-xl"
            />
            {loadingAvailability ? (
              <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Buscando horários...
              </div>
            ) : slots.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground">
                Sem horários nesta data. Tente Hoje/Amanhã nos chips.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                {slots.length} horários · deslize os chips abaixo
              </p>
            )}
          </div>
        </ChatBubble>
      ) : null}

      {!typing && step === "success" && appointment ? (
        <ChatBubble role="bot" tenantName={tenant.name} tenantLogo={tenant.logo_url}>
          <div className="space-y-3">
            <div className="rounded-2xl border border-white/10 bg-background/40 p-3">
              <p className="font-semibold">{selectedServices.map((s) => s.name).join(" + ")}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {selectedBarber?.name} · {appointment.total_duration_minutes} min
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  downloadIcs(
                    `agendamento-${tenant.slug}.ics`,
                    buildIcsFile({ appointment, services: selectedServices, tenant }),
                  )
                }
                className="mobile-touch-card flex flex-col items-center gap-1 rounded-2xl border border-white/10 bg-background/40 py-3 text-xs active:scale-95"
              >
                <Download className="h-5 w-5" />
                .ics
              </button>
              <a
                href={buildGoogleCalendarUrl({ appointment, services: selectedServices, tenant })}
                target="_blank"
                rel="noreferrer"
                className="mobile-touch-card flex flex-col items-center gap-1 rounded-2xl border border-white/10 bg-background/40 py-3 text-xs active:scale-95"
              >
                <CalendarPlus className="h-5 w-5" />
                Google
              </a>
            </div>
          </div>
        </ChatBubble>
      ) : null}
    </ChatShell>
  );
}
