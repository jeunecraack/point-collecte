import type { NextApiRequest, NextApiResponse } from "next";
import { WILAYAS } from "@/lib/wilayas";
import { egal } from "@/lib/secret";

/**
 * POST { secret } → régénère l'accueil, les 58 pages wilaya et l'assistant.
 * API route Pages Router : `revalidatePath` (App Router) n'atteint pas les pages
 * ISR de `pages/`, `res.revalidate` atteint les deux.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const secret = process.env.REVALIDATE_SECRET;
  const fourni = typeof req.body?.secret === "string" ? req.body.secret : "";
  if (!secret || !egal(fourni, secret)) return res.status(401).send("non");

  const ar = ["/", "/assistant", ...WILAYAS.map(({ code }) => `/${code}`)];
  const chemins = [...ar, ...ar.map((p) => (p === "/" ? "/fr" : `/fr${p}`))];
  const r = await Promise.allSettled(chemins.map((p) => res.revalidate(p)));
  const echecs = chemins.filter((_, i) => r[i].status === "rejected");
  if (echecs.length) console.error("[revalidate] échecs:", echecs);
  return res.json({ ok: echecs.length === 0, revalides: chemins.length - echecs.length, echecs, at: new Date().toISOString() });
}
