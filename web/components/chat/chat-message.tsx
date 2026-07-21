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
  wide = false,
}: ChatBubbleProps) {
  const isBot = role === "bot";

  return (
    <div
      className={cn(
        "flex w-full gap-2",
        isBot ? "justify-start" : "justify-end",
        className,
      )}
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
            "rounded-[1.25rem] text-[15px] leading-snug",
            wide ? "px-3 py-3.5 sm:px-4" : "px-4 py-3",
            isBot
              ? "rounded-tl-sm border border-white/8 bg-card text-card-foreground"
              : "rounded-tr-sm font-medium text-[#111]",
          )}
          style={
            !isBot
              ? { backgroundColor: "var(--tenant-secondary)" }
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
    <div className="flex justify-start gap-2">
      <ChatAvatar variant="bot" tenantName={tenantName} logoUrl={tenantLogo} className="mt-1" />
      <div className="flex items-center gap-1.5 rounded-[1.25rem] rounded-tl-sm border border-white/8 bg-card px-4 py-3.5">
        <span className="chat-typing-dot" />
        <span className="chat-typing-dot animation-delay-150" />
        <span className="chat-typing-dot animation-delay-300" />
      </div>
    </div>
  );
}
