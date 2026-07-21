import { fetchTenantBranding } from "@/lib/api";
import { contrastText, readableOn } from "@/lib/color";
import type { Metadata, Viewport } from "next";
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
    };
  } catch {
    return { title: "Barbearia" };
  }
}

export async function generateViewport({
  params,
}: TenantLayoutProps): Promise<Viewport> {
  const { tenant } = await params;

  try {
    const branding = await fetchTenantBranding(tenant);
    return {
      themeColor: branding.primary_color,
    };
  } catch {
    return { themeColor: "#121212" };
  }
}

export default async function TenantLayout({
  children,
  params,
}: TenantLayoutProps) {
  const { tenant } = await params;

  try {
    const branding = await fetchTenantBranding(tenant);
    const secondary = branding.secondary_color || "#D4AF37";
    const primary = branding.primary_color || "#1A1A1A";
    const accent = branding.accent_color || "#F5F5F5";
    const actionBarApprox = primary;

    const themeStyle = {
      "--tenant-primary": primary,
      "--tenant-secondary": secondary,
      "--tenant-accent": accent,
      "--tenant-on-primary": contrastText(primary),
      "--tenant-on-secondary": contrastText(secondary),
      "--tenant-continue-disabled-fg": readableOn(actionBarApprox, secondary),
    } as CSSProperties;

    return (
      <div style={themeStyle} className="h-[100dvh] overflow-hidden bg-black">
        {children}
      </div>
    );
  } catch {
    notFound();
  }
}
