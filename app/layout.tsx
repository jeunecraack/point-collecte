import type { Metadata, Viewport } from "next";
import "./globals.css";

const site = process.env.NEXT_PUBLIC_SITE_URL;

export const metadata: Metadata = {
  metadataBase: site ? new URL(site) : undefined,
  icons: { icon: "/favicon.ico", apple: "/apple-touch-icon.png" },
  openGraph: { type: "website", images: [{ url: "/og.jpg", width: 1200, height: 630 }] },
  title: "Points de collecte de dons — incendies Algérie",
  description:
    "Où déposer ses dons, maintenant, dans sa wilaya. Adresses vérifiées et datées.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#006233",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
