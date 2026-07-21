import type {
  Appointment,
  BusinessHour,
  ClosedDate,
  CreateBarberInput,
  FinanceSummary,
  LoginResponse,
  ScheduleBreak,
  Service,
  Settings,
  TimeBlock,
  User,
} from "@/lib/types";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://127.0.0.1:8080";

type ApiEnvelope<T> = {
  data: T;
};

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;

    try {
      const payload = (await response.json()) as {
        message?: string;
        errors?: Record<string, string[]>;
      };
      if (payload.message) message = payload.message;
      else if (payload.errors) {
        message = Object.values(payload.errors).flat()[0] ?? message;
      }
    } catch {
      // ignore parse errors
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function login(
  tenantSlug: string,
  email: string,
  password: string,
): Promise<LoginResponse> {
  return apiFetch<LoginResponse>(`/api/v1/tenants/${tenantSlug}/auth/login`, {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
      device_name: "barbershop-staff-expo",
    }),
  });
}

export async function fetchMe(token: string): Promise<User> {
  const payload = await apiFetch<ApiEnvelope<User>>("/api/v1/auth/me", {}, token);
  return payload.data;
}

export async function updateFcmToken(token: string, fcmToken: string): Promise<void> {
  await apiFetch("/api/v1/auth/fcm-token", {
    method: "PATCH",
    body: JSON.stringify({ fcm_token: fcmToken }),
  }, token);
}

export async function fetchAppointments(
  token: string,
  date: string,
): Promise<Appointment[]> {
  const payload = await apiFetch<ApiEnvelope<Appointment[]>>(
    `/api/v1/appointments?date=${date}`,
    {},
    token,
  );

  return payload.data;
}

export async function fetchAppointment(
  token: string,
  id: number,
): Promise<Appointment> {
  const payload = await apiFetch<ApiEnvelope<Appointment>>(
    `/api/v1/appointments/${id}`,
    {},
    token,
  );

  return payload.data;
}

export async function updateAppointmentStatus(
  token: string,
  id: number,
  status: Appointment["status"],
): Promise<Appointment> {
  const payload = await apiFetch<ApiEnvelope<Appointment>>(
    `/api/v1/appointments/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
    },
    token,
  );

  return payload.data;
}

export async function fetchFinanceSummary(
  token: string,
  date: string,
): Promise<FinanceSummary> {
  const payload = await apiFetch<ApiEnvelope<FinanceSummary>>(
    `/api/v1/finance/summary?date=${date}`,
    {},
    token,
  );

  return payload.data;
}

export async function fetchBusinessHours(token: string): Promise<BusinessHour[]> {
  const payload = await apiFetch<ApiEnvelope<BusinessHour[]>>(
    "/api/v1/business-hours",
    {},
    token,
  );

  return payload.data;
}

export async function updateBusinessHours(
  token: string,
  days: BusinessHour[],
): Promise<BusinessHour[]> {
  const payload = await apiFetch<ApiEnvelope<BusinessHour[]>>(
    "/api/v1/business-hours",
    {
      method: "PUT",
      body: JSON.stringify({
        days: days.map((day) => ({
          day_of_week: day.day_of_week,
          is_closed: day.is_closed,
          open_time: day.is_closed ? null : day.open_time,
          close_time: day.is_closed ? null : day.close_time,
          break_start: day.is_closed ? null : day.break_start,
          break_end: day.is_closed ? null : day.break_end,
        })),
      }),
    },
    token,
  );

  return payload.data;
}

export async function fetchStaffBarbers(token: string): Promise<User[]> {
  const payload = await apiFetch<ApiEnvelope<User[]>>(
    "/api/v1/staff/barbers",
    {},
    token,
  );

  return payload.data;
}

export async function createStaffBarber(
  token: string,
  input: CreateBarberInput,
): Promise<User> {
  const payload = await apiFetch<ApiEnvelope<User>>(
    "/api/v1/staff/barbers",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
    token,
  );

  return payload.data;
}

export async function deactivateStaffBarber(
  token: string,
  id: number,
): Promise<void> {
  await apiFetch(`/api/v1/staff/barbers/${id}`, { method: "DELETE" }, token);
}

export async function updateStaffBarber(
  token: string,
  id: number,
  input: Partial<{ name: string; email: string; phone: string | null; avatar_url: string | null; password: string }>,
): Promise<User> {
  const payload = await apiFetch<ApiEnvelope<User>>(
    `/api/v1/staff/barbers/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
    token,
  );

  return payload.data;
}

export async function logout(token: string): Promise<void> {
  await apiFetch("/api/v1/auth/logout", { method: "POST" }, token);
}

export async function rescheduleAppointment(
  token: string,
  id: number,
  startsAt: string,
): Promise<Appointment> {
  const payload = await apiFetch<ApiEnvelope<Appointment>>(
    `/api/v1/appointments/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify({ starts_at: startsAt }),
    },
    token,
  );

  return payload.data;
}

export async function fetchTimeBlocks(
  token: string,
  date: string,
): Promise<TimeBlock[]> {
  const payload = await apiFetch<ApiEnvelope<TimeBlock[]>>(
    `/api/v1/time-blocks?date=${date}`,
    {},
    token,
  );

  return payload.data;
}

export async function createTimeBlock(
  token: string,
  input: {
    barber_id?: number;
    starts_at: string;
    ends_at: string;
    reason?: string;
  },
): Promise<TimeBlock> {
  const payload = await apiFetch<ApiEnvelope<TimeBlock>>(
    "/api/v1/time-blocks",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
    token,
  );

  return payload.data;
}

export async function deleteTimeBlock(token: string, id: number): Promise<void> {
  await apiFetch(`/api/v1/time-blocks/${id}`, { method: "DELETE" }, token);
}

export async function fetchClosedDates(token: string): Promise<ClosedDate[]> {
  const payload = await apiFetch<ApiEnvelope<ClosedDate[]>>(
    "/api/v1/closed-dates",
    {},
    token,
  );

  return payload.data;
}

export async function createClosedDate(
  token: string,
  input: { date: string; reason?: string },
): Promise<ClosedDate> {
  const payload = await apiFetch<ApiEnvelope<ClosedDate>>(
    "/api/v1/closed-dates",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
    token,
  );

  return payload.data;
}

export async function deleteClosedDate(token: string, id: number): Promise<void> {
  await apiFetch(`/api/v1/closed-dates/${id}`, { method: "DELETE" }, token);
}

export async function fetchScheduleBreaks(token: string): Promise<ScheduleBreak[]> {
  const payload = await apiFetch<ApiEnvelope<ScheduleBreak[]>>(
    "/api/v1/schedule-breaks",
    {},
    token,
  );

  return payload.data;
}

export async function createScheduleBreak(
  token: string,
  input: { label: string; start_time: string; end_time: string },
): Promise<ScheduleBreak> {
  const payload = await apiFetch<ApiEnvelope<ScheduleBreak>>(
    "/api/v1/schedule-breaks",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
    token,
  );

  return payload.data;
}

export async function deleteScheduleBreak(token: string, id: number): Promise<void> {
  await apiFetch(`/api/v1/schedule-breaks/${id}`, { method: "DELETE" }, token);
}

export async function fetchSettings(token: string): Promise<Settings> {
  const payload = await apiFetch<ApiEnvelope<Settings>>(
    "/api/v1/settings",
    {},
    token,
  );

  return payload.data;
}

export async function updateSettings(
  token: string,
  input: Partial<Settings>,
): Promise<Settings> {
  const payload = await apiFetch<ApiEnvelope<Settings>>(
    "/api/v1/settings",
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
    token,
  );

  return payload.data;
}

export async function fetchServices(token: string): Promise<Service[]> {
  const payload = await apiFetch<ApiEnvelope<Service[]>>(
    "/api/v1/staff/services",
    {},
    token,
  );

  return payload.data;
}

export async function createService(
  token: string,
  input: { name: string; duration_minutes: number; price_cents: number },
): Promise<Service> {
  const payload = await apiFetch<ApiEnvelope<Service>>(
    "/api/v1/staff/services",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
    token,
  );

  return payload.data;
}

export async function updateService(
  token: string,
  id: number,
  input: Partial<{ name: string; duration_minutes: number; price_cents: number; is_active?: boolean }>,
): Promise<Service> {
  const payload = await apiFetch<ApiEnvelope<Service>>(
    `/api/v1/staff/services/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
    token,
  );

  return payload.data;
}

export async function deleteService(token: string, id: number): Promise<void> {
  await apiFetch(`/api/v1/staff/services/${id}`, { method: "DELETE" }, token);
}
