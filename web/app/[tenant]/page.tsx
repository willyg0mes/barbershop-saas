import { BookingWizard } from "@/components/booking/booking-wizard";
import { fetchBarbers, fetchServices, fetchTenantBranding } from "@/lib/api";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type TenantPageProps = {
  params: Promise<{ tenant: string }>;
};

export async function generateMetadata({
  params,
}: TenantPageProps): Promise<Metadata> {
  const { tenant } = await params;

  try {
    const branding = await fetchTenantBranding(tenant);

    return {
      title: `${branding.name} — Agendar horário`,
      description: `Agende online na ${branding.name}`,
      themeColor: branding.primary_color,
      appleWebApp: {
        capable: true,
        title: branding.name,
      },
    };
  } catch {
    return { title: "Barbearia não encontrada" };
  }
}

export default async function TenantPage({ params }: TenantPageProps) {
  const { tenant } = await params;

  try {
    const [branding, services, barbers] = await Promise.all([
      fetchTenantBranding(tenant),
      fetchServices(tenant),
      fetchBarbers(tenant),
    ]);

    return (
      <div className="space-y-6">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Agendamento online
          </p>
          <h1 className="text-3xl font-semibold">{branding.name}</h1>
          <p className="text-sm text-muted-foreground">
            Escolha serviços, barbeiro e horário em poucos passos.
          </p>
        </header>

        <BookingWizard
          tenant={branding}
          initialServices={services}
          initialBarbers={barbers}
        />
      </div>
    );
  } catch {
    notFound();
  }
}
