"use client";

import { ChatAvatar } from "@/components/chat/chat-avatar";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type ChatBubbleProps = {
  role: "bot" | "user";
  children: ReactNode;
  time?: string;
  className?: string;
  tenantName?: string;
  tenantLogo?: string | null;
  userName?: string;
  delayMs?: number;
  /** Bolha mais larga (calendário, grades de horário). */
  wide?: boolean;
};

export function ChatBubble({
  role,
  children,
  time,
  className,
  tenantName,
  tenantLogo,
  userName,
  delayMs = 0,
  wide = false,
}: ChatBubbleProps) {
  const isBot = role === "bot";

  return (
    <div
      className={cn(
        "flex w-full gap-2 animate-in fade-in slide-in-from-bottom-1 duration-200 fill-mode-backwards",
        isBot ? "justify-start" : "justify-end",
        className,
      )}
      style={{ animationDelay: `${delayMs}ms` }}
    >
      {isBot ? (
        <ChatAvatar
          variant="bot"
          tenantName={tenantName}
          logoUrl={tenantLogo}
          className="mt-1"
        />
      ) : null}

      <div
        className={cn(
          "flex flex-col gap-1",
          wide ? "min-w-0 flex-1 max-w-[calc(100%-2.75rem)]" : "max-w-[82%]",
          !isBot && "items-end",
        )}
      >
        <div
          className={cn(
            "rounded-[1.25rem] text-[15px] leading-snug shadow-sm transition-transform active:scale-[0.98]",
            wide ? "px-3 py-3.5 sm:px-4" : "px-4 py-3",
            isBot
              ? "rounded-tl-sm border border-white/8 bg-card/95 text-card-foreground backdrop-blur-md"
              : "rounded-tr-sm font-medium text-[#111] shadow-lg",
          )}
          style={
            !isBot
              ? {
                  backgroundColor: "var(--tenant-secondary)",
                  boxShadow: "0 4px 14px color-mix(in srgb, var(--tenant-secondary) 35%, transparent)",
                }
              : undefined
          }
        >
          {children}
        </div>
        {time ? (
          <span className="px-1 text-[10px] text-muted-foreground/80">{time}</span>
        ) : null}
      </div>

      {!isBot ? (
        <ChatAvatar variant="user" name={userName} className="mt-1" />
      ) : null}
    </div>
  );
}

type TypingIndicatorProps = {
  tenantName?: string;
  tenantLogo?: string | null;
};

export function TypingIndicator({ tenantName, tenantLogo }: TypingIndicatorProps) {
  return (
    <div className="flex animate-in fade-in duration-150 justify-start gap-2">
      <ChatAvatar variant="bot" tenantName={tenantName} logoUrl={tenantLogo} className="mt-1" />
      <div className="flex items-center gap-1.5 rounded-[1.25rem] rounded-tl-sm border border-white/8 bg-card/95 px-4 py-3.5 backdrop-blur-md">
        <span className="chat-typing-dot" />
        <span className="chat-typing-dot animation-delay-150" />
        <span className="chat-typing-dot animation-delay-300" />
      </div>
    </div>
  );
}
