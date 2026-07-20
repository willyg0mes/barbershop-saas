"use client";

import type { TenantBranding } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Scissors } from "lucide-react";
import type { ReactNode, RefObject } from "react";

type ChatShellProps = {
  tenant: TenantBranding;
  children: ReactNode;
  footer?: ReactNode;
  scrollRef?: RefObject<HTMLDivElement | null>;
  className?: string;
};

export function ChatShell({
  tenant,
  children,
  footer,
  scrollRef,
  className,
}: ChatShellProps) {
  return (
    <div
      className={cn(
        "relative flex h-[100dvh] w-full flex-col overflow-hidden",
        className,
      )}
      style={{
        background: `linear-gradient(180deg, var(--tenant-primary) 0%, #0a0a0a 28%, #0a0a0a 100%)`,
      }}
    >
      <header
        className="sticky top-0 z-20 border-b border-white/5 px-4 py-3 backdrop-blur-xl"
        style={{ backgroundColor: "color-mix(in srgb, var(--tenant-primary) 88%, transparent)" }}
      >
        <div className="mx-auto flex w-full max-w-lg items-center gap-3">
          {tenant.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tenant.logo_url}
              alt={tenant.name}
              className="h-11 w-11 rounded-full border-2 object-cover"
              style={{ borderColor: "var(--tenant-secondary)" }}
            />
          ) : (
            <div
              className="flex h-11 w-11 items-center justify-center rounded-full border-2 text-base font-bold"
              style={{
                borderColor: "var(--tenant-secondary)",
                backgroundColor: "var(--tenant-secondary)",
                color: "#111",
              }}
            >
              {tenant.name.slice(0, 1)}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-base font-semibold text-[var(--tenant-accent)]">
                {tenant.name}
              </h1>
              <Scissors className="h-3.5 w-3.5 shrink-0 opacity-60" style={{ color: "var(--tenant-secondary)" }} />
            </div>
            <p className="flex items-center gap-1.5 text-xs text-[var(--tenant-accent)]/70">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              Assistente online · responde na hora
            </p>
          </div>
        </div>
      </header>

      <div
        ref={scrollRef}
        className="chat-scroll mx-auto flex w-full max-w-lg flex-1 flex-col gap-4 overflow-y-auto px-4 py-5"
      >
        {children}
      </div>

      {footer ? (
        <footer className="sticky bottom-0 z-20 border-t border-white/5 bg-background/80 px-4 py-3 backdrop-blur-xl">
          <div className="mx-auto w-full max-w-lg">{footer}</div>
        </footer>
      ) : null}

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background/80 to-transparent"
        aria-hidden
      />
    </div>
  );
}
