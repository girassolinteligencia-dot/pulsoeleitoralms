import Image from 'next/image';
import Link from 'next/link';

export function FooterGI() {
  return (
    <footer className="w-full flex items-center justify-center gap-2 py-3 bg-[#0e0d0c] border-t border-[#2a2420]">
      <Link href="/admin" className="flex items-center gap-2 opacity-70 hover:opacity-100 transition-opacity">
        <Image
          src="/gi-logo.png"
          alt="Girassol Inteligência"
          width={22}
          height={22}
          className="rounded-full"
        />
        <span className="text-[8px] md:text-[9px] text-[#6b6158] uppercase tracking-[0.18em] font-bold">
          Desenvolvido por Girassol Inteligência 2026
        </span>
      </Link>
    </footer>
  );
}
