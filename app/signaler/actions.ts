"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

const Signalement = z.object({
  code: z.string().regex(/^\d{2}$/),
  commune: z.string().trim().max(80),
  nom: z.string().trim().min(3).max(120),
  adresse: z.string().trim().min(5).max(240),
  tel: z.string().trim().max(30),
  horaires: z.string().trim().max(120),
  besoins: z.string().trim().max(240),
  contact_nom: z.string().trim().min(2).max(80),
  contact_tel: z.string().trim().min(8).max(30),
});

/**
 * Jamais dans le dataset : le signalement part vers une file (webhook) ou, à défaut,
 * dans les logs. Un humain rappelle, vérifie, puis saisit la ligne dans le Sheet.
 */
export async function signaler(form: FormData) {
  const r = Signalement.safeParse(Object.fromEntries(form));
  if (!r.success) redirect("/signaler?erreur=1");

  const payload = { ...r.data, recu: new Date().toISOString() };
  const url = process.env.SIGNALEMENT_WEBHOOK_URL;
  if (url) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) console.error("[signaler] webhook", res.status);
  } else {
    // ponytail: pas de webhook configuré → les logs Vercel font office de file.
    console.log("[signalement]", JSON.stringify(payload));
  }
  redirect("/signaler?envoye=1");
}
