import type { Metadata } from "next";
import { Outfit, Roboto } from "next/font/google";
import { FooterGI } from "@/components/ui/FooterGI";
import { getDbAsync } from "@/server/db/client";
import { asString, getParametros } from "@/server/repos/parametros";
import { getFotoUrl } from "@/lib/fotoUrl";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-roboto",
});

async function getSiteIdentidade() {
  try {
    const m = await getParametros(await getDbAsync(), [
      "geral_favicon_url",
      "geral_og_imagem_tipo",
      "geral_og_imagem_url",
      "geral_og_frase",
    ]);
    const faviconUrl =
      getFotoUrl(asString(m.get("geral_favicon_url"))) || "/favicon.webp";
    const ogTipo = asString(m.get("geral_og_imagem_tipo"), "logo");
    const ogCustomUrl =
      getFotoUrl(asString(m.get("geral_og_imagem_url"))) || "";
    const ogFrase =
      asString(m.get("geral_og_frase")) ||
      "Plataforma de inteligência e percepção pública de Mato Grosso do Sul. Avalie políticos, órgãos e serviços públicos.";
    const ogImageUrl =
      ogTipo === "favicon"
        ? faviconUrl
        : ogTipo === "custom" && ogCustomUrl
          ? ogCustomUrl
          : "/logo.webp";
    return { faviconUrl, ogImageUrl, ogFrase };
  } catch {
    return {
      faviconUrl: "/favicon.webp",
      ogImageUrl: "/logo.webp",
      ogFrase:
        "Plataforma de inteligência e percepção pública de Mato Grosso do Sul. Avalie políticos, órgãos e serviços públicos.",
    };
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const { faviconUrl, ogImageUrl, ogFrase } = await getSiteIdentidade();
  return {
    title: "PULSOMS.IA | Percepção Pública de Mato Grosso do Sul",
    description: ogFrase,
    icons: {
      icon: [{ url: faviconUrl }],
      apple: faviconUrl,
    },
    openGraph: {
      images: [{ url: ogImageUrl }],
      description: ogFrase,
    },
  };
}

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
      </body>
    </html>
  );
}
