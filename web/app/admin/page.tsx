"use client";

import {
  getSettings,
  updateSettings,
  getServices,
  createService,
  updateService,
  getWeeklyHours,
  getScheduleBreaks,
  createScheduleBreak,
  deleteScheduleBreak,
  getClosedDates,
  createClosedDate,
  deleteClosedDate,
  getBarbers,
  updateBarber,
  getFinanceSummary,
  type OwnerSettings,
  type AdminService,
  type WeeklyHour,
  type AdminScheduleBreak,
  type AdminClosedDate,
  type AdminBarber,
  type FinanceSummary,
} from "@/lib/admin-api";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Loader2,
  LogOut,
  Calendar,
  Settings,
  Scissors,
  Clock,
  Shield,
  Users,
  TrendingUp,
  Copy,
  Check,
  X,
  Plus,
} from "lucide-react";
import { format } from "date-fns";

type Tab = "resumo" | "marca" | "servicos" | "horarios" | "politicas" | "equipe" | "relatorios";

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("resumo");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [settings, setSettings] = useState<OwnerSettings | null>(null);
  const [services, setServices] = useState<AdminService[]>([]);
  const [weeklyHours, setWeeklyHours] = useState<WeeklyHour[]>([]);
  const [scheduleBreaks, setScheduleBreaks] = useState<AdminScheduleBreak[]>([]);
  const [closedDates, setClosedDates] = useState<AdminClosedDate[]>([]);
  const [barbers, setBarbers] = useState<AdminBarber[]>([]);
  const [financeSummary, setFinanceSummary] = useState<FinanceSummary | null>(null);

  const [copied, setCopied] = useState(false);
  const slug = typeof window !== "undefined" ? localStorage.getItem("owner_tenant") : null;
  const bookingUrl = settings?.booking_url || (slug ? `https://app.wynext.online/${slug}` : "");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (activeTab === "resumo" || activeTab === "marca" || activeTab === "politicas") {
        const s = await getSettings();
        setSettings(s);
      }
      if (activeTab === "servicos") {
        const svc = await getServices();
        setServices(svc);
      }
      if (activeTab === "horarios") {
        const wh = await getWeeklyHours();
        const sb = await getScheduleBreaks();
        const cd = await getClosedDates();
        setWeeklyHours(wh);
        setScheduleBreaks(sb);
        setClosedDates(cd);
      }
      if (activeTab === "equipe") {
        const b = await getBarbers();
        setBarbers(b);
      }
      if (activeTab === "relatorios") {
        const today = format(new Date(), "yyyy-MM-dd");
        const fs = await getFinanceSummary(today);
        setFinanceSummary(fs);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("owner_token")) {
      router.replace("/admin/login");
      return;
    }
    void loadData();
  }, [activeTab, loadData, router]);

  const handleLogout = () => {
    localStorage.removeItem("owner_token");
    localStorage.removeItem("owner_tenant");
    router.push("/admin/login");
  };

  const copyBookingUrl = () => {
    navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 3000);
  };

  const saveSettings = async (updates: Partial<OwnerSettings>) => {
    setSaving(true);
    setError("");
    try {
      await updateSettings(updates);
      showSuccess("Salvo com sucesso!");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateService = async () => {
    const name = prompt("Nome do serviço:");
    if (!name) return;
    const duration = prompt("Duração (minutos):", "30");
    if (!duration) return;
    const price = prompt("Preço (R$):", "50");
    if (!price) return;

    setSaving(true);
    try {
      await createService({
        name,
        duration_minutes: parseInt(duration, 10),
        price_cents: Math.round(parseFloat(price) * 100),
      });
      showSuccess("Serviço criado!");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleService = async (id: number, isActive: boolean) => {
    try {
      await updateService(id, { is_active: !isActive });
      showSuccess(isActive ? "Desativado" : "Ativado");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    }
  };

  const handleCreateBreak = async () => {
    const label = prompt("Nome da pausa (ex: Almoço):", "Almoço");
    if (!label) return;
    const start = prompt("Início (HH:MM):", "12:00");
    if (!start) return;
    const end = prompt("Fim (HH:MM):", "13:00");
    if (!end) return;

    setSaving(true);
    try {
      await createScheduleBreak({ label, start_time: start, end_time: end });
      showSuccess("Pausa criada!");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBreak = async (id: number) => {
    if (!confirm("Remover bloqueio?")) return;
    try {
      await deleteScheduleBreak(id);
      showSuccess("Removido!");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    }
  };

  const handleCreateClosedDate = async () => {
    const date = prompt("Data fechada (YYYY-MM-DD):");
    if (!date) return;

    setSaving(true);
    try {
      await createClosedDate({ date });
      showSuccess("Data fechada!");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClosedDate = async (id: number) => {
    if (!confirm("Remover data fechada?")) return;
    try {
      await deleteClosedDate(id);
      showSuccess("Removido!");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    }
  };

  const tabs: Array<{ id: Tab; label: string; icon: LucideIcon }> = [
    { id: "resumo", label: "Resumo", icon: Calendar },
    { id: "marca", label: "Marca", icon: Settings },
    { id: "servicos", label: "Serviços", icon: Scissors },
    { id: "horarios", label: "Horários", icon: Clock },
    { id: "politicas", label: "Políticas", icon: Shield },
    { id: "equipe", label: "Equipe", icon: Users },
    { id: "relatorios", label: "Relatórios", icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <header className="border-b border-white/10 bg-[#161616]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold text-[#D4AF37]">Admin · {slug}</h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-400 hover:bg-white/5 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6">
        <nav className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-[#D4AF37] text-black"
                    : "bg-[#161616] text-gray-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {error && (
          <div className="mb-4 flex items-center justify-between rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
            <button onClick={() => setError("")} className="ml-2">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-400">
            <Check className="h-4 w-4" />
            {success}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="space-y-6">
            {activeTab === "resumo" && (
              <div className="space-y-4">
                <div className="rounded-lg border border-white/10 bg-[#161616] p-6">
                  <h2 className="mb-4 text-lg font-semibold">Link de Agendamento</h2>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={bookingUrl}
                      className="flex-1 rounded-lg border border-white/10 bg-[#0a0a0a] px-4 py-2 text-sm text-gray-300"
                    />
                    <button
                      onClick={copyBookingUrl}
                      className="flex items-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-medium text-black hover:bg-[#C5A028]"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {copied ? "Copiado" : "Copiar"}
                    </button>
                  </div>
                  <div className="mt-4">
                    <p className="mb-2 text-sm text-gray-400">QR Code:</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(bookingUrl)}`}
                      alt="QR Code"
                      className="rounded-lg border border-white/10"
                      width={200}
                      height={200}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "marca" && settings && (
              <div className="space-y-4">
                <div className="rounded-lg border border-white/10 bg-[#161616] p-6">
                  <h2 className="mb-4 text-lg font-semibold">Identidade Visual</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300">Nome</label>
                      <input
                        type="text"
                        value={settings.name || ""}
                        onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-4 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300">Logo URL</label>
                      <input
                        type="text"
                        value={settings.logo_url || ""}
                        onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-4 py-2 text-white"
                        placeholder="https://..."
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300">Primária</label>
                        <input
                          type="color"
                          value={settings.primary_color || "#D4AF37"}
                          onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                          className="mt-1 h-10 w-full rounded border border-white/10 bg-[#0a0a0a]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300">Secundária</label>
                        <input
                          type="color"
                          value={settings.secondary_color || "#FFD700"}
                          onChange={(e) => setSettings({ ...settings, secondary_color: e.target.value })}
                          className="mt-1 h-10 w-full rounded border border-white/10 bg-[#0a0a0a]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300">Destaque</label>
                        <input
                          type="color"
                          value={settings.accent_color || "#C5A028"}
                          onChange={(e) => setSettings({ ...settings, accent_color: e.target.value })}
                          className="mt-1 h-10 w-full rounded border border-white/10 bg-[#0a0a0a]"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => saveSettings({
                        name: settings.name,
                        logo_url: settings.logo_url,
                        primary_color: settings.primary_color,
                        secondary_color: settings.secondary_color,
                        accent_color: settings.accent_color,
                      })}
                      disabled={saving}
                      className="w-full rounded-lg bg-[#D4AF37] px-4 py-2 font-semibold text-black hover:bg-[#C5A028] disabled:opacity-50"
                    >
                      {saving ? "Salvando..." : "Salvar Marca"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "servicos" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Serviços</h2>
                  <button
                    onClick={handleCreateService}
                    className="flex items-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-medium text-black hover:bg-[#C5A028]"
                  >
                    <Plus className="h-4 w-4" />
                    Novo
                  </button>
                </div>
                <div className="space-y-2">
                  {services.map((svc) => (
                    <div
                      key={svc.id}
                      className="flex items-center justify-between rounded-lg border border-white/10 bg-[#161616] p-4"
                    >
                      <div>
                        <p className="font-medium">{svc.name}</p>
                        <p className="text-sm text-gray-400">
                          {svc.duration_minutes} min · R$ {(svc.price_cents / 100).toFixed(2)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleToggleService(svc.id, svc.is_active)}
                        className={`rounded px-3 py-1 text-xs font-medium ${
                          svc.is_active
                            ? "bg-green-500/20 text-green-400"
                            : "bg-gray-500/20 text-gray-400"
                        }`}
                      >
                        {svc.is_active ? "Ativo" : "Inativo"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "horarios" && (
              <div className="space-y-6">
                <div>
                  <h2 className="mb-4 text-lg font-semibold">Horário Semanal</h2>
                  <div className="space-y-2">
                    {weeklyHours.map((wh) => (
                      <div key={wh.day_of_week} className="rounded-lg border border-white/10 bg-[#161616] p-4">
                        <p className="text-sm font-medium text-gray-300">
                          {["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"][wh.day_of_week]}
                        </p>
                        <p className="text-xs text-gray-500">
                          {wh.open_time && wh.close_time
                            ? `${wh.open_time} - ${wh.close_time}`
                            : "Fechado"}
                          {wh.break_start && wh.break_end && ` (Pausa: ${wh.break_start} - ${wh.break_end})`}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Pausas diárias</h2>
                    <button
                      onClick={handleCreateBreak}
                      className="flex items-center gap-2 rounded-lg bg-[#D4AF37] px-3 py-1.5 text-sm font-medium text-black hover:bg-[#C5A028]"
                    >
                      <Plus className="h-4 w-4" />
                      Nova
                    </button>
                  </div>
                  <div className="space-y-2">
                    {scheduleBreaks.length === 0 && (
                      <p className="text-sm text-gray-500">Nenhuma pausa cadastrada.</p>
                    )}
                    {scheduleBreaks.map((sb) => (
                      <div
                        key={sb.id}
                        className="flex items-center justify-between rounded-lg border border-white/10 bg-[#161616] p-3"
                      >
                        <p className="text-sm">
                          {sb.label}: {sb.start_time} → {sb.end_time}
                        </p>
                        <button
                          onClick={() => handleDeleteBreak(sb.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Datas Fechadas</h2>
                    <button
                      onClick={handleCreateClosedDate}
                      className="flex items-center gap-2 rounded-lg bg-[#D4AF37] px-3 py-1.5 text-sm font-medium text-black hover:bg-[#C5A028]"
                    >
                      <Plus className="h-4 w-4" />
                      Nova
                    </button>
                  </div>
                  <div className="space-y-2">
                    {closedDates.map((cd) => (
                      <div
                        key={cd.id}
                        className="flex items-center justify-between rounded-lg border border-white/10 bg-[#161616] p-3"
                      >
                        <p className="text-sm">{cd.date}</p>
                        <button
                          onClick={() => handleDeleteClosedDate(cd.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "politicas" && settings && (
              <div className="space-y-4">
                <div className="rounded-lg border border-white/10 bg-[#161616] p-6">
                  <h2 className="mb-4 text-lg font-semibold">Políticas de Agendamento</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300">
                        Antecedência mínima (minutos)
                      </label>
                      <input
                        type="number"
                        value={settings.booking_lead_minutes || 0}
                        onChange={(e) => setSettings({ ...settings, booking_lead_minutes: parseInt(e.target.value, 10) })}
                        className="mt-1 w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-4 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300">
                        Cancelamento (horas de aviso)
                      </label>
                      <input
                        type="number"
                        value={settings.cancellation_hours_notice || 0}
                        onChange={(e) => setSettings({ ...settings, cancellation_hours_notice: parseInt(e.target.value, 10) })}
                        className="mt-1 w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-4 py-2 text-white"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={settings.commission_enabled || false}
                        onChange={(e) => setSettings({ ...settings, commission_enabled: e.target.checked })}
                        className="h-4 w-4"
                      />
                      <label className="text-sm font-medium text-gray-300">Comissão habilitada</label>
                    </div>
                    {settings.commission_enabled && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300">
                          Comissão (%)
                        </label>
                        <input
                          type="number"
                          value={settings.commission_percent || 0}
                          onChange={(e) => setSettings({ ...settings, commission_percent: parseFloat(e.target.value) })}
                          className="mt-1 w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-4 py-2 text-white"
                        />
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={settings.show_barber_photos || false}
                        onChange={(e) => setSettings({ ...settings, show_barber_photos: e.target.checked })}
                        className="h-4 w-4"
                      />
                      <label className="text-sm font-medium text-gray-300">Mostrar fotos dos barbeiros</label>
                    </div>
                    <button
                      onClick={() => saveSettings({
                        booking_lead_minutes: settings.booking_lead_minutes,
                        cancellation_hours_notice: settings.cancellation_hours_notice,
                        commission_enabled: settings.commission_enabled,
                        commission_percent: settings.commission_percent,
                        show_barber_photos: settings.show_barber_photos,
                      })}
                      disabled={saving}
                      className="w-full rounded-lg bg-[#D4AF37] px-4 py-2 font-semibold text-black hover:bg-[#C5A028] disabled:opacity-50"
                    >
                      {saving ? "Salvando..." : "Salvar Políticas"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "equipe" && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Equipe</h2>
                <p className="text-sm text-gray-400">
                  Defina a foto (URL) de cada barbeiro. A exibição no chat depende da política “Mostrar fotos”.
                </p>
                <div className="space-y-2">
                  {barbers.map((b) => (
                    <div key={b.id} className="rounded-lg border border-white/10 bg-[#161616] p-4">
                      <div className="flex items-start gap-3">
                        {b.avatar_url ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={b.avatar_url}
                            alt={b.name}
                            className="h-12 w-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-sm text-gray-400">
                            {b.name?.charAt(0) || "?"}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">{b.name}</p>
                          <p className="text-sm text-gray-400">
                            {b.email} · {b.role}
                          </p>
                          <div className="mt-2 flex gap-2">
                            <input
                              type="url"
                              defaultValue={b.avatar_url || ""}
                              placeholder="URL da foto"
                              id={`avatar-${b.id}`}
                              className="flex-1 rounded-lg border border-white/10 bg-[#0a0a0a] px-3 py-2 text-sm text-white"
                            />
                            <button
                              onClick={async () => {
                                const input = document.getElementById(`avatar-${b.id}`) as HTMLInputElement | null;
                                const avatarUrl = input?.value?.trim() || null;
                                setSaving(true);
                                try {
                                  await updateBarber(b.id, { avatar_url: avatarUrl });
                                  showSuccess("Foto atualizada!");
                                  await loadData();
                                } catch (err) {
                                  setError(err instanceof Error ? err.message : "Erro");
                                } finally {
                                  setSaving(false);
                                }
                              }}
                              disabled={saving}
                              className="rounded-lg bg-[#D4AF37] px-3 py-2 text-sm font-medium text-black hover:bg-[#C5A028] disabled:opacity-50"
                            >
                              Salvar
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {barbers.length === 0 && (
                    <p className="text-sm text-gray-500">Nenhum barbeiro ativo. Cadastre pelo app mobile.</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === "relatorios" && financeSummary && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Relatórios Financeiros (Hoje)</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border border-white/10 bg-[#161616] p-6">
                    <p className="text-sm text-gray-400">Total concluído</p>
                    <p className="text-2xl font-bold">
                      R$ {((financeSummary.total_revenue_cents || 0) / 100).toFixed(2)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-[#161616] p-6">
                    <p className="text-sm text-gray-400">Concluídos</p>
                    <p className="text-2xl font-bold">{financeSummary.completed_count || 0}</p>
                  </div>
                </div>
                {financeSummary.by_barber && financeSummary.by_barber.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-sm font-medium text-gray-300">Por Barbeiro</h3>
                    <div className="space-y-2">
                      {financeSummary.by_barber.map((bb) => (
                        <div key={bb.id} className="rounded-lg border border-white/10 bg-[#161616] p-4">
                          <p className="font-medium">{bb.name}</p>
                          <p className="text-sm text-gray-400">
                            R$ {(bb.revenue_cents / 100).toFixed(2)} · {bb.completed_count}{" "}
                            agendamento{bb.completed_count !== 1 ? "s" : ""}
                            {bb.commission_cents > 0 && (
                              <span className="ml-2 text-[#D4AF37]">
                                (Comissão: R$ {(bb.commission_cents / 100).toFixed(2)})
                              </span>
                            )}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
