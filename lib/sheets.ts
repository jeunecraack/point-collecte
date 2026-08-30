import { createSign } from "node:crypto";

/**
 * Écriture dans Google Sheets via un compte de service, sans dépendance :
 * JWT RS256 signé avec node:crypto → jeton d'accès → append. Aucune lecture.
 *
 * Variables : GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY (clé PEM, \n échappés acceptés),
 * SIGNALEMENTS_SHEET_ID (défaut : le Sheet public — préférer un Sheet privé, voir README).
 */
const SCOPE = "https://www.googleapis.com/auth/spreadsheets";
const b64url = (s: string | Buffer) => Buffer.from(s).toString("base64url");

export function jwtCompteDeService(email: string, clePem: string, maintenant = Math.floor(Date.now() / 1000)) {
  const entete = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const corps = b64url(
    JSON.stringify({ iss: email, scope: SCOPE, aud: "https://oauth2.googleapis.com/token", iat: maintenant, exp: maintenant + 3600 }),
  );
  const signature = createSign("RSA-SHA256").update(`${entete}.${corps}`).sign(clePem.replace(/\\n/g, "\n"), "base64url");
  return `${entete}.${corps}.${signature}`;
}

export function configSheets() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const cle = process.env.GOOGLE_PRIVATE_KEY;
  const id = process.env.SIGNALEMENTS_SHEET_ID ?? idDepuisUrl(process.env.SHEET_CSV_URL);
  return email && cle && id ? { email, cle, id } : null;
}

export const idDepuisUrl = (url?: string) => url?.match(/\/spreadsheets\/d\/([A-Za-z0-9_-]+)/)?.[1];

async function jetonAcces(email: string, cle: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwtCompteDeService(email, cle) }),
  });
  if (!res.ok) throw new Error(`token HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return ((await res.json()) as { access_token: string }).access_token;
}

const API = "https://sheets.googleapis.com/v4/spreadsheets";
export const ONGLET = "signalements";
export const ENTETES = ["recu", "code", "wilaya", "commune", "nom", "adresse", "tel", "horaires", "contact_nom", "contact_tel", "statut", "lang"];

/** Ajoute une ligne à l'onglet `signalements` ; crée l'onglet avec sa ligne d'en-têtes s'il n'existe pas. */
export async function ajouterSignalement(ligne: (string | number)[]) {
  const cfg = configSheets();
  if (!cfg) throw new Error("compte de service non configuré");
  const jeton = await jetonAcces(cfg.email, cfg.cle);
  const h = { authorization: `Bearer ${jeton}`, "content-type": "application/json" };

  const meta = await fetch(`${API}/${cfg.id}?fields=sheets.properties.title`, { headers: h });
  if (!meta.ok) throw new Error(`lecture HTTP ${meta.status}: ${(await meta.text()).slice(0, 200)}`);
  const titres = ((await meta.json()) as { sheets?: { properties: { title: string } }[] }).sheets?.map((s) => s.properties.title) ?? [];
  if (!titres.includes(ONGLET)) {
    const cree = await fetch(`${API}/${cfg.id}:batchUpdate`, {
      method: "POST",
      headers: h,
      body: JSON.stringify({ requests: [{ addSheet: { properties: { title: ONGLET } } }] }),
    });
    if (!cree.ok) throw new Error(`création onglet HTTP ${cree.status}: ${(await cree.text()).slice(0, 200)}`);
    await append(cfg.id, h, [ENTETES]);
  }
  await append(cfg.id, h, [ligne]);
}

async function append(id: string, h: Record<string, string>, values: (string | number)[][]) {
  const res = await fetch(`${API}/${id}/values/${encodeURIComponent(`'${ONGLET}'!A1`)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`, {
    method: "POST",
    headers: h,
    body: JSON.stringify({ values }),
  });
  if (!res.ok) throw new Error(`append HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
}
