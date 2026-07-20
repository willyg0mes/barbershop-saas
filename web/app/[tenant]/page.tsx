import { ChatBooking } from "@/components/chat/chat-booking";
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
      <ChatBooking
        tenant={branding}
        initialServices={services}
        initialBarbers={barbers}
      />
    );
  } catch {
    notFound();
  }
}
