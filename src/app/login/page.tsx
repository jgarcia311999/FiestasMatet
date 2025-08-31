

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#E7DAD1]">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-sm">
        <h1 className="text-xl font-bold mb-6 text-center text-[#0C2335]">Login</h1>
        <form className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[#0C2335]">
              Email
            </label>
            <input
              type="email"
              id="email"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#0C2335] focus:border-[#0C2335]"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[#0C2335]">
              Password
            </label>
            <input
              type="password"
              id="password"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#0C2335] focus:border-[#0C2335]"
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
      </div>
    </div>
  );
}