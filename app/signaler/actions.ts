"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { wilayaParCode } from "@/lib/wilayas";
import { ajouterSignalement, modeEcriture } from "@/lib/sheets";

const Signalement = z.object({
  code: z.string().regex(/^\d{2}$/),
  commune: z.string().trim().max(80),
  nom: z.string().trim().min(3).max(120),
  adresse: z.string().trim().min(5).max(240),
  tel: z.string().trim().max(30),
});

/**
 * Jamais dans le dataset public : le signalement part dans l'onglet `signalements` (ou un webhook,
 * ou les logs). Un bénévole le relit dans /admin puis le publie tel quel, ou le rejette.
 */
export async function signaler(form: FormData) {
  const page = form.get("lang") === "fr" ? "/fr/signaler" : "/signaler";
  // Robot : on fait comme si, on jette.
  if (form.get("site")) redirect(`${page}?envoye=1`);
  const r = Signalement.safeParse(Object.fromEntries(form));
  if (!r.success) redirect(`${page}?erreur=1`);

  const recu = new Date().toISOString();
  const d = r.data;
  const payload = { ...d, recu };

  // 1. Onglet `signalements` du Sheet (Apps Script ou compte de service). 2. Webhook. 3. Logs Vercel, à défaut.
  if (modeEcriture()) {
    try {
      await ajouterSignalement({ recu, code: d.code, wilaya: wilayaParCode(d.code)?.nom ?? "", commune: d.commune, nom: d.nom, adresse: d.adresse, tel: d.tel, statut: "à traiter", lang: String(form.get("lang") ?? "ar") });
    } catch (e) {
      console.error("[signaler] Sheet inaccessible, signalement loggué :", e, JSON.stringify(payload));
    }
  } else if (process.env.SIGNALEMENT_WEBHOOK_URL) {
    const res = await fetch(process.env.SIGNALEMENT_WEBHOOK_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) console.error("[signaler] webhook", res.status, JSON.stringify(payload));
  } else {
    // ponytail: sans Sheet ni webhook, les logs Vercel sont le seul chemin vers un humain — nom et téléphone compris.
    console.log("[signalement]", JSON.stringify(payload));
  }
  redirect(`${page}?envoye=1`);
}
