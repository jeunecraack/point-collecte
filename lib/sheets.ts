import { createSign } from "node:crypto";

/**
 * Écriture dans le Sheet — deux transports, même interface :
 *  - « script » : l'Apps Script collé dans le Sheet (scripts/apps-script.gs), SHEET_SCRIPT_URL + SHEET_SCRIPT_SECRET.
 *    Agit avec l'identité du propriétaire, aucune console Google Cloud.
 *  - « compte » : un compte de service et l'API Sheets, GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_PRIVATE_KEY.
 * Sans l'un ni l'autre, l'admin reste en lecture et les signalements vont dans les logs.
 * Le Sheet reste la seule source de vérité : on y ajoute, marque ou supprime des lignes, rien d'autre.
 */
export type Ecriture = "script" | "compte" | null;
// Valeurs collées dans Vercel avec un retour à la ligne ou des guillemets : on nettoie.
const propre = (v?: string) => (v ?? "").trim().replace(/^["']|["']$/g, "");
export function modeEcriture(): Ecriture {
  if (propre(process.env.SHEET_SCRIPT_URL) && propre(process.env.SHEET_SCRIPT_SECRET)) return "script";
  if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY && idPoints()) return "compte";
  return null;
}

export const idDepuisUrl = (url?: string) => url?.match(/\/spreadsheets\/d\/([A-Za-z0-9_-]+)/)?.[1];
export const idPoints = () => idDepuisUrl(process.env.SHEET_CSV_URL);
const idSignalements = () => process.env.SIGNALEMENTS_SHEET_ID || idPoints();

export const ONGLET = "signalements";
export const ENTETES = ["recu", "code", "wilaya", "commune", "nom", "adresse", "tel", "statut", "lang"] as const;
type Champ = (typeof ENTETES)[number];
export type Signalement = Record<Champ, string> & { ligne: number };

// ============================================================ transport « script »
async function script<T = Record<string, unknown>>(action: string, params: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(propre(process.env.SHEET_SCRIPT_URL), {
    method: "POST",
    // text/plain : Apps Script lit e.postData.contents tel quel ; la réponse arrive après une redirection 302.
    headers: { "content-type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ secret: propre(process.env.SHEET_SCRIPT_SECRET), action, ...params }),
    redirect: "follow",
  });
  const texte = await res.text();
  let j: { ok?: boolean; erreur?: string } & T;
  try {
    j = JSON.parse(texte);
  } catch {
    throw new Error(`Apps Script : réponse illisible (HTTP ${res.status}) — le script est-il déployé en « Tout le monde » ?`);
  }
  if (!j.ok) throw new Error(`Apps Script : ${j.erreur ?? "échec"}`);
  return j;
}

// ============================================================ transport « compte de service »
const SCOPE = "https://www.googleapis.com/auth/spreadsheets";
const API = "https://sheets.googleapis.com/v4/spreadsheets";
const b64url = (s: string | Buffer) => Buffer.from(s).toString("base64url");

export function jwtCompteDeService(email: string, clePem: string, maintenant = Math.floor(Date.now() / 1000)) {
  const entete = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const corps = b64url(
    JSON.stringify({ iss: email, scope: SCOPE, aud: "https://oauth2.googleapis.com/token", iat: maintenant, exp: maintenant + 3600 }),
  );
  const signature = createSign("RSA-SHA256").update(`${entete}.${corps}`).sign(clePem.replace(/\\n/g, "\n"), "base64url");
  return `${entete}.${corps}.${signature}`;
}

let jeton: { valeur: string; expire: number } | null = null;
async function jetonAcces() {
  if (jeton && Date.now() < jeton.expire) return jeton.valeur;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwtCompteDeService(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!, process.env.GOOGLE_PRIVATE_KEY!),
    }),
  });
  if (!res.ok) throw new Error(`token HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const j = (await res.json()) as { access_token: string; expires_in: number };
  jeton = { valeur: j.access_token, expire: Date.now() + (j.expires_in - 120) * 1000 };
  return jeton.valeur;
}

async function api<T = unknown>(chemin: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API}/${chemin}`, {
    ...init,
    headers: { authorization: `Bearer ${await jetonAcces()}`, "content-type": "application/json", ...(init.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`Sheets ${init.method ?? "GET"} ${chemin.split("?")[0]} → HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return (await res.json()) as T;
}

type Onglet = { sheetId: number; title: string };
const onglets = async (id: string): Promise<Onglet[]> =>
  (await api<{ sheets?: { properties: Onglet }[] }>(`${id}?fields=sheets.properties(sheetId,title)`)).sheets?.map((s) => s.properties) ?? [];
const plage = (titre: string, a1: string) => encodeURIComponent(`'${titre.replace(/'/g, "''")}'!${a1}`);
const apiLire = async (id: string, titre: string, a1: string) => (await api<{ values?: string[][] }>(`${id}/values/${plage(titre, a1)}`)).values ?? [];
const apiAjouter = (id: string, titre: string, valeurs: string[]) =>
  api(`${id}/values/${plage(titre, "A1")}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`, { method: "POST", body: JSON.stringify({ values: [valeurs] }) });
const apiEcrire = (id: string, titre: string, a1: string, valeur: string) =>
  api(`${id}/values/${plage(titre, a1)}?valueInputOption=RAW`, { method: "PUT", body: JSON.stringify({ values: [[valeur]] }) });
const apiSupprimer = (id: string, sheetId: number, ligne: number) =>
  api(`${id}:batchUpdate`, { method: "POST", body: JSON.stringify({ requests: [{ deleteDimension: { range: { sheetId, dimension: "ROWS", startIndex: ligne - 1, endIndex: ligne } } }] }) });
const apiCreer = (id: string, titre: string) =>
  api(`${id}:batchUpdate`, { method: "POST", body: JSON.stringify({ requests: [{ addSheet: { properties: { title: titre } } }] }) });

async function premierOnglet() {
  const id = idPoints();
  if (!id) throw new Error("SHEET_CSV_URL sans identifiant de Sheet");
  const [o] = await onglets(id);
  if (!o) throw new Error("Sheet sans onglet");
  return { id, ...o };
}
async function feuilleSignalements(creer: boolean) {
  const id = idSignalements();
  if (!id) throw new Error("Sheet des signalements inconnu");
  const existe = (await onglets(id)).some((o) => o.title === ONGLET);
  if (!existe && creer) {
    await apiCreer(id, ONGLET);
    await apiAjouter(id, ONGLET, [...ENTETES]);
  }
  return existe || creer ? id : null;
}

// ============================================================ interface unifiée
const exige = () => {
  const m = modeEcriture();
  if (!m) throw new Error("aucun transport d'écriture configuré (SHEET_SCRIPT_URL ou compte de service)");
  return m;
};
const chaines = (v: unknown[]) => v.map((x) => (x == null ? "" : String(x)));

/** Identifiant de l'onglet des points, pour les liens « ouvrir sur la ligne N ». */
export async function gidPoints(): Promise<number> {
  return exige() === "script" ? Number((await script<{ gid: number }>("info")).gid) : (await premierOnglet()).sheetId;
}

export async function entetesPoints(): Promise<string[]> {
  if (exige() === "script") return chaines((await script<{ valeurs: unknown[] }>("entetesPoints")).valeurs);
  const p = await premierOnglet();
  return (await apiLire(p.id, p.title, "A1:Z1"))[0] ?? [];
}

export async function lireLignePoints(ligne: number): Promise<string[]> {
  if (exige() === "script") return chaines((await script<{ valeurs: unknown[] }>("lireLigne", { onglet: "points", ligne })).valeurs);
  const p = await premierOnglet();
  return (await apiLire(p.id, p.title, `A${ligne}:Z${ligne}`))[0] ?? [];
}

export async function ajouterPoint(valeurs: string[]) {
  if (exige() === "script") return void (await script("ajouterPoint", { ligne: valeurs }));
  const p = await premierOnglet();
  await apiAjouter(p.id, p.title, valeurs);
}

/** Supprime physiquement une ligne de l'onglet des points (1 = en-tête). */
export async function supprimerLignePoints(ligne: number) {
  if (exige() === "script") return void (await script("supprimerLigne", { ligne }));
  const p = await premierOnglet();
  await apiSupprimer(p.id, p.sheetId, ligne);
}

/**
 * Ajoute un signalement en rangeant chaque valeur sous la colonne qui porte son nom : un onglet créé
 * avec d'anciennes colonnes (contact_nom…) continue de fonctionner, les colonnes inconnues restent vides.
 */
export async function ajouterSignalement(sig: Partial<Record<Champ, string>>) {
  const mode = exige();
  let entetes: string[] = [];
  if (mode === "script") entetes = chaines((await script<{ valeurs: unknown[] }>("lireLigne", { onglet: "signalements", ligne: 1 })).valeurs);
  else {
    const id = (await feuilleSignalements(true))!;
    entetes = (await apiLire(id, ONGLET, "A1:Z1"))[0] ?? [];
  }
  if (!entetes.length) entetes = [...ENTETES]; // onglet encore absent : le script le crée avec ses en-têtes
  const cles = entetes.map((h) => h.trim().toLowerCase());
  const ligne = cles.map((c) => sig[c as Champ] ?? "");
  if (mode === "script") return void (await script("ajouterSignalement", { ligne }));
  await apiAjouter((await feuilleSignalements(true))!, ONGLET, ligne);
}

/** Tous les signalements, avec leur numéro de ligne. Onglet absent → liste vide. */
export async function lireSignalements(): Promise<Signalement[]> {
  let brut: string[][];
  if (exige() === "script") brut = ((await script<{ valeurs: unknown[][] }>("lireSignalements")).valeurs ?? []).map(chaines);
  else {
    const id = await feuilleSignalements(false);
    brut = id ? await apiLire(id, ONGLET, "A1:Z10000") : [];
  }
  const [entetes, ...lignes] = brut;
  if (!entetes) return [];
  const idx = Object.fromEntries(ENTETES.map((e) => [e, entetes.findIndex((h) => h.trim().toLowerCase() === e)])) as Record<Champ, number>;
  return lignes
    .map((l, i) => {
      const s = { ligne: i + 2 } as Signalement;
      for (const e of ENTETES) s[e] = idx[e] >= 0 ? (l[idx[e]] ?? "").trim() : "";
      return s;
    })
    .filter((s) => s.nom || s.adresse);
}

export async function marquerSignalement(ligne: number, statut: string) {
  if (exige() === "script") return void (await script("marquerSignalement", { ligne, statut }));
  const id = await feuilleSignalements(false);
  if (!id) throw new Error("onglet signalements absent");
  const entetes = ((await apiLire(id, ONGLET, "A1:Z1"))[0] ?? []).map((h) => h.trim().toLowerCase());
  const col = entetes.indexOf("statut");
  if (col < 0) throw new Error("colonne statut absente");
  await apiEcrire(id, ONGLET, `${String.fromCharCode(65 + col)}${ligne}`, statut);
}
