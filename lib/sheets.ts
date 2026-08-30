import { createSign } from "node:crypto";

/**
 * Google Sheets via un compte de service, sans dépendance : JWT RS256 signé avec node:crypto,
 * jeton d'accès mis en cache, puis quelques appels REST. Le Sheet reste la seule source de vérité :
 * l'admin ne fait qu'y ajouter, marquer ou supprimer des lignes.
 *
 * Variables : GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY (clé PEM, \n échappés acceptés),
 * SIGNALEMENTS_SHEET_ID (défaut : le Sheet public — préférer un Sheet privé, voir README).
 */
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

export const idDepuisUrl = (url?: string) => url?.match(/\/spreadsheets\/d\/([A-Za-z0-9_-]+)/)?.[1];

/** ID du Sheet public (onglet des points) et du Sheet des signalements (le même par défaut). */
export const idPoints = () => idDepuisUrl(process.env.SHEET_CSV_URL);
export function configSheets() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const cle = process.env.GOOGLE_PRIVATE_KEY;
  const id = process.env.SIGNALEMENTS_SHEET_ID || idPoints();
  return email && cle && id ? { email, cle, id } : null;
}

let jeton: { valeur: string; expire: number } | null = null;
async function jetonAcces() {
  const cfg = configSheets();
  if (!cfg) throw new Error("compte de service non configuré");
  if (jeton && Date.now() < jeton.expire) return jeton.valeur;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwtCompteDeService(cfg.email, cfg.cle) }),
  });
  if (!res.ok) throw new Error(`token HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const j = (await res.json()) as { access_token: string; expires_in: number };
  jeton = { valeur: j.access_token, expire: Date.now() + (j.expires_in - 120) * 1000 };
  return jeton.valeur;
}

async function appel<T = unknown>(chemin: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API}/${chemin}`, {
    ...init,
    headers: { authorization: `Bearer ${await jetonAcces()}`, "content-type": "application/json", ...(init.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`Sheets ${init.method ?? "GET"} ${chemin.split("?")[0]} → HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return (await res.json()) as T;
}

export type Onglet = { sheetId: number; title: string };
/** Onglets d'un Sheet. Le premier est celui que l'export CSV publie : c'est l'onglet des points. */
export async function onglets(id: string): Promise<Onglet[]> {
  const m = await appel<{ sheets?: { properties: Onglet }[] }>(`${id}?fields=sheets.properties(sheetId,title)`);
  return m.sheets?.map((s) => s.properties) ?? [];
}

const plage = (titre: string, a1: string) => encodeURIComponent(`'${titre.replace(/'/g, "''")}'!${a1}`);

export async function lireOnglet(id: string, titre: string): Promise<string[][]> {
  const r = await appel<{ values?: string[][] }>(`${id}/values/${plage(titre, "A1:Z10000")}`);
  return r.values ?? [];
}

export async function lireLigne(id: string, titre: string, ligne: number): Promise<string[]> {
  const r = await appel<{ values?: string[][] }>(`${id}/values/${plage(titre, `A${ligne}:Z${ligne}`)}`);
  return r.values?.[0] ?? [];
}

export async function ajouterLigne(id: string, titre: string, valeurs: (string | number)[]) {
  await appel(`${id}/values/${plage(titre, "A1")}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`, {
    method: "POST",
    body: JSON.stringify({ values: [valeurs] }),
  });
}

export async function ecrireCellule(id: string, titre: string, a1: string, valeur: string) {
  await appel(`${id}/values/${plage(titre, a1)}?valueInputOption=RAW`, { method: "PUT", body: JSON.stringify({ values: [[valeur]] }) });
}

/** Supprime physiquement une ligne (1 = en-tête). Les lignes suivantes remontent d'un cran. */
export async function supprimerLigne(id: string, sheetId: number, ligne: number) {
  await appel(`${id}:batchUpdate`, {
    method: "POST",
    body: JSON.stringify({ requests: [{ deleteDimension: { range: { sheetId, dimension: "ROWS", startIndex: ligne - 1, endIndex: ligne } } }] }),
  });
}

export async function creerOnglet(id: string, titre: string) {
  await appel(`${id}:batchUpdate`, { method: "POST", body: JSON.stringify({ requests: [{ addSheet: { properties: { title: titre } } }] }) });
}

// ---------------------------------------------------------------- signalements
export const ONGLET = "signalements";
export const ENTETES = ["recu", "code", "wilaya", "commune", "nom", "adresse", "tel", "contact_nom", "contact_tel", "statut", "lang"] as const;
type Champ = (typeof ENTETES)[number];
export type Signalement = Record<Champ, string> & { ligne: number };

/** Ajoute une ligne à l'onglet `signalements` ; crée l'onglet avec sa ligne d'en-têtes s'il n'existe pas. */
export async function ajouterSignalement(ligne: (string | number)[]) {
  const cfg = configSheets();
  if (!cfg) throw new Error("compte de service non configuré");
  if (!(await onglets(cfg.id)).some((o) => o.title === ONGLET)) {
    await creerOnglet(cfg.id, ONGLET);
    await ajouterLigne(cfg.id, ONGLET, [...ENTETES]);
  }
  await ajouterLigne(cfg.id, ONGLET, ligne);
}

/** Tous les signalements, avec leur numéro de ligne. Onglet absent → liste vide. */
export async function lireSignalements(): Promise<Signalement[]> {
  const cfg = configSheets();
  if (!cfg) return [];
  if (!(await onglets(cfg.id)).some((o) => o.title === ONGLET)) return [];
  const [entetes, ...lignes] = await lireOnglet(cfg.id, ONGLET);
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
  const cfg = configSheets();
  if (!cfg) throw new Error("compte de service non configuré");
  const entetes = (await lireLigne(cfg.id, ONGLET, 1)).map((h) => h.trim().toLowerCase());
  const col = entetes.indexOf("statut");
  if (col < 0) throw new Error("colonne statut absente");
  await ecrireCellule(cfg.id, ONGLET, `${String.fromCharCode(65 + col)}${ligne}`, statut);
}
