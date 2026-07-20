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
      <div style={themeStyle} className="min-h-screen">
        <div
          className="border-b px-4 py-3"
          style={{ backgroundColor: "var(--tenant-primary)", color: "var(--tenant-accent)" }}
        >
          <div className="mx-auto flex max-w-xl items-center gap-3">
            {branding.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={branding.logo_url}
                alt={branding.name}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold"
                style={{
                  backgroundColor: "var(--tenant-secondary)",
                  color: "#111",
                }}
              >
                {branding.name.slice(0, 1)}
              </div>
            )}
            <span className="font-medium">{branding.name}</span>
          </div>
        </div>
        <main className="mx-auto max-w-xl px-4 py-6">{children}</main>
      </div>
    );
  } catch {
    notFound();
  }
}
