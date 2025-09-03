"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NuevoEventoPage() {
  type FormState = {
    title: string;
    img: string;
    description: string;
    date: string; // YYYY-MM-DD
    time: string; // HH:MM
    location: string;
    provisional: boolean;
  };
  const [form, setForm] = useState<FormState>({
    title: "",
    img: "",
    description: "",
    date: "",
    time: "",
    location: "",
    provisional: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validaciones mínimas
    const title = form.title.trim();
    if (!title) {
      setError("El título es obligatorio");
      return;
    }
    if (!form.date || !form.time) {
      setError("Indica fecha y hora");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/events/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title,
          img: form.img.trim(),
          description: form.description.trim(),
          date: form.date,
          time: form.time,
          location: form.location.trim(),
          provisional: form.provisional,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error guardando evento");
      router.push("/layoutComision/horarios?justSaved=1");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Error");
      }
      setSaving(false);
    }
  }

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#E85D6A] px-4 py-6 text-[#0C2335]">
      <form
        onSubmit={onSubmit}
        className="mx-auto max-w-md space-y-3 rounded-xl border border-gray-200 bg-[#E85D6A] p-4 shadow-sm text-[#0C2335]"
      >
        <h1 className="text-xl font-bold">Nuevo evento</h1>

        <div>
          <label className="text-sm font-semibold">Título</label>
          <input
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm bg-[#E85D6A] text-[#0C2335]"
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
              className="w-full rounded-md border px-3 py-2 text-sm bg-[#E85D6A] text-[#0C2335]"
              required
            />
          </div>
          <div>
            <label className="text-sm font-semibold">Hora</label>
            <input
              type="time"
              value={form.time}
              onChange={(e) => set("time", e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm bg-[#E85D6A] text-[#0C2335]"
              required
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold">Lugar</label>
          <input
            value={form.location}
            onChange={(e) => set("location", e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm bg-[#E85D6A] text-[#0C2335]"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="provisional"
            type="checkbox"
            checked={form.provisional}
            onChange={(e) => set("provisional", e.target.checked)}
            className="h-4 w-4 border"
          />
          <label htmlFor="provisional" className="text-sm font-semibold">Provisional</label>
        </div>

        <div>
          <label className="text-sm font-semibold">Descripción</label>
          <textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            rows={3}
            className="w-full rounded-md border px-3 py-2 text-sm bg-[#E85D6A] text-[#0C2335]"
          />
        </div>

        <div>
          <label className="text-sm font-semibold">Imagen (URL)</label>
          <input
            value={form.img}
            onChange={(e) => set("img", e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm bg-[#E85D6A] text-[#0C2335]"
            placeholder="/bannerGenerico.png"
          />
        </div>

        {error && <p className="text-sm text-red-700">{error}</p>}

        <div className="flex gap-2">
          <button
            disabled={saving || !form.title.trim() || !form.date || !form.time}
            className="rounded-md bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
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