"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const ACCESS_STORAGE_KEY = "fiestas-matet-horarios-access";
export const HORARIOS_ACCESS_PASSWORD = "1234";

export function useHorariosAccess() {
  const [accessGranted, setAccessGranted] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);

  useEffect(() => {
    setAccessGranted(window.localStorage.getItem(ACCESS_STORAGE_KEY) === "granted");
    setCheckingAccess(false);
  }, []);

  function grantAccess() {
    window.localStorage.setItem(ACCESS_STORAGE_KEY, "granted");
    setAccessGranted(true);
  }

  return { accessGranted, checkingAccess, grantAccess };
}

export function HorariosAccessPanel({ onAccessGranted }: { onAccessGranted: () => void }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password === HORARIOS_ACCESS_PASSWORD) {
      window.localStorage.setItem(ACCESS_STORAGE_KEY, "granted");
      onAccessGranted();
      return;
    }

    setError(true);
    router.replace("/");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7F3E8] px-4 text-[#17352C]">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-lg border border-[#17352C]/15 bg-white p-5 shadow-sm">
        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#17352C]/55">Comision de fiestas</p>
        <h1 className="mt-2 text-5xl uppercase leading-none" style={{ fontFamily: "var(--font-bebas-neue)" }}>
          Horarios
        </h1>
        <label className="mt-5 block">
          <span className="mb-1 block text-sm font-black">Contraseña</span>
          <input
            autoFocus
            inputMode="numeric"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-12 w-full rounded-lg border border-[#17352C]/25 px-3 text-lg"
          />
        </label>
        <button type="submit" className="mt-4 h-12 w-full rounded-lg bg-[#17352C] px-4 font-black text-white">
          Entrar
        </button>
        {error && <p className="mt-3 text-sm font-bold text-[#B42318]">Contraseña incorrecta.</p>}
      </form>
    </main>
  );
}
