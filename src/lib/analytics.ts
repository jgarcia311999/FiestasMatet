// src/lib/analytics.ts

// Tu ID de GA4
const GA_ID = "G-WCXW4MMGS7";

// Aseguramos que GA está disponible
declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (
      command: "config" | "event" | "set" | "js",
      targetId: string | Date,
      params?: Record<string, unknown>
    ) => void;
  }
}

// Inicializar GA (esto se llama una vez en el cliente)
export function initGA() {
  if (typeof window === "undefined") return; // Solo en cliente

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer.push(args);
  };

  window.gtag("js", new Date());
  window.gtag("config", GA_ID);
}

// Session ID único
function getSessionId() {
  let id = localStorage.getItem("session_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("session_id", id);
  }
  return id;
}

// Función general para enviar eventos
export function trackEvent(name: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;

  const url = window.location.pathname;
  const referrer = document.referrer || null;

  // Captura utm_* si están en la URL
  const searchParams = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};
  ["utm_source", "utm_medium", "utm_campaign"].forEach((key) => {
    if (searchParams.has(key)) {
      utm[key] = searchParams.get(key)!;
    }
  });

  window.gtag("event", name, {
    session_id: getSessionId(),
    url,
    referrer,
    ...utm,
    ...params,
  });
}