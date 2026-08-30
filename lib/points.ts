import { readFile } from "node:fs/promises";
import path from "node:path";
import Papa from "papaparse";
import { z } from "zod";
import { findWilaya } from "./match";

const str = (d = "") => z.string().trim().default(d);

const PointSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{1,2}$/, "code wilaya invalide")
    .transform((s) => s.padStart(2, "0"))
    .refine((s) => Number(s) >= 1 && Number(s) <= 58, "hors 01-58"),
  nom: z.string().trim().min(3, "nom trop court"),
  type: str("Point de collecte"),
  commune: str(),
  adresse: str(),
  tel: str().transform(normaliserTel),
  tel2: str().transform(normaliserTel),
  tel3: str().transform(normaliserTel),
  // Lien Google Maps : accepté seulement sur les domaines Maps, sinon ignoré.
  maps: str().transform((v) => (/^https:\/\/(maps\.app\.goo\.gl|goo\.gl\/maps|(www\.)?google\.[a-z.]+\/maps|maps\.google\.[a-z.]+)\//i.test(v) ? v : "")),
  horaires: str(),
  besoins: str(),
  // Colonne `agree` (ou `agréé`) : toute valeur sauf vide / non / no / 0 → badge « Agréé par l'État ».
  agree: str().transform((v) => v !== "" && !/^(non|no|false|0|-)$/i.test(v)),
  maj: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "date attendue au format AAAA-MM-JJ"),
  // Provenance obligatoire : un point sans source nommee ne peut pas etre servi.
  source: z.string().trim().min(4, "source obligatoire : qui a verifie ce point ?"),
});

export type Point = z.infer<typeof PointSchema>;
export type ParDept = Record<string, Point[]>;

/**
 * Google Sheets traite 0555123456 comme un nombre et mange le zéro initial.
 * On le remet, et on normalise l'espacement pour que tel: fonctionne.
 */
function normaliserTel(raw: string): string {
  const chiffres = raw.replace(/[^\d+]/g, "");
  if (!chiffres) return "";
  if (/^\d{8,9}$/.test(chiffres)) return "0" + chiffres;
  return chiffres;
}

export type Rapport = {
  points: ParDept;
  total: number;
  rejets: { ligne: number; raison: string }[];
  origine: "sheet" | "repo";
};

/**
 * En-têtes acceptés en plus du modèle, tels que les bénévoles les écrivent.
 * Clé = en-tête plié (minuscules, sans accent) ; valeur = colonne du modèle.
 */
const ALIAS_COLONNES: Record<string, keyof Point> = {
  wilaya: "code",
  association: "nom",
  lieu: "nom",
  telephone: "tel",
  num: "tel",
  num1: "tel",
  num2: "tel2",
  num3: "tel3",
  "localisation maps": "maps",
  maps: "maps",
  lien: "maps",
  date: "maj",
  "date de verification": "maj",
  verifie: "source",
  "verifie par": "source",
  verificateur: "source",
};

const COLONNES = Object.keys(PointSchema.shape) as (keyof Point)[];

function remapper(brut: Record<string, string>): Record<string, string> {
  const r: Record<string, string> = Object.fromEntries(COLONNES.map((c) => [c, ""]));
  for (const [k, v] of Object.entries(brut)) {
    // « / » et « - » : convention des bénévoles pour « rien ».
    const val = (v ?? "").trim();
    r[ALIAS_COLONNES[k] ?? k] = /^[\/\-–—]+$/.test(val) ? "" : val;
  }
  // Pas d'association : le lieu (colonne Adresse) sert de nom, ex. une pharmacie ou une mosquée.
  if (!r.nom && r.adresse) r.nom = r.adresse;
  // « BEJAIA », « Tizi Ouzou », « بجاية » → code, via le même matching que l'assistant.
  if (r.code && !/^\s*\d{1,2}\s*$/.test(r.code)) r.code = findWilaya(r.code)?.code ?? r.code;
  return r;
}

export function parserCsv(texte: string, origine: Rapport["origine"]): Rapport {
  const { data } = Papa.parse<Record<string, string>>(texte, {
    header: true,
    skipEmptyLines: true,
    // « Agréé » → « agree » : les accents des en-têtes sont ignorés.
    transformHeader: (h) => h.trim().toLowerCase().normalize("NFD").replace(/\p{M}/gu, ""),
  });

  const points: ParDept = {};
  const rejets: Rapport["rejets"] = [];
  let total = 0;
  let wilayaPrecedente = "";

  data.forEach((brut, i) => {
    const ligne = remapper(brut);
    // Cellule Wilaya fusionnée dans le Sheet : vide à l'export → on hérite de la ligne au-dessus.
    if (!ligne.code.trim()) ligne.code = wilayaPrecedente;
    else wilayaPrecedente = ligne.code;
    const r = PointSchema.safeParse(ligne);
    if (!r.success) {
      const e = r.error.issues[0];
      rejets.push({ ligne: i + 2, raison: `${e.path.join(".")}: ${e.message}` });
      return;
    }
    (points[r.data.code] ??= []).push(r.data);
    total++;
  });

  return { points, total, rejets, origine };
}

async function lireRepo(): Promise<Rapport> {
  const p = path.join(process.cwd(), "data", "points.csv");
  return parserCsv(await readFile(p, "utf8"), "repo");
}

/**
 * Le Sheet est la source vive. S'il est injoignable, mal formé, ou vidé
 * par une mauvaise manipulation, on retombe sur le CSV du repo.
 * Invariant : ne jamais servir moins que le dernier état connu comme bon.
 */
export async function getPoints(): Promise<Rapport> {
  const url = process.env.SHEET_CSV_URL;
  if (!url) return lireRepo();

  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rapport = parserCsv(await res.text(), "sheet");

    if (rapport.total === 0) throw new Error("aucune ligne valide dans le Sheet");
    return rapport;
  } catch (e) {
    console.error("[points] Sheet indisponible, repli sur le repo:", e);
    return lireRepo();
  }
}

export async function getPointsWilaya(code: string): Promise<Point[]> {
  const { points } = await getPoints();
  return points[code.padStart(2, "0")] ?? [];
}

export async function getWilayasCouvertes(): Promise<string[]> {
  const { points } = await getPoints();
  return Object.keys(points).sort();
}

/** Âge d'une fiche, pour la pastille de fraîcheur. */
export function fraicheur(maj: string) {
  const jours = Math.floor((Date.now() - new Date(maj).getTime()) / 864e5);
  if (Number.isNaN(jours)) return { jours: -1, niveau: "inconnu" as const };
  if (jours <= 2) return { jours, niveau: "frais" as const };
  if (jours <= 9) return { jours, niveau: "tiede" as const };
  return { jours, niveau: "perime" as const };
}
