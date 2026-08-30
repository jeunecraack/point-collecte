"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { egal, jetonAdmin, origineSite } from "@/lib/secret";
import { ONGLET, configSheets, idPoints, lireLigne, lireOnglet, lireSignalements, ajouterLigne, marquerSignalement, onglets, supprimerLigne as supprimerDansSheet } from "@/lib/sheets";
import { ligneSelonEntetes, memeLigne } from "@/lib/moderation";
import { invaliderCache } from "@/lib/points";

export async function estAdmin() {
  const s = process.env.ADMIN_SECRET;
  const c = (await cookies()).get("admin")?.value ?? "";
  return !!s && egal(c, jetonAdmin(s));
}

export async function connexion(form: FormData) {
  const s = process.env.ADMIN_SECRET;
  const saisi = String(form.get("secret") ?? "");
  if (!s || !egal(saisi, s)) {
    // Frein : chaque échec coûte 800 ms et une invocation. Avec un secret aléatoire de 32 octets, la force brute est hors de portée.
    await new Promise((r) => setTimeout(r, 800));
    redirect("/admin?refuse=1");
  }
  (await cookies()).set("admin", jetonAdmin(s), { httpOnly: true, secure: true, sameSite: "strict", path: "/admin", maxAge: 12 * 3600 });
  redirect("/admin");
}

/** Le bouton appelle /api/revalidate sur l'origine de confiance, sans exposer le secret au navigateur. */
export async function revalider() {
  if (!(await estAdmin())) redirect("/admin?refuse=1");
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) redirect("/admin?revalide=sans-secret");
  const res = await fetch(`${origineSite()}/api/revalidate`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ secret }),
  }).catch(() => null);
  redirect(`/admin?revalide=${res?.ok ? "ok" : "echec"}`);
}

export async function deconnexion() {
  (await cookies()).delete({ name: "admin", path: "/admin" });
  redirect("/admin");
}

/** Après une écriture : cache des points vidé, pages régénérées, retour à l'admin avec un message. */
async function apresEcriture(message: string) {
  invaliderCache();
  const secret = process.env.REVALIDATE_SECRET;
  if (secret) await fetch(`${origineSite()}/api/revalidate`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ secret }) }).catch(() => null);
  redirect(`/admin?fait=${encodeURIComponent(message)}`);
}

const echec = (e: unknown) => redirect(`/admin?echec=${encodeURIComponent(e instanceof Error ? e.message : String(e))}`);

/** Onglet des points = le premier onglet du Sheet public (celui que l'export CSV publie). */
async function ongletPoints() {
  const id = idPoints();
  if (!id) throw new Error("SHEET_CSV_URL sans identifiant de Sheet");
  const [premier] = await onglets(id);
  if (!premier) throw new Error("Sheet sans onglet");
  return { id, ...premier };
}

/** Un signalement validé devient une ligne de l'onglet des points, rangée selon les en-têtes des bénévoles. */
export async function publierSignalement(form: FormData) {
  if (!(await estAdmin())) redirect("/admin?refuse=1");
  const ligne = Number(form.get("ligne"));
  try {
    const sig = (await lireSignalements()).find((s) => s.ligne === ligne);
    if (!sig) throw new Error(`signalement ligne ${ligne} introuvable`);
    if (sig.statut && sig.statut !== "à rappeler") throw new Error(`déjà traité : ${sig.statut}`);
    const pts = await ongletPoints();
    const entetes = await lireLigne(pts.id, pts.title, 1);
    const { ligne: valeurs, perdues } = ligneSelonEntetes(entetes, {
      wilaya: sig.wilaya.toUpperCase() || sig.code,
      commune: sig.commune,
      nom: sig.nom,
      adresse: sig.adresse,
      tel: sig.tel,
      maj: new Date().toISOString().slice(0, 10),
      source: "admin",
    });
    await ajouterLigne(pts.id, pts.title, valeurs);
    await marquerSignalement(ligne, "publié");
    await apresEcriture(`Publié : ${sig.nom || sig.adresse}${perdues.length ? ` (colonnes absentes du Sheet : ${perdues.join(", ")})` : ""}`);
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e; // redirect()
    echec(e);
  }
}

export async function rejeterSignalement(form: FormData) {
  if (!(await estAdmin())) redirect("/admin?refuse=1");
  const ligne = Number(form.get("ligne"));
  try {
    await marquerSignalement(ligne, "rejeté");
  } catch (e) {
    echec(e);
  }
  redirect(`/admin?fait=${encodeURIComponent(`Signalement ligne ${ligne} rejeté`)}`);
}

/**
 * Suppression d'une ligne de l'onglet des points (doublure ou ligne rejetée). Garde-fou : la ligne est
 * relue dans le Sheet et doit contenir ce qui était affiché ; sinon rien n'est supprimé.
 */
export async function supprimerLignePoints(form: FormData) {
  if (!(await estAdmin())) redirect("/admin?refuse=1");
  const ligne = Number(form.get("ligne"));
  const attendus = String(form.get("attendus") ?? "").split("\u0001").filter(Boolean);
  try {
    if (!Number.isInteger(ligne) || ligne < 2) throw new Error("ligne invalide");
    const pts = await ongletPoints();
    const relue = await lireLigne(pts.id, pts.title, ligne);
    if (!memeLigne(relue, attendus)) throw new Error(`la ligne ${ligne} du Sheet ne correspond plus à ce qui était affiché — rien n'a été supprimé, rafraîchissez`);
    await supprimerDansSheet(pts.id, pts.sheetId, ligne);
    await apresEcriture(`Ligne ${ligne} supprimée`);
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e;
    echec(e);
  }
}

/** Lien qui ouvre le Sheet directement sur une ligne. Sans compte de service : premier onglet (gid 0). */
export async function lienLigne(ligne: number) {
  const id = idPoints();
  if (!id) return null;
  let gid = 0;
  if (configSheets()) {
    try {
      gid = (await onglets(id))[0]?.sheetId ?? 0;
    } catch {
      gid = 0;
    }
  }
  return `https://docs.google.com/spreadsheets/d/${id}/edit#gid=${gid}&range=A${ligne}`;
}
