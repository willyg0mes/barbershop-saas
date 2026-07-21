import type {
  Appointment,
  BusinessHour,
  CreateBarberInput,
  FinanceSummary,
  LoginResponse,
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

export async function logout(token: string): Promise<void> {
  await apiFetch("/api/v1/auth/logout", { method: "POST" }, token);
}
