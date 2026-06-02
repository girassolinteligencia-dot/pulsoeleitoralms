import Image from 'next/image';

export function FooterGI() {
  return (
    <footer className="w-full flex items-center justify-center gap-2 py-3 bg-[#0e0d0c] border-t border-[#2a2420]">
      <Image
        src="/gi-logo.png"
        alt="Girassol Inteligência"
        width={22}
        height={22}
        className="rounded-full opacity-90"
      />
      <span className="text-[10px] text-[#6b6158] uppercase tracking-[0.22em] font-bold">
        Desenvolvido por Girassol Inteligência 2026
      </span>
    </footer>
  );
}
