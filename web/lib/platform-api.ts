const BACKEND = typeof window !== "undefined" ? "/backend" : "http://127.0.0.1:8080";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("platform_token");
}

async function platformRequest<T>(path: string, init?: RequestInit): Promise<T> {
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
    const message =
      payload.message ||
      (payload.errors ? Object.values(payload.errors).flat().join(" ") : null) ||
      `Erro: ${response.status}`;
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = await response.json();
  return (payload.data ?? payload) as T;
}

export type PlatformAdmin = {
  id: number;
  name: string;
  email: string;
};

export type PlatformTenant = {
  id: number;
  name: string;
  slug: string;
  subdomain: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string | null;
  is_active: boolean;
  users_count?: number | null;
  appointments_count?: number | null;
  created_at?: string | null;
  owner?: { id: number; name: string; email: string } | null;
};

export async function loginPlatform(email: string, password: string) {
  const response = await fetch(`${BACKEND}/api/v1/platform/auth/login`, {
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
  return (payload.data ?? payload) as { token: string; admin: PlatformAdmin };
}

export async function getPlatformMe() {
  return platformRequest<PlatformAdmin>("/api/v1/platform/auth/me");
}

export async function logoutPlatform() {
  try {
    await platformRequest("/api/v1/platform/auth/logout", { method: "POST" });
  } finally {
    localStorage.removeItem("platform_token");
  }
}

export async function updatePlatformProfile(body: {
  name?: string;
  email?: string;
  current_password?: string;
  password?: string;
  password_confirmation?: string;
}) {
  return platformRequest<PlatformAdmin>("/api/v1/platform/auth/profile", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function listPlatformTenants(q?: string) {
  const query = q ? `?q=${encodeURIComponent(q)}` : "";
  return platformRequest<PlatformTenant[]>(`/api/v1/platform/tenants${query}`);
}

export async function getPlatformTenant(id: number) {
  return platformRequest<PlatformTenant>(`/api/v1/platform/tenants/${id}`);
}

export async function createPlatformTenant(body: {
  name: string;
  slug: string;
  owner_name: string;
  owner_email: string;
  owner_password: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  is_active?: boolean;
}) {
  return platformRequest<PlatformTenant>("/api/v1/platform/tenants", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updatePlatformTenant(
  id: number,
  body: Partial<{
    name: string;
    slug: string;
    owner_name: string;
    owner_email: string;
    owner_password: string;
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    is_active: boolean;
  }>,
) {
  return platformRequest<PlatformTenant>(`/api/v1/platform/tenants/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deletePlatformTenant(id: number) {
  return platformRequest<void>(`/api/v1/platform/tenants/${id}`, {
    method: "DELETE",
  });
}
