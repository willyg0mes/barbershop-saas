"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, LogOut, Store, UserCog } from "lucide-react";
import { getPlatformMe, logoutPlatform } from "@/lib/platform-api";

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === "/platform/login";
  const [checking, setChecking] = useState(!isLogin);
  const [name, setName] = useState("");

  useEffect(() => {
    if (isLogin) return;

    const token = localStorage.getItem("platform_token");
    if (!token) {
      router.replace("/platform/login");
      return;
    }

    getPlatformMe()
      .then((admin) => {
        setName(admin.name);
        setChecking(false);
      })
      .catch(() => {
        localStorage.removeItem("platform_token");
        router.replace("/platform/login");
      });
  }, [isLogin, router]);

  if (isLogin) {
    return <>{children}</>;
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] text-white">
        <Loader2 className="h-6 w-6 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  const nav = [
    { href: "/platform", label: "Barbearias", icon: Store },
    { href: "/platform/conta", label: "Minha conta", icon: UserCog },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <header className="border-b border-white/10 bg-[#111]">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#D4AF37]">Wynext</p>
            <h1 className="text-lg font-semibold">Painel das barbearias</h1>
            {name ? <p className="text-xs text-gray-400">{name}</p> : null}
          </div>
          <button
            type="button"
            onClick={async () => {
              await logoutPlatform();
              router.replace("/platform/login");
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-gray-300 hover:border-white/20 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
        <nav className="mx-auto flex max-w-5xl gap-1 px-4 pb-3">
          {nav.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                  active
                    ? "bg-[#D4AF37]/15 text-[#D4AF37]"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
