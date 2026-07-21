"use client";

import { ChatAvatar } from "@/components/chat/chat-avatar";
import { ChatDatePicker } from "@/components/chat/chat-date-picker";
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
  openAppleCalendar,
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
  ArrowLeft,
  CalendarPlus,
  Check,
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
  /** null = qualquer barbeiro (só após escolher no passo barber / slot) */
  const [barberId, setBarberId] = useState<number | null>(null);
  const [barberAny, setBarberAny] = useState(false);
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
      }, 320);
    },
    [pushMessage],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setTyping(false);
      pushMessage(
        "bot",
        `Fala! 👋 Aqui é o ${tenant.name}. Toque nos serviços abaixo ou use os chips para agendar rápido.`,
      );
      vibrate(10);
    }, 450);
    return () => clearTimeout(timer);
  }, [pushMessage, tenant.name]);

  useEffect(() => {
    scrollToBottom();
  }, [history, step, typing, scrollToBottom]);

  useEffect(() => {
    if (step !== "datetime") return;

    let cancelled = false;
    const timer = window.setTimeout(() => {
      void (async () => {
        if (serviceIds.length === 0 || !date) return;
        setLoadingAvailability(true);
        setError(null);
        try {
          const payload = await fetchAvailability(tenant.slug, {
            date,
            serviceIds,
            barberId: barberAny ? undefined : (barberId ?? undefined),
          });
          if (!cancelled) {
            setAvailability(payload);
          }
        } catch (caught) {
          if (!cancelled) {
            setError(caught instanceof Error ? caught.message : "Erro ao buscar horários");
            setAvailability(null);
          }
        } finally {
          if (!cancelled) {
            setLoadingAvailability(false);
          }
        }
      })();
    }, 180);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [step, date, serviceIds, tenant.slug, barberId, barberAny]);

  const goBack = useCallback(() => {
    vibrate(5);

    if (step === "confirm") {
      setSlot(null);
      if (barberAny) {
        setBarberId(null);
      }
      setStep("datetime");
      pushMessage("user", "← Alterar horário");
      botReply("Sem problemas! Escolhe outra data ou horário.");
      return;
    }

    if (step === "datetime") {
      setSlot(null);
      setAvailability(null);
      if (barbers.length > 1) {
        setBarberId(null);
        setBarberAny(false);
        setStep("barber");
        pushMessage("user", "← Voltar");
        botReply("Escolhe o barbeiro de novo.");
      } else {
        setBarberId(null);
        setBarberAny(false);
        setDate(format(new Date(), "yyyy-MM-dd"));
        setStep("services");
        pushMessage("user", "← Voltar");
        botReply("Beleza! Escolhe os serviços de novo.");
      }
      return;
    }

    if (step === "barber") {
      setBarberId(null);
      setBarberAny(false);
      setStep("services");
      pushMessage("user", "← Voltar");
      botReply("Beleza! Escolhe os serviços de novo.");
      return;
    }

    window.history.back();
  }, [step, pushMessage, botReply, barbers.length, barberAny]);

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

    if (barbers.length === 0) {
      botReply("No momento não há barbeiros disponíveis. Tente mais tarde.");
      return;
    }

    if (barbers.length === 1) {
      setBarberId(barbers[0].id);
      setBarberAny(false);
      botReply(
        `Fechou! Escolhe a data e o horário com ${barbers[0].name.split(" ")[0]}.`,
        "datetime",
      );
      return;
    }

    botReply("Agora escolhe o barbeiro — ou deixe qualquer um disponível.", "barber");
  }, [
    serviceIds.length,
    selectedServices,
    totalMinutes,
    totalPrice,
    pushMessage,
    botReply,
    barbers,
  ]);

  const confirmBarber = useCallback(
    (selectedId: number | null) => {
      vibrate(10);
      if (selectedId === null) {
        setBarberId(null);
        setBarberAny(true);
        pushMessage("user", "Qualquer barbeiro");
        botReply("Beleza! Escolhe a data — mostro horários de quem estiver livre.", "datetime");
        return;
      }

      const barber = barbers.find((b) => b.id === selectedId);
      if (!barber) return;

      setBarberId(selectedId);
      setBarberAny(false);
      pushMessage("user", barber.name);
      botReply(
        `Fechou com ${barber.name.split(" ")[0]}! Escolhe a data e o horário.`,
        "datetime",
      );
    },
    [barbers, pushMessage, botReply],
  );

  const confirmSlot = useCallback((selectedBarberId: number, value: string) => {
    vibrate(10);
    const barber = barbers.find((b) => b.id === selectedBarberId);
    if (!barber) return;

    setBarberId(selectedBarberId);
    setSlot(value);
    pushMessage("user", `${barber.name.split(" ")[0]} · ${formatSlotLabel(value)}`);
    botReply("Quase lá! Digita seu nome na barra de baixo e manda ✈️", "confirm");
  }, [barbers, pushMessage, botReply]);

  const setQuickDate = useCallback((offset: number) => {
    vibrate(5);
    const next = format(addDays(new Date(), offset), "yyyy-MM-dd");
    setDate(next);
    setSlot(null);
    if (barberAny) {
      setBarberId(null);
    }
  }, [barberAny]);

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
    setBarberId(null);
    setBarberAny(false);
    setDate(format(new Date(), "yyyy-MM-dd"));
    setSlot(null);
    setClientName("");
    setClientPhone("");
    setClientEmail("");
    setAppointment(null);
    setError(null);
    setHistory([]);
    botReply("Bora de novo! Escolhe os serviços 👇");
  }, [botReply]);

  const availabilityBarbers = useMemo(
    () => availability?.barbers ?? [],
    [availability],
  );

  const totalSlots = useMemo(
    () => availabilityBarbers.reduce((sum, barber) => sum + barber.slots.length, 0),
    [availabilityBarbers],
  );

  const quickReplies = useMemo(() => {
    if (typing) return [];

    if (step === "services") {
      return services.map((service) => ({
        id: `svc-${service.id}`,
        label: serviceIds.includes(service.id) ? `✓ ${service.name}` : service.name,
        active: serviceIds.includes(service.id),
        onClick: () => toggleService(service.id),
      }));
    }

    if (step === "barber") {
      return [
        ...barbers.map((barber) => ({
          id: `barber-${barber.id}`,
          label: barber.name.split(" ")[0],
          active: barberId === barber.id && !barberAny,
          onClick: () => confirmBarber(barber.id),
        })),
        {
          id: "any-barber",
          label: "Qualquer",
          active: barberAny,
          onClick: () => confirmBarber(null),
        },
        { id: "back", label: "← Voltar", onClick: goBack },
      ];
    }

    if (step === "datetime") {
      return [
        { id: "today", label: "Hoje", active: date === format(new Date(), "yyyy-MM-dd"), onClick: () => setQuickDate(0) },
        { id: "tomorrow", label: "Amanhã", active: date === format(addDays(new Date(), 1), "yyyy-MM-dd"), onClick: () => setQuickDate(1) },
        { id: "back", label: "← Voltar", onClick: goBack },
      ];
    }

    if (step === "confirm") {
      return [{ id: "back", label: "← Alterar horário", onClick: goBack }];
    }

    if (step === "success" && appointment) {
      return [
        {
          id: "apple",
          label: "Agenda Apple",
          onClick: () =>
            openAppleCalendar({
              appointment,
              services: selectedServices,
              tenant,
            }),
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
    barbers,
    barberId,
    barberAny,
    date,
    appointment,
    selectedServices,
    tenant,
    restart,
    toggleService,
    confirmBarber,
    setQuickDate,
    goBack,
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
            style={{
              backgroundColor: "var(--tenant-secondary)",
              color: "var(--tenant-on-secondary, #0a0a0a)",
            }}
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

  const actionBar =
    step === "services" && !typing ? (
      <button
        type="button"
        disabled={serviceIds.length === 0}
        onClick={confirmServices}
        className="mobile-continue-btn"
      >
        {serviceIds.length === 0
          ? "Escolha um serviço"
          : `Continuar · ${totalMinutes} min · R$ ${(totalPrice / 100).toFixed(2).replace(".", ",")}`}
      </button>
    ) : null;

  return (
    <ChatShell
      tenant={tenant}
      scrollRef={scrollRef}
      onBack={goBack}
      footer={footer}
      actionBar={actionBar}
      quickReplies={
        quickReplies.length > 0 ? (
          <QuickRepliesBar
            hint={
              step === "services"
                ? "Toque rápido"
                : step === "barber"
                  ? "Barbeiros"
                  : step === "datetime"
                    ? "Datas rápidas"
                    : step === "confirm"
                      ? "Ajustar"
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
            {tenant.settings.cancellation_hours_notice && tenant.settings.cancellation_hours_notice > 0 && (
              <p className="text-xs text-gray-400">
                Cancelamento: avise com {tenant.settings.cancellation_hours_notice}h de antecedência
              </p>
            )}
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
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold">Escolha o barbeiro</p>
              <button type="button" onClick={goBack} className="chat-back-link">
                <ArrowLeft className="h-3.5 w-3.5" />
                Serviços
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {barbers.map((barber) => {
                const active = barberId === barber.id && !barberAny;
                return (
                  <button
                    key={barber.id}
                    type="button"
                    onClick={() => confirmBarber(barber.id)}
                    className={cn(
                      "mobile-touch-card flex items-center gap-3 rounded-2xl border px-3 py-3 text-left active:scale-[0.98]",
                      active
                        ? "border-[var(--tenant-secondary)] bg-[var(--tenant-secondary)]/12"
                        : "border-white/10 bg-background/50",
                    )}
                  >
                    {tenant.settings.show_barber_photos && barber.avatar_url ? (
                      <img
                        src={barber.avatar_url}
                        alt={barber.name}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <ChatAvatar variant="barber" name={barber.name} className="h-10 w-10 text-sm" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{barber.name}</p>
                      <p className="text-xs text-muted-foreground">Ver horários deste barbeiro</p>
                    </div>
                    {active ? (
                      <Check className="h-4 w-4 shrink-0 text-[var(--tenant-secondary)]" />
                    ) : null}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => confirmBarber(null)}
                className={cn(
                  "mobile-touch-card flex items-center gap-3 rounded-2xl border px-3 py-3 text-left active:scale-[0.98]",
                  barberAny
                    ? "border-[var(--tenant-secondary)] bg-[var(--tenant-secondary)]/12"
                    : "border-white/10 bg-background/50",
                )}
              >
                <ChatAvatar variant="barber" name="?" className="h-10 w-10 text-sm" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">Qualquer barbeiro</p>
                  <p className="text-xs text-muted-foreground">Mostra todos os horários livres</p>
                </div>
                {barberAny ? (
                  <Check className="h-4 w-4 shrink-0 text-[var(--tenant-secondary)]" />
                ) : null}
              </button>
            </div>
          </div>
        </ChatBubble>
      ) : null}

      {!typing && step === "datetime" ? (
        <ChatBubble wide role="bot" tenantName={tenant.name} tenantLogo={tenant.logo_url}>
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold">Escolha a data</p>
              <button type="button" onClick={goBack} className="chat-back-link">
                <ArrowLeft className="h-3.5 w-3.5" />
                {barbers.length > 1 ? "Barbeiro" : "Serviços"}
              </button>
            </div>

            {selectedBarber && !barberAny ? (
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-background/40 px-3 py-2">
                {tenant.settings.show_barber_photos && selectedBarber.avatar_url ? (
                  <img
                    src={selectedBarber.avatar_url}
                    alt={selectedBarber.name}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <ChatAvatar variant="barber" name={selectedBarber.name} className="h-8 w-8 text-xs" />
                )}
                <p className="text-sm font-medium">{selectedBarber.name}</p>
              </div>
            ) : barberAny ? (
              <p className="text-xs text-muted-foreground">Mostrando horários de todos os barbeiros</p>
            ) : null}

            <ChatDatePicker
              value={date}
              min={format(new Date(), "yyyy-MM-dd")}
              onChange={(next) => {
                setDate(next);
                setSlot(null);
                if (barberAny) {
                  setBarberId(null);
                }
              }}
            />

            {loadingAvailability ? (
              <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Buscando horários...
              </div>
            ) : availabilityBarbers.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground">
                Sem horários nesta data. Tente outro dia no calendário.
              </p>
            ) : totalSlots === 0 ? (
              <p className="text-center text-xs text-muted-foreground">
                Nenhum horário livre nesta data. Tente Hoje ou Amanhã.
              </p>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground">
                  {totalSlots} horário{totalSlots === 1 ? "" : "s"} disponíve{totalSlots === 1 ? "l" : "is"}
                </p>

                {availabilityBarbers.map((barber) => (
                  <div key={barber.id} className="space-y-2">
                    <div className="flex items-center gap-2">
                      {tenant.settings.show_barber_photos && barber.avatar_url ? (
                        <img
                          src={barber.avatar_url}
                          alt={barber.name}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <ChatAvatar variant="barber" name={barber.name} className="h-8 w-8 text-xs" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">{barber.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {barber.slots.length === 0
                            ? "Sem horários neste dia"
                            : `${barber.slots.length} horário${barber.slots.length === 1 ? "" : "s"}`}
                        </p>
                      </div>
                    </div>

                    {barber.slots.length > 0 ? (
                      <div className="grid grid-cols-4 gap-2">
                        {barber.slots.map((item) => {
                          const active = slot === item && barberId === barber.id;

                          return (
                            <button
                              key={item}
                              type="button"
                              disabled={loadingAvailability}
                              onClick={() => confirmSlot(barber.id, item)}
                              className={cn(
                                "chat-slot-btn",
                                active && "chat-slot-btn-active",
                              )}
                            >
                              {format(parseISO(item), "HH:mm", { locale: ptBR })}
                            </button>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </ChatBubble>
      ) : null}

      {!typing && step === "confirm" && slot && selectedBarber ? (
        <ChatBubble role="bot" tenantName={tenant.name} tenantLogo={tenant.logo_url}>
          <div className="space-y-2">
            <div className="rounded-xl border border-white/10 bg-background/40 px-3 py-2">
              <p className="text-sm font-semibold">{selectedBarber.name}</p>
              <p className="text-xs text-muted-foreground">{formatSlotLabel(slot)}</p>
            </div>
            <button type="button" onClick={goBack} className="chat-back-link">
              <ArrowLeft className="h-3.5 w-3.5" />
              Alterar horário
            </button>
          </div>
        </ChatBubble>
      ) : null}

      {!typing && step === "success" && appointment ? (
        <ChatBubble role="bot" tenantName={tenant.name} tenantLogo={tenant.logo_url}>
          <div className="space-y-3">
            {tenant.settings.cancellation_hours_notice && tenant.settings.cancellation_hours_notice > 0 && (
              <p className="text-xs text-gray-400">
                Para cancelar, avise com {tenant.settings.cancellation_hours_notice}h de antecedência
              </p>
            )}
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
                  openAppleCalendar({
                    appointment,
                    services: selectedServices,
                    tenant,
                  })
                }
                className="mobile-touch-card flex flex-col items-center gap-1 rounded-2xl border border-white/10 bg-background/40 py-3 text-xs active:scale-95"
              >
                <CalendarPlus className="h-5 w-5" />
                Agenda Apple
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
