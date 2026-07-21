"use client";

import { registerTenant } from "@/lib/admin-api";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#D4AF37");
  const [secondaryColor, setSecondaryColor] = useState("#FFD700");
  const [accentColor, setAccentColor] = useState("#C5A028");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await registerTenant({
        name,
        slug,
        owner_name: ownerName,
        owner_email: ownerEmail,
        owner_password: ownerPassword,
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        accent_color: accentColor,
      });

      if (result.token) {
        localStorage.setItem("owner_token", result.token);
        localStorage.setItem("owner_tenant", slug);
        router.push("/admin");
      } else {
        setError("Token não retornado");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao registrar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">Bem-vindo</h1>
          <p className="mt-2 text-sm text-gray-400">
            Crie sua conta e comece a receber agendamentos
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300">
              Nome da Barbearia
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-[#161616] px-4 py-3 text-white placeholder-gray-500 focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
              placeholder="Dom Corte"
            />
          </div>

          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-gray-300">
              Slug (URL única)
            </label>
            <input
              id="slug"
              type="text"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              className="mt-1 w-full rounded-lg border border-white/10 bg-[#161616] px-4 py-3 text-white placeholder-gray-500 focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
              placeholder="dom-corte"
            />
            <p className="mt-1 text-xs text-gray-500">
              Será sua URL: {slug || "seu-slug"}.barber.com
            </p>
          </div>

          <div>
            <label htmlFor="ownerName" className="block text-sm font-medium text-gray-300">
              Seu Nome
            </label>
            <input
              id="ownerName"
              type="text"
              required
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-[#161616] px-4 py-3 text-white placeholder-gray-500 focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
              placeholder="João Silva"
            />
          </div>

          <div>
            <label htmlFor="ownerEmail" className="block text-sm font-medium text-gray-300">
              E-mail
            </label>
            <input
              id="ownerEmail"
              type="email"
              required
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-[#161616] px-4 py-3 text-white placeholder-gray-500 focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
              placeholder="joao@domcorte.com"
            />
          </div>

          <div>
            <label htmlFor="ownerPassword" className="block text-sm font-medium text-gray-300">
              Senha
            </label>
            <input
              id="ownerPassword"
              type="password"
              required
              value={ownerPassword}
              onChange={(e) => setOwnerPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-[#161616] px-4 py-3 text-white placeholder-gray-500 focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
              placeholder="Mínimo 8 caracteres"
              minLength={8}
            />
          </div>

          <details className="rounded-lg border border-white/10 bg-[#161616] p-4">
            <summary className="cursor-pointer text-sm font-medium text-gray-300">
              Cores (opcional)
            </summary>
            <div className="mt-3 space-y-3">
              <div>
                <label htmlFor="primaryColor" className="block text-xs text-gray-400">
                  Primária
                </label>
                <input
                  id="primaryColor"
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="mt-1 h-10 w-full rounded border border-white/10 bg-[#0a0a0a]"
                />
              </div>
              <div>
                <label htmlFor="secondaryColor" className="block text-xs text-gray-400">
                  Secundária
                </label>
                <input
                  id="secondaryColor"
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="mt-1 h-10 w-full rounded border border-white/10 bg-[#0a0a0a]"
                />
              </div>
              <div>
                <label htmlFor="accentColor" className="block text-xs text-gray-400">
                  Destaque
                </label>
                <input
                  id="accentColor"
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="mt-1 h-10 w-full rounded border border-white/10 bg-[#0a0a0a]"
                />
              </div>
            </div>
          </details>

          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#D4AF37] px-4 py-3 font-semibold text-black transition-transform hover:bg-[#C5A028] active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Criando conta...
              </span>
            ) : (
              "Criar Conta"
            )}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500">
          Já tem conta?{" "}
          <Link href="/admin/login" className="text-[#D4AF37] hover:underline">
            Faça login
          </Link>
        </p>
      </div>
    </div>
  );
}
