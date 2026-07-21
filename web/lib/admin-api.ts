const BACKEND = typeof window !== "undefined" ? "/backend" : "http://127.0.0.1:8080";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("owner_token");
}

function getTenantSlug(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("owner_tenant");
}

async function adminRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  if (!token) throw new Error("Não autenticado");

  const response = await fetch(`${BACKEND}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.message || `Erro: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = await response.json();
  return (payload.data ?? payload) as T;
}

export async function registerTenant(body: {
  name: string;
  slug: string;
  owner_name: string;
  owner_email: string;
  owner_password: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
}) {
  const response = await fetch(`${BACKEND}/api/v1/tenants/register`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.message || "Erro ao registrar");
  }

  const payload = await response.json();
  return payload.data ?? payload;
}

export async function loginOwner(slug: string, email: string, password: string) {
  const response = await fetch(`${BACKEND}/api/v1/tenants/${slug}/auth/login`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.message || "Credenciais inválidas");
  }

  const payload = await response.json();
  return payload.data ?? payload;
}

export type OwnerSettings = {
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string | null;
  timezone: string;
  booking_url: string;
  slot_interval_minutes: number;
  booking_lead_minutes: number;
  cancellation_hours_notice: number;
  commission_enabled: boolean;
  commission_percent: number;
  show_barber_photos: boolean;
};

export type AdminService = {
  id: number;
  name: string;
  duration_minutes: number;
  price_cents: number;
  is_active: boolean;
};

export type WeeklyHour = {
  id?: number;
  day_of_week: number;
  open_time: string | null;
  close_time: string | null;
  break_start: string | null;
  break_end: string | null;
  is_closed: boolean;
};

export type AdminScheduleBreak = {
  id: number;
  label: string;
  start_time: string;
  end_time: string;
};

export type AdminClosedDate = {
  id: number;
  date: string;
  reason?: string | null;
};

export type AdminBarber = {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar_url?: string | null;
};

export type FinanceBarberBreakdown = {
  id: number;
  name: string;
  completed_count: number;
  revenue_cents: number;
  commission_cents: number;
};

export type FinanceSummary = {
  date: string;
  completed_count: number;
  total_revenue_cents: number;
  by_barber?: FinanceBarberBreakdown[];
};

export async function getSettings() {
  return adminRequest<OwnerSettings>(`/api/v1/settings`);
}

export async function updateSettings(body: Partial<{
  name: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string | null;
  booking_lead_minutes: number;
  cancellation_hours_notice: number;
  commission_enabled: boolean;
  commission_percent: number;
  show_barber_photos: boolean;
}>) {
  return adminRequest<OwnerSettings>(`/api/v1/settings`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function getServices() {
  return adminRequest<AdminService[]>(`/api/v1/staff/services`);
}

export async function createService(body: {
  name: string;
  description?: string;
  duration_minutes: number;
  price_cents: number;
}) {
  return adminRequest(`/api/v1/staff/services`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateService(id: number, body: {
  name?: string;
  description?: string;
  duration_minutes?: number;
  price_cents?: number;
  is_active?: boolean;
}) {
  return adminRequest(`/api/v1/staff/services/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function getWeeklyHours() {
  return adminRequest<WeeklyHour[]>(`/api/v1/business-hours`);
}

export async function updateWeeklyHours(days: Array<{
  day_of_week: number;
  is_closed: boolean;
  open_time?: string | null;
  close_time?: string | null;
  break_start?: string | null;
  break_end?: string | null;
}>) {
  return adminRequest(`/api/v1/business-hours`, {
    method: "PUT",
    body: JSON.stringify({ days }),
  });
}

export async function getScheduleBreaks() {
  return adminRequest<AdminScheduleBreak[]>(`/api/v1/schedule-breaks`);
}

export async function createScheduleBreak(body: {
  label: string;
  start_time: string;
  end_time: string;
  barber_id?: number | null;
}) {
  return adminRequest(`/api/v1/schedule-breaks`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function deleteScheduleBreak(id: number) {
  return adminRequest(`/api/v1/schedule-breaks/${id}`, {
    method: "DELETE",
  });
}

export async function getClosedDates() {
  return adminRequest<AdminClosedDate[]>(`/api/v1/closed-dates`);
}

export async function createClosedDate(body: { date: string; reason?: string }) {
  return adminRequest(`/api/v1/closed-dates`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function deleteClosedDate(id: number) {
  return adminRequest(`/api/v1/closed-dates/${id}`, {
    method: "DELETE",
  });
}

export async function getBarbers() {
  return adminRequest<AdminBarber[]>(`/api/v1/staff/barbers`);
}

export async function updateBarber(id: number, body: {
  name?: string;
  email?: string;
  phone?: string | null;
  avatar_url?: string | null;
  password?: string;
}) {
  return adminRequest(`/api/v1/staff/barbers/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function getFinanceSummary(date: string) {
  return adminRequest<FinanceSummary>(`/api/v1/finance/summary?date=${date}`);
}

export function getStoredTenantSlug() {
  return getTenantSlug();
}
