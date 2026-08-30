import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  env: {
    // Sheet public de production. Une variable SHEET_CSV_URL (Vercel, .env.local) l'emporte.
    // Vide = lecture de data/points.csv uniquement.
    SHEET_CSV_URL:
      process.env.SHEET_CSV_URL ??
      "https://docs.google.com/spreadsheets/d/1NHAMyZjovSNqKitL7A4khV-FlrRQXoPLi2r9FyLMpbg/export?format=csv",
  },
};

export default config;
