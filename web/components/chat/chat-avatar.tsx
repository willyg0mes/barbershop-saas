"use client";

import { cn } from "@/lib/utils";
import { Bot, Scissors, UserRound } from "lucide-react";

type ChatAvatarProps = {
  variant: "bot" | "user" | "barber";
  name?: string;
  logoUrl?: string | null;
  tenantName?: string;
  size?: "sm" | "md";
  className?: string;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function ChatAvatar({
  variant,
  name,
  logoUrl,
  tenantName,
  size = "md",
  className,
}: ChatAvatarProps) {
  const dim = size === "sm" ? "h-7 w-7 text-[10px]" : "h-9 w-9 text-xs";

  if (variant === "bot") {
    if (logoUrl) {
      return (
        <div className={cn("relative shrink-0", dim, className)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoUrl}
            alt={tenantName ?? "Assistente"}
            className="h-full w-full rounded-full border-2 object-cover shadow-md"
            style={{ borderColor: "var(--tenant-secondary)" }}
          />
          <span
            className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border border-background"
            style={{ backgroundColor: "var(--tenant-secondary)", color: "#111" }}
          >
            <Bot className="h-2.5 w-2.5" />
          </span>
        </div>
      );
    }

    return (
      <div
        className={cn(
          "relative flex shrink-0 items-center justify-center rounded-full border-2 font-bold shadow-md",
          dim,
          className,
        )}
        style={{
          borderColor: "var(--tenant-secondary)",
          backgroundColor: "var(--tenant-primary)",
          color: "var(--tenant-accent)",
        }}
      >
        {tenantName ? initials(tenantName) : <Scissors className="h-4 w-4" style={{ color: "var(--tenant-secondary)" }} />}
        <span
          className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full"
          style={{ backgroundColor: "var(--tenant-secondary)", color: "#111" }}
        >
          <Bot className="h-2 w-2" />
        </span>
      </div>
    );
  }

  if (variant === "barber") {
    return (
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full border font-semibold shadow-sm",
          dim,
          className,
        )}
        style={{
          borderColor: "color-mix(in srgb, var(--tenant-secondary) 50%, transparent)",
          backgroundColor: "color-mix(in srgb, var(--tenant-secondary) 18%, #111)",
          color: "var(--tenant-secondary)",
        }}
      >
        {name ? initials(name) : "?"}
      </div>
    );
  }

  const label = name?.trim() ? initials(name) : null;

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border border-white/10 bg-muted font-semibold text-muted-foreground shadow-sm",
        dim,
        className,
      )}
    >
      {label ?? <UserRound className="h-4 w-4" />}
    </div>
  );
}
