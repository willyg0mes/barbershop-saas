"use client";

export default function OnboardingClosedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] p-4">
      <div className="max-w-md space-y-4 text-center">
        <p className="text-xs uppercase tracking-[0.25em] text-[#D4AF37]">Wynext</p>
        <h1 className="text-2xl font-bold text-white">Cadastro fechado</h1>
        <p className="text-sm text-gray-400">
          Novas barbearias são criadas apenas pelo administrador da plataforma.
          Se você já tem conta, use o painel admin da sua barbearia.
        </p>
      </div>
    </div>
  );
}
