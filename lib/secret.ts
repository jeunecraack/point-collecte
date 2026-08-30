import { createHmac, timingSafeEqual } from "node:crypto";

/** Comparaison en temps constant ; longueurs différentes → faux, sans fuite de timing exploitable. */
export function egal(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Jeton de session dérivé du secret : le cookie ne contient jamais le secret lui-même. Changer le secret révoque tout. */
export const jetonAdmin = (secret: string) => createHmac("sha256", secret).update("session-admin").digest("hex");

/** Origine de confiance pour appeler ses propres routes — jamais l'en-tête Host de la requête. */
export const origineSite = () =>
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : `http://localhost:${process.env.PORT ?? 3000}`);
