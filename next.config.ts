import type { NextConfig } from "next";

// script-src 'unsafe-inline' : l'App Router injecte des scripts inline (assistant, formulaire, admin).
// Les pages wilaya n'ont que du JSON-LD, qui ne s'exécute pas. Passer aux nonces via proxy.ts si le site devient une cible.
const securite = [
  {
    key: "Content-Security-Policy",
    value:
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data:; connect-src 'self'; font-src 'self'; object-src 'none'; " +
      "frame-ancestors 'none'; form-action 'self'; base-uri 'self'",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  env: {
    // Sheet public de production. Une variable SHEET_CSV_URL (Vercel, .env.local) l'emporte.
    // Vide = lecture de data/sheet-snapshot.csv, sinon data/points.csv.
    SHEET_CSV_URL:
      process.env.SHEET_CSV_URL ??
      "https://docs.google.com/spreadsheets/d/1NHAMyZjovSNqKitL7A4khV-FlrRQXoPLi2r9FyLMpbg/export?format=csv",
  },
  async headers() {
    return [{ source: "/(.*)", headers: securite }];
  },
};

export default config;
