import type { Metadata } from "next";
import { Poppins, Lora } from "next/font/google";
import "./globals.css";

const poppins = Poppins({ 
  subsets: ["latin"], 
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-poppins" 
});

const lora = Lora({ 
  subsets: ["latin"], 
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-lora" 
});

export const metadata: Metadata = {
  title: "PulsoEleitoral | Mato Grosso do Sul 2026",
  description: "Plataforma pública de avaliação cidadã de candidatos políticos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${poppins.variable} ${lora.variable}`}>
      <body className="antialiased bg-[#141413] text-[#f5f0e8]">{children}</body>
    </html>
  );
}
