"use client";

import { BarberStep } from "@/components/booking/barber-step";
import { ConfirmStep } from "@/components/booking/confirm-step";
import { DateTimeStep } from "@/components/booking/datetime-step";
import { ServicesStep } from "@/components/booking/services-step";
import { StepIndicator } from "@/components/booking/step-indicator";
import { SuccessStep } from "@/components/booking/success-step";
import {
  createAppointment,
  fetchAvailability,
} from "@/lib/api";
import type {
  AvailabilityResponse,
  Barber,
  BookingState,
  Service,
  TenantBranding,
} from "@/lib/types";
import { format } from "date-fns";
import { useCallback, useEffect, useMemo, useState } from "react";

const initialState = (): Omit<BookingState, "appointment"> & {
  appointment: BookingState["appointment"];
} => ({
  step: "services",
  serviceIds: [],
  barberId: null,
  date: format(new Date(), "yyyy-MM-dd"),
  slot: null,
  clientName: "",
  clientPhone: "",
  clientEmail: "",
  notes: "",
  appointment: null,
});

type BookingWizardProps = {
  tenant: TenantBranding;
  initialServices: Service[];
  initialBarbers: Barber[];
};

export function BookingWizard({
  tenant,
  initialServices,
  initialBarbers,
}: BookingWizardProps) {
  const [state, setState] = useState(initialState);
  const [services] = useState(initialServices);
  const [barbers] = useState(initialBarbers);
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(
    null,
  );
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedServices = useMemo(
    () => services.filter((service) => state.serviceIds.includes(service.id)),
    [services, state.serviceIds],
  );

  const selectedBarber = useMemo(
    () => barbers.find((barber) => barber.id === state.barberId) ?? null,
    [barbers, state.barberId],
  );

  const loadAvailability = useCallback(async () => {
    if (!state.barberId || state.serviceIds.length === 0 || !state.date) {
      return;
    }

    setLoadingAvailability(true);
    setError(null);

    try {
      const payload = await fetchAvailability(tenant.slug, {
        date: state.date,
        serviceIds: state.serviceIds,
        barberId: state.barberId,
      });
      setAvailability(payload);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Erro ao buscar horários");
      setAvailability(null);
    } finally {
      setLoadingAvailability(false);
    }
  }, [state.barberId, state.date, state.serviceIds, tenant.slug]);

  useEffect(() => {
    if (state.step === "datetime") {
      void loadAvailability();
    }
  }, [loadAvailability, state.step, state.date, state.barberId, state.serviceIds]);

  const toggleService = (serviceId: number) => {
    setState((current) => ({
      ...current,
      serviceIds: current.serviceIds.includes(serviceId)
        ? current.serviceIds.filter((id) => id !== serviceId)
        : [...current.serviceIds, serviceId],
    }));
  };

  const submitBooking = async () => {
    if (!state.barberId || !state.slot) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const appointment = await createAppointment(tenant.slug, {
        barber_id: state.barberId,
        service_ids: state.serviceIds,
        starts_at: state.slot,
        client_name: state.clientName.trim(),
        client_phone: state.clientPhone || undefined,
        client_email: state.clientEmail || undefined,
        notes: state.notes || undefined,
      });

      setState((current) => ({
        ...current,
        step: "success",
        appointment,
      }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Erro ao agendar");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-xl flex-col gap-6">
      <StepIndicator step={state.step} />

      {error ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {state.step === "services" ? (
        <ServicesStep
          services={services}
          selectedIds={state.serviceIds}
          onToggle={toggleService}
          onContinue={() =>
            setState((current) => ({
              ...current,
              step: barbers.length === 1 ? "datetime" : "barber",
              barberId: barbers.length === 1 ? barbers[0].id : current.barberId,
            }))
          }
        />
      ) : null}

      {state.step === "barber" ? (
        <BarberStep
          barbers={barbers}
          selectedId={state.barberId}
          onSelect={(barberId) => setState((current) => ({ ...current, barberId }))}
          onBack={() => setState((current) => ({ ...current, step: "services" }))}
          onContinue={() => setState((current) => ({ ...current, step: "datetime" }))}
        />
      ) : null}

      {state.step === "datetime" ? (
        <DateTimeStep
          date={state.date}
          slot={state.slot}
          loading={loadingAvailability}
          availability={availability}
          onDateChange={(date) =>
            setState((current) => ({ ...current, date, slot: null }))
          }
          onSlotSelect={(slot) => setState((current) => ({ ...current, slot }))}
          onBack={() =>
            setState((current) => ({
              ...current,
              step: barbers.length === 1 ? "services" : "barber",
            }))
          }
          onContinue={() => setState((current) => ({ ...current, step: "confirm" }))}
        />
      ) : null}

      {state.step === "confirm" ? (
        <ConfirmStep
          services={selectedServices}
          barber={selectedBarber}
          slot={state.slot}
          clientName={state.clientName}
          clientPhone={state.clientPhone}
          clientEmail={state.clientEmail}
          notes={state.notes}
          submitting={submitting}
          onChange={(field, value) =>
            setState((current) => ({ ...current, [field]: value }))
          }
          onBack={() => setState((current) => ({ ...current, step: "datetime" }))}
          onSubmit={submitBooking}
        />
      ) : null}

      {state.step === "success" && state.appointment ? (
        <SuccessStep
          tenant={tenant}
          appointment={state.appointment}
          services={selectedServices}
          onRestart={() => setState(initialState())}
        />
      ) : null}
    </div>
  );
}
