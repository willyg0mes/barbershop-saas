"use client";

import {
  createPlatformTenant,
  deletePlatformTenant,
  getPlatformTenant,
  listPlatformTenants,
  updatePlatformTenant,
  type PlatformTenant,
} from "@/lib/platform-api";
import { Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const emptyForm = {
  name: "",
  slug: "",
  owner_name: "",
  owner_email: "",
  owner_password: "",
  primary_color: "#D4AF37",
  secondary_color: "#1A1A1A",
  accent_color: "#C5A028",
  is_active: true,
};

export default function PlatformPage() {
  const [tenants, setTenants] = useState<PlatformTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PlatformTenant | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listPlatformTenants(search.trim() || undefined);
      setTenants(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = async (tenant: PlatformTenant) => {
    setError("");
    try {
      const full = await getPlatformTenant(tenant.id);
      setEditing(full);
      setForm({
        name: full.name,
        slug: full.slug,
        owner_name: full.owner?.name ?? "",
        owner_email: full.owner?.email ?? "",
        owner_password: "",
        primary_color: full.primary_color || "#D4AF37",
        secondary_color: full.secondary_color || "#1A1A1A",
        accent_color: full.accent_color || "#C5A028",
        is_active: full.is_active,
      });
      setModalOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar barbearia");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (editing) {
        await updatePlatformTenant(editing.id, {
          name: form.name,
          slug: form.slug,
          primary_color: form.primary_color,
          secondary_color: form.secondary_color,
          accent_color: form.accent_color,
          is_active: form.is_active,
          ...(form.owner_name ? { owner_name: form.owner_name } : {}),
          ...(form.owner_email ? { owner_email: form.owner_email } : {}),
          ...(form.owner_password ? { owner_password: form.owner_password } : {}),
        });
      } else {
        await createPlatformTenant(form);
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (tenant: PlatformTenant) => {
    if (!confirm(`Excluir a barbearia "${tenant.name}"? Esta ação não pode ser desfeita.`)) {
      return;
    }
    setError("");
    try {
      await deletePlatformTenant(tenant.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Barbearias</h2>
          <p className="text-sm text-gray-400">Crie, edite ou exclua tenants da plataforma</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2.5 text-sm font-semibold text-black hover:bg-[#C5A028]"
        >
          <Plus className="h-4 w-4" />
          Nova barbearia
        </button>
      </div>

      <div className="flex gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome ou slug..."
          className="w-full rounded-lg border border-white/10 bg-[#161616] px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-[#D4AF37] focus:outline-none"
        />
      </div>

      {error ? (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-[#D4AF37]" />
        </div>
      ) : tenants.length === 0 ? (
        <p className="py-12 text-center text-sm text-gray-500">Nenhuma barbearia encontrada.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-gray-400">
              <tr>
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Slug</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Status</th>
                <th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((tenant) => (
                <tr key={tenant.id} className="border-t border-white/10">
                  <td className="px-4 py-3">
                    <div className="font-medium">{tenant.name}</div>
                    <div className="text-xs text-gray-500 sm:hidden">{tenant.slug}</div>
                  </td>
                  <td className="hidden px-4 py-3 text-gray-400 sm:table-cell">{tenant.slug}</td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        tenant.is_active
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-red-500/15 text-red-400"
                      }`}
                    >
                      {tenant.is_active ? "Ativa" : "Inativa"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => void openEdit(tenant)}
                        className="rounded-lg border border-white/10 p-2 text-gray-300 hover:border-white/20 hover:text-white"
                        aria-label="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(tenant)}
                        className="rounded-lg border border-red-500/20 p-2 text-red-400 hover:bg-red-500/10"
                        aria-label="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-white/10 bg-[#111] p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {editing ? "Editar barbearia" : "Nova barbearia"}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <Field
                label="Nome da barbearia"
                value={form.name}
                onChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    name: v,
                    slug: editing ? f.slug : v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
                  }))
                }
                required
              />
              <Field
                label="Slug"
                value={form.slug}
                onChange={(v) => setForm((f) => ({ ...f, slug: v.toLowerCase() }))}
                required
              />
              <Field
                label="Nome do owner"
                value={form.owner_name}
                onChange={(v) => setForm((f) => ({ ...f, owner_name: v }))}
                required={!editing}
              />
              <Field
                label="E-mail do owner"
                type="email"
                value={form.owner_email}
                onChange={(v) => setForm((f) => ({ ...f, owner_email: v }))}
                required={!editing}
              />
              <Field
                label={editing ? "Nova senha do owner (opcional)" : "Senha do owner"}
                type="password"
                value={form.owner_password}
                onChange={(v) => setForm((f) => ({ ...f, owner_password: v }))}
                required={!editing}
              />
              <div className="grid grid-cols-3 gap-2">
                <Field
                  label="Primária"
                  type="color"
                  value={form.primary_color}
                  onChange={(v) => setForm((f) => ({ ...f, primary_color: v }))}
                />
                <Field
                  label="Secundária"
                  type="color"
                  value={form.secondary_color}
                  onChange={(v) => setForm((f) => ({ ...f, secondary_color: v }))}
                />
                <Field
                  label="Acento"
                  type="color"
                  value={form.accent_color}
                  onChange={(v) => setForm((f) => ({ ...f, accent_color: v }))}
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                />
                Barbearia ativa
              </label>

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-lg bg-[#D4AF37] px-4 py-3 font-semibold text-black hover:bg-[#C5A028] disabled:opacity-50"
              >
                {saving ? "Salvando..." : editing ? "Salvar alterações" : "Criar barbearia"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-400">{label}</label>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-lg border border-white/10 bg-[#161616] px-3 py-2.5 text-sm text-white focus:border-[#D4AF37] focus:outline-none ${
          type === "color" ? "h-11 p-1" : ""
        }`}
      />
    </div>
  );
}
