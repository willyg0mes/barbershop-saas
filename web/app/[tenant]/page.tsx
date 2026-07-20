import { ChatBooking } from "@/components/chat/chat-booking";
import { MobileShell } from "@/components/chat/mobile-shell";
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
      title: `${branding.name} — Agendar`,
      description: `Agende na ${branding.name} pelo celular`,
      appleWebApp: {
        capable: true,
        statusBarStyle: "black-translucent",
        title: branding.name,
      },
      formatDetection: {
        telephone: true,
        email: true,
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
      <MobileShell>
        <ChatBooking
          tenant={branding}
          initialServices={services}
          initialBarbers={barbers}
        />
      </MobileShell>
    );
  } catch {
    notFound();
  }
}
