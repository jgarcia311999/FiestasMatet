export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[#0C2335]/30 bg-[#E7DAD1]">
      <div className="mx-auto max-w-sm px-1 py-6 text-[#0C2335]">
        <div className="grid grid-cols-2 gap-4 text-[10px] leading-relaxed">
          <div>
            <span className="uppercase tracking-[0.2em]">© {year} Matet</span>
            <br />
            Contáctanos a través de{" "}
            <a
              href="https://www.instagram.com/comisionmatet2026/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:opacity-70"
            >
              Instagram
            </a>
          </div>
          <div className="flex flex-col items-center justify-center uppercase tracking-[0.2em] text-center">
            <span>Produced by:</span>
            <a href="/login" className="no-underline text-inherit cursor-default">
              La comisión
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}