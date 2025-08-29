import Link from "next/link";
export default function Home2Page() {
  return (
    <main className="min-h-screen bg-[#E7DAD1]">
      <div className="mx-auto max-w-sm px-1 pb-2 pt-7 text-black">

        <div className="flex items-end justify-between mt-2">
          <h1 className="text-[64px] leading-none font-semibold">MATET</h1>
          <img src="/logoMatet.png" alt="Logo Matet" className="h-30 w-30 object-contain" />
        </div>
        <div className="border-t border-[#0C2335] mt-3" />

        {/* Meta info flex row (example, not changed) */}
        <div className="mt-4 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-[0.2em]">Produced by:</span>
          <span className="text-[10px] uppercase tracking-[0.2em]">LA COMISIÓN</span>
        </div>

        {/* New Production/Video block */}
        <div className="mt-6 flex items-end justify-end">
          <span className="text-[64px] leading-none font-semibold">FIESTAS</span>
        </div>
        <div className="border-t border-[#0C2335] mt-3" />

        {/* Duplicated Produced by row (modified) */}
        <div className="mt-6 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-[0.2em]">Disfruta de nuestro</span>
          <span className="text-[10px] uppercase tracking-[0.2em]">mayor tesoro</span>
        </div>

        <div className="mt-0 flex items-start justify-between">
          <div className="text-[84px] leading-none font-semibold mt-2">2026</div>
        </div>

        {/* Card */}
        <Link href="/proximas">
          <div className="mt-8 relative h-[250px] rounded-3xl bg-[#E85D6A] overflow-hidden">
            <div className="absolute top-3 left-4 text-[10px] uppercase tracking-[0.2em]">Enterate de todas las actividades</div>

            {/* Giant word behind */}
            <div className="absolute bottom-[-6px] left-4 right-4 text-[80px] leading-none font-semibold text-[#0C2335]/90 select-none">
              Proximas
            </div>

            {/* Center circle with arrow */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-28 w-28 rounded-full border border-[#0C2335] flex items-center justify-center mb-6 text-[#0C2335]">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <line x1="3" y1="21" x2="21" y2="3" stroke="currentColor" strokeWidth="2"/>
                  <polyline points="6,3 21,3 21,18" stroke="currentColor" strokeWidth="2" fill="none"/>
                </svg>
              </div>
            </div>
          </div>
        </Link>

        {/* Card */}
        <div className="mt-8 relative h-[250px] rounded-3xl bg-[#083279] overflow-hidden">
          <div className="absolute top-3 left-4 text-[10px] uppercase tracking-[0.2em] text-[#FFD966]">No llegues hasta el amanecer</div>

          {/* Giant word behind */}
          <div className="absolute bottom-[-6px] left-4 right-4 text-[80px] leading-none font-semibold text-[#FFD966]/90 select-none">
            Noche
          </div>

          {/* Center circle with arrow */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-28 w-28 rounded-full border border-[#FFD966] flex items-center justify-center text-[#FFD966] mb-6">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <line x1="3" y1="21" x2="21" y2="3" stroke="currentColor" strokeWidth="2"/>
                <polyline points="6,3 21,3 21,18" stroke="currentColor" strokeWidth="2" fill="none"/>
              </svg>
            </div>
          </div>
        </div>

        {/* New Card */}
        <div className="mt-8 relative h-[250px] rounded-3xl bg-[#a3b18a] overflow-hidden">
          <div className="absolute top-3 left-4 text-[10px] uppercase tracking-[0.2em]">Para que disfrute toda la familia</div>

          {/* Giant word behind */}
          <div className="absolute bottom-[-6px] left-4 right-4 text-[80px] leading-none font-semibold text-[#0C2335]/90 select-none">
            Peques
          </div>

          {/* Center circle with arrow */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-28 w-28 rounded-full border border-[#0C2335] flex items-center justify-center mb-6 text-[#0C2335]">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <line x1="3" y1="21" x2="21" y2="3" stroke="currentColor" strokeWidth="2"/>
                <polyline points="6,3 21,3 21,18" stroke="currentColor" strokeWidth="2" fill="none"/>
              </svg>
            </div>
          </div>
        </div>

        <div className="mt-8 mb-8 text-right text-[12px] uppercase tracking-[0.2em] text-[#0C2335]">
          Busca por fecha →
        </div>
      </div>
    </main>
  );
}
