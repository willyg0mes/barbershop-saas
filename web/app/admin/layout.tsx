"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem("owner_token");
    const slug = localStorage.getItem("owner_tenant");

    if (!token || !slug) {
      router.push("/admin/login");
    }
  }, [router]);

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <div className="text-gray-400">Carregando...</div>
      </div>
    );
  }

  return <>{children}</>;
}
