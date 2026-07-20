"use client";

import type { TenantBranding } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ChevronLeft } from "lucide-react";
import type { ReactNode, RefObject } from "react";

type ChatShellProps = {
  tenant: TenantBranding;
  children: ReactNode;
  footer?: ReactNode;
  quickReplies?: ReactNode;
  actionBar?: ReactNode;
  scrollRef?: RefObject<HTMLDivElement | null>;
  className?: string;
};

export function ChatShell({
  tenant,
  children,
  footer,
  quickReplies,
  actionBar,
  scrollRef,
  className,
}: ChatShellProps) {
  return (
    <div
      className={cn("mobile-chat-shell relative flex h-full flex-col overflow-hidden", className)}
    >
      {/* Header estilo app de mensagens */}
      <header
        className="mobile-safe-top sticky top-0 z-30 shrink-0 border-b border-white/6 px-3 pb-3 pt-2 backdrop-blur-2xl"
        style={{
          backgroundColor: "color-mix(in srgb, var(--tenant-primary) 92%, transparent)",
        }}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Voltar"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full active:bg-white/10"
            onClick={() => window.history.back()}
          >
            <ChevronLeft className="h-6 w-6 text-[var(--tenant-accent)]" />
          </button>

          <div className="flex min-w-0 flex-1 items-center gap-3">
            {tenant.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={tenant.logo_url}
                alt=""
                className="h-10 w-10 shrink-0 rounded-full border-2 object-cover shadow-lg"
                style={{ borderColor: "var(--tenant-secondary)" }}
              />
            ) : (
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold shadow-lg"
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
              <h1 className="truncate text-[17px] font-semibold leading-tight text-[var(--tenant-accent)]">
                {tenant.name}
              </h1>
              <p className="flex items-center gap-1.5 text-xs text-emerald-400/90">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                online agora
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Área de mensagens com pattern sutil */}
      <div
        ref={scrollRef}
        className="chat-scroll mobile-chat-pattern relative flex flex-1 flex-col gap-3 overflow-y-auto overflow-x-hidden px-3 py-4"
      >
        {children}
      </div>

      {/* Quick replies flutuantes acima do footer */}
      {quickReplies ? (
        <div className="mobile-safe-bottom z-20 shrink-0 border-t border-white/5 bg-background/70 px-3 py-2 backdrop-blur-xl">
          {quickReplies}
        </div>
      ) : null}

      {actionBar ? (
        <div className="mobile-action-bar mobile-safe-bottom z-20 shrink-0 px-3 py-3">
          {actionBar}
        </div>
      ) : null}

      {footer ? (
        <footer className="mobile-safe-bottom z-30 shrink-0 border-t border-white/6 bg-background/90 px-3 py-2 backdrop-blur-2xl">
          {footer}
        </footer>
      ) : null}
    </div>
  );
}
