export type UserRole = "owner" | "barber" | "client";

export type User = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  phone: string | null;
  tenant_id: number;
};

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show";

export type Service = {
  id: number;
  name: string;
  duration_minutes: number;
  price_cents: number;
  price_formatted: string;
  sort_order: number;
};

export type Appointment = {
  id: number;
  status: AppointmentStatus;
  starts_at: string;
  ends_at: string;
  total_duration_minutes: number;
  total_price_cents: number;
  client_name: string;
  client_phone: string | null;
  client_email: string | null;
  notes: string | null;
  barber: User;
  services: Service[];
};

export type FinanceSummary = {
  date: string;
  completed_count: number;
  total_revenue_cents: number;
  total_revenue_formatted: string;
  pending_count: number;
  cancelled_count: number;
};

export type LoginResponse = {
  token: string;
  token_type: string;
  user: User;
};

export type BusinessHour = {
  id?: number;
  day_of_week: number;
  open_time: string | null;
  close_time: string | null;
  is_closed: boolean;
};

export type CreateBarberInput = {
  name: string;
  email: string;
  password: string;
  phone?: string;
};
