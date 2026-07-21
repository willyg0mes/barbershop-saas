"use client";

import { getPlatformMe, updatePlatformProfile, type PlatformAdmin } from "@/lib/platform-api";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function PlatformAccountPage() {
  const [admin, setAdmin] = useState<PlatformAdmin | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    getPlatformMe()
      .then((data) => {
        setAdmin(data);
        setName(data.name);
        setEmail(data.email);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Erro ao carregar"))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const body: {
        name?: string;
        email?: string;
        current_password?: string;
        password?: string;
        password_confirmation?: string;
      } = {
        name,
        email,
      };

      if (password) {
        body.current_password = currentPassword;
        body.password = password;
        body.password_confirmation = passwordConfirmation;
      }

      const updated = await updatePlatformProfile(body);
      setAdmin(updated);
      setName(updated.name);
      setEmail(updated.email);
      setCurrentPassword("");
      setPassword("");
      setPasswordConfirmation("");
      setSuccess("Conta atualizada com sucesso.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Minha conta</h2>
        <p className="text-sm text-gray-400">
          Altere o e-mail e a senha do seu acesso à plataforma quando precisar.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-white/10 bg-[#111] p-5">
        <div>
          <label className="mb-1 block text-sm text-gray-300">Nome</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-lg border border-white/10 bg-[#161616] px-4 py-3 text-white focus:border-[#D4AF37] focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-300">E-mail</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-lg border border-white/10 bg-[#161616] px-4 py-3 text-white focus:border-[#D4AF37] focus:outline-none"
          />
        </div>

        <div className="border-t border-white/10 pt-4">
          <p className="mb-3 text-sm text-gray-400">Trocar senha (opcional)</p>
          <div className="space-y-3">
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Senha atual"
              className="w-full rounded-lg border border-white/10 bg-[#161616] px-4 py-3 text-white placeholder-gray-500 focus:border-[#D4AF37] focus:outline-none"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nova senha"
              className="w-full rounded-lg border border-white/10 bg-[#161616] px-4 py-3 text-white placeholder-gray-500 focus:border-[#D4AF37] focus:outline-none"
            />
            <input
              type="password"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              placeholder="Confirmar nova senha"
              className="w-full rounded-lg border border-white/10 bg-[#161616] px-4 py-3 text-white placeholder-gray-500 focus:border-[#D4AF37] focus:outline-none"
            />
          </div>
        </div>

        {error ? (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        ) : null}
        {success ? (
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
            {success}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={saving || !admin}
          className="w-full rounded-lg bg-[#D4AF37] px-4 py-3 font-semibold text-black hover:bg-[#C5A028] disabled:opacity-50"
        >
          {saving ? "Salvando..." : "Salvar alterações"}
        </button>
      </form>
    </div>
  );
}
