export type UserRole = "owner" | "barber" | "client";

export type User = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  phone: string | null;
  tenant_id: number;
  tenant_name?: string | null;
  tenant_slug?: string | null;
  avatar_url?: string | null;
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
  by_barber?: {
    barber_id: number;
    barber_name: string;
    revenue_cents: number;
    revenue_formatted: string;
    commission_cents?: number;
    commission_formatted?: string;
  }[];
  commission_enabled?: boolean;
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
  break_start?: string | null;
  break_end?: string | null;
};

export type CreateBarberInput = {
  name: string;
  email: string;
  password: string;
  phone?: string;
};

export type TimeBlock = {
  id: number;
  barber_id: number;
  barber_name: string;
  starts_at: string;
  ends_at: string;
  reason: string | null;
};

export type ClosedDate = {
  id: number;
  date: string;
  reason: string | null;
};

export type ScheduleBreak = {
  id: number;
  label: string;
  start_time: string;
  end_time: string;
};

export type Settings = {
  name?: string;
  slug?: string;
  logo_url?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  accent_color?: string | null;
  booking_url?: string | null;
  booking_lead_minutes?: number | null;
  cancellation_hours_notice?: number | null;
  commission_enabled?: boolean;
  commission_percent?: number | null;
  show_barber_photos?: boolean;
};
