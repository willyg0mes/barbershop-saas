export type TenantBranding = {
  name: string;
  slug: string;
  subdomain: string;
  custom_domain: string | null;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  timezone: string;
  settings: {
    slot_interval_minutes: number;
    booking_lead_minutes: number;
    cancellation_hours_notice?: number;
    show_barber_photos?: boolean;
  };
};

export type Service = {
  id: number;
  name: string;
  description: string | null;
  duration_minutes: number;
  price_cents: number;
  price_formatted: string;
  sort_order: number;
};

export type Barber = {
  id: number;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  tenant_id: number;
};

export type AvailabilityBarber = {
  id: number;
  name: string;
  avatar_url?: string | null;
  slots: string[];
};

export type AvailabilityResponse = {
  date: string;
  duration_minutes: number;
  timezone: string;
  service_ids?: number[];
  barbers: AvailabilityBarber[];
};

export type Appointment = {
  id: number;
  status: string;
  starts_at: string;
  ends_at: string;
  total_duration_minutes: number;
  total_price_cents: number;
  client_name: string | null;
  client_phone: string | null;
  client_email: string | null;
  notes: string | null;
  barber?: Barber;
  services?: Service[];
};

export type BookingStep =
  | "services"
  | "barber"
  | "datetime"
  | "confirm"
  | "success";

export type BookingState = {
  step: BookingStep;
  serviceIds: number[];
  barberId: number | null;
  date: string;
  slot: string | null;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  notes: string;
  appointment: Appointment | null;
};
