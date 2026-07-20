"use client";

import type { ReactNode } from "react";
import { Smartphone } from "lucide-react";

type MobileShellProps = {
  children: ReactNode;
};

export function MobileShell({ children }: MobileShellProps) {
  return (
    <div className="mobile-app-root">
      {/* Desktop hint — experiência pensada para celular */}
      <div className="mobile-desktop-hint" aria-hidden>
        <Smartphone className="h-4 w-4 shrink-0" />
        <span>Otimize no celular — abra esta página no smartphone para a melhor experiência.</span>
      </div>

      <div className="mobile-device-frame">{children}</div>
    </div>
  );
}
