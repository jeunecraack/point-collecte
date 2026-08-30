import type { Metadata, Viewport } from "next";
import "./globals.css";

const site = process.env.NEXT_PUBLIC_SITE_URL;

export const metadata: Metadata = {
  metadataBase: site ? new URL(site) : undefined,
  icons: { icon: "/favicon.ico", apple: "/apple-touch-icon.png" },
  openGraph: { type: "website", images: [{ url: "/og.jpg", width: 1200, height: 630 }] },
  title: "نقاط جمع التبرعات — حرائق الجزائر",
  description: "أين تودع تبرعاتك، الآن، في ولايتك. عناوين مؤكدة ومؤرخة.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#006233",
};

// Arabe d'abord : racine RTL ; les routes /fr posent dir="ltr" lang="fr" sur leur conteneur.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
