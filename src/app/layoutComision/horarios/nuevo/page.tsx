"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NuevoEventoPage() {
  const [form, setForm] = useState({
    title: "",
    img: "",
    description: "",
    date: "",
    time: "",
    location: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/events/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error guardando evento");
      router.push("/layoutComision/horarios"); // redirige a la lista
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Error");
      }
      setSaving(false);
    }
  }

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#E85D6A] px-4 py-6">
      <form
        onSubmit={onSubmit}
        className="mx-auto max-w-md space-y-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
      >
        <h1 className="text-xl font-bold">Nuevo evento</h1>

        <div>
          <label className="text-sm font-semibold">Título</label>
          <input
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-semibold">Fecha</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-semibold">Hora</label>
            <input
              type="time"
              value={form.time}
              onChange={(e) => set("time", e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold">Lugar</label>
          <input
            value={form.location}
            onChange={(e) => set("location", e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-semibold">Descripción</label>
          <textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            rows={3}
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-semibold">Imagen (URL)</label>
          <input
            value={form.img}
            onChange={(e) => set("img", e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="/bannerGenerico.png"
          />
        </div>

        {error && <p className="text-sm text-red-700">{error}</p>}

        <div className="flex gap-2">
          <button
            disabled={saving}
            className="rounded-md bg-black px-4 py-2 text-sm font-semibold text-white"
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-md border px-4 py-2 text-sm"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}