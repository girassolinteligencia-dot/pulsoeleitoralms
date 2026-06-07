import type { Metadata } from "next";
import { Outfit, Roboto } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { FooterGI } from "@/components/ui/FooterGI";
import "./globals.css";

const outfit = Outfit({ 
  subsets: ["latin"], 
  variable: "--font-outfit" 
});

const roboto = Roboto({ 
  subsets: ["latin"], 
  weight: ["400", "500", "700"],
  variable: "--font-roboto" 
});

export const metadata: Metadata = {
  title: "PULSOMS.IA | Percepção Pública de Mato Grosso do Sul",
  description: "Plataforma de inteligência e percepção pública de Mato Grosso do Sul. Avalie políticos, órgãos e serviços públicos.",
  icons: {
    icon: [
      { url: "/favicon.webp", type: "image/webp" },
    ],
    apple: "/favicon.webp",
  },
  openGraph: {
    images: [{ url: "/logo.webp" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${outfit.variable} ${roboto.variable}`}>
      <body className="antialiased bg-[#141413] text-[#f5f0e8] overflow-x-hidden">
        {children}
        <FooterGI />
        <SpeedInsights />
      </body>
    </html>
  );
}
