const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://127.0.0.1:8080";

function apiUrl(path: string): string {
  if (path.startsWith("http")) {
    return path;
  }

  const normalized = path.startsWith("/") ? path : `/${path}`;

  if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_USE_PROXY === "true") {
    return `/backend${normalized}`;
  }

  return `${API_BASE}${normalized}`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(path), {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.message || `Request failed (${response.status})`);
  }

  const payload = await response.json();
  return (payload.data ?? payload) as T;
}

export async function resolveTenantByHost(host: string) {
  return request<{ slug: string; subdomain: string }>(
    `/api/v1/tenants/resolve?host=${encodeURIComponent(host)}`,
  );
}

export async function fetchTenantBranding(slug: string) {
  return request<import("./types").TenantBranding>(
    `/api/v1/tenants/${slug}/branding`,
  );
}

export async function fetchServices(slug: string) {
  return request<import("./types").Service[]>(
    `/api/v1/tenants/${slug}/services`,
  );
}

export async function fetchBarbers(slug: string) {
  return request<import("./types").Barber[]>(
    `/api/v1/tenants/${slug}/barbers`,
  );
}

export async function fetchAvailability(
  slug: string,
  params: {
    date: string;
    serviceIds: number[];
    barberId?: number;
  },
) {
  const search = new URLSearchParams({ date: params.date });
  params.serviceIds.forEach((id) => search.append("service_ids[]", String(id)));

  if (params.barberId) {
    search.set("barber_id", String(params.barberId));
  }

  const payload = await request<import("./types").AvailabilityResponse>(
    `/api/v1/tenants/${slug}/availability?${search.toString()}`,
  );

  return payload;
}

export async function createAppointment(
  slug: string,
  body: {
    barber_id: number;
    service_ids: number[];
    starts_at: string;
    client_name: string;
    client_phone?: string;
    client_email?: string;
    notes?: string;
  },
) {
  return request<import("./types").Appointment>(
    `/api/v1/tenants/${slug}/appointments`,
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
}
