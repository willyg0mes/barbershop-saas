"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export type QuickReply = {
  id: string;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
};

type QuickRepliesBarProps = {
  replies: QuickReply[];
  className?: string;
  hint?: string;
};

export function QuickRepliesBar({ replies, className, hint }: QuickRepliesBarProps) {
  if (replies.length === 0) return null;

  return (
    <div className={cn("mobile-quick-replies", className)}>
      {hint ? (
        <p className="mb-2 px-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {hint}
        </p>
      ) : null}
      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {replies.map((reply, index) => (
          <button
            key={reply.id}
            type="button"
            disabled={reply.disabled}
            onClick={reply.onClick}
            className={cn(
              "mobile-chip shrink-0 animate-in fade-in slide-in-from-bottom-1 duration-150",
              reply.active && "mobile-chip-active",
            )}
            style={{ animationDelay: `${index * 15}ms` }}
          >
            {reply.label}
          </button>
        ))}
      </div>
    </div>
  );
}

type MobileInputBarProps = {
  children: ReactNode;
};

export function MobileInputBar({ children }: MobileInputBarProps) {
  return (
    <div className="mobile-input-bar">
      {children}
    </div>
  );
}
