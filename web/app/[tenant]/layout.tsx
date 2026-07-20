import { fetchTenantBranding } from "@/lib/api";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { CSSProperties, ReactNode } from "react";

type TenantLayoutProps = {
  children: ReactNode;
  params: Promise<{ tenant: string }>;
};

export async function generateMetadata({
  params,
}: TenantLayoutProps): Promise<Metadata> {
  const { tenant } = await params;

  try {
    const branding = await fetchTenantBranding(tenant);
    return {
      title: branding.name,
      themeColor: branding.primary_color,
    };
  } catch {
    return { title: "Barbearia" };
  }
}

export default async function TenantLayout({
  children,
  params,
}: TenantLayoutProps) {
  const { tenant } = await params;

  try {
    const branding = await fetchTenantBranding(tenant);
    const themeStyle = {
      "--tenant-primary": branding.primary_color,
      "--tenant-secondary": branding.secondary_color,
      "--tenant-accent": branding.accent_color,
    } as CSSProperties;

    return (
      <div style={themeStyle} className="min-h-[100dvh] bg-background">
        {children}
      </div>
    );
  } catch {
    notFound();
  }
}
