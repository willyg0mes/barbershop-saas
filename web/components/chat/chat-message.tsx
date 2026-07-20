"use client";

import { cn } from "@/lib/utils";
import { Bot, UserRound } from "lucide-react";
import type { ReactNode } from "react";

type ChatBubbleProps = {
  role: "bot" | "user";
  children: ReactNode;
  time?: string;
  className?: string;
};

export function ChatBubble({ role, children, time, className }: ChatBubbleProps) {
  const isBot = role === "bot";

  return (
    <div
      className={cn(
        "flex w-full gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300",
        isBot ? "justify-start" : "justify-end",
        className,
      )}
    >
      {isBot ? (
        <div
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: "var(--tenant-secondary)", color: "#111" }}
        >
          <Bot className="h-4 w-4" />
        </div>
      ) : null}

      <div className={cn("flex max-w-[88%] flex-col gap-1", !isBot && "items-end")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm",
            isBot
              ? "rounded-tl-md border border-white/5 bg-card/90 text-card-foreground backdrop-blur-md"
              : "rounded-tr-md text-[#111] shadow-md",
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
          <span className="px-1 text-[10px] text-muted-foreground">{time}</span>
        ) : null}
      </div>

      {!isBot ? (
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
          <UserRound className="h-4 w-4 text-muted-foreground" />
        </div>
      ) : null}
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex justify-start gap-2.5">
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: "var(--tenant-secondary)", color: "#111" }}
      >
        <Bot className="h-4 w-4" />
      </div>
      <div className="flex items-center gap-1 rounded-2xl rounded-tl-md border border-white/5 bg-card/90 px-4 py-3 backdrop-blur-md">
        <span className="chat-typing-dot" />
        <span className="chat-typing-dot animation-delay-150" />
        <span className="chat-typing-dot animation-delay-300" />
      </div>
    </div>
  );
}
