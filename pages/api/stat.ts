import type { NextApiRequest, NextApiResponse } from "next";
import { nettoyer } from "@/lib/stat";

/** POST { type: "question", sans_wilaya, lang, q? } → une ligne « [stat] … » dans les logs. Réponse vide. */
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const stat = nettoyer(req.body);
  if (!stat) return res.status(400).end();
  console.log("[stat]", JSON.stringify(stat));
  return res.status(204).end();
}
