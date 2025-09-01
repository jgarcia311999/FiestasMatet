import { USERS } from "@/data/users";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import crypto from "crypto";

function expectedCookieValue() {
  const pass = process.env.INTRANET_PASS || "";
  const secret = process.env.SESSION_SECRET || "";
  return crypto.createHash("sha256").update(pass + secret).digest("hex");
}

async function loginAction(formData: FormData) {
  "use server";
  const username = ((formData.get("username") as string) || "").trim();
  const input = (formData.get("password") as string) || "";
  const next = (formData.get("next") as string) || "/layoutComision";

  // Check if username exists in USERS array
  const userExists = USERS && Array.isArray(USERS) && USERS.includes(username);
  if (!userExists) {
    redirect(`/login?error=1&next=${encodeURIComponent(next)}`);
  }

  const expected = process.env.INTRANET_PASS || "";

  // Comparación en tiempo constante aproximada (hash + timingSafeEqual)
  const ah = crypto.createHash("sha256").update(input).digest();
  const bh = crypto.createHash("sha256").update(expected).digest();
  const ok = ah.length === bh.length && crypto.timingSafeEqual(ah, bh);

  if (!ok) {
    redirect(`/login?error=1&next=${encodeURIComponent(next)}`);
  }

  const value = expectedCookieValue();
  const cookieStore = await cookies();
  cookieStore.set("commission_auth", value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  cookieStore.set("commission_user", username, {
    httpOnly: false, 
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect(next);
}

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { next?: string; error?: string };
}) {
  const next = searchParams?.next || "/layoutComision";
  const hasError = searchParams?.error === "1";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#E7DAD1]">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-sm">
        <h1 className="text-xl font-bold mb-6 text-center text-[#0C2335]">Login</h1>
        <form className="space-y-4" action={loginAction}>
          <input type="hidden" name="next" value={next} />
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-[#0C2335]">
              Nombre de usuario
            </label>
            <input
              type="text"
              id="username"
              name="username"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#0C2335] focus:border-[#0C2335] text-black"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[#0C2335]">
              Contraseña de la comisión
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#0C2335] focus:border-[#0C2335] text-black"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-[#0C2335] text-white py-2 px-4 rounded hover:bg-opacity-90"
          >
            Iniciar sesión
          </button>
        </form>
        {hasError && (
          <p className="mt-4 text-red-600 text-center">Credenciales incorrectas.</p>
        )}
      </div>
    </div>
  );
}