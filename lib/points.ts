import { readFile } from "node:fs/promises";
import path from "node:path";
import Papa from "papaparse";
import { z } from "zod";

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
  horaires: str(),
  besoins: str(),
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
  if (/^\d{9}$/.test(chiffres)) return "0" + chiffres;
  return chiffres;
}

export type Rapport = {
  points: ParDept;
  total: number;
  rejets: { ligne: number; raison: string }[];
  origine: "sheet" | "repo";
};

export function parserCsv(texte: string, origine: Rapport["origine"]): Rapport {
  const { data } = Papa.parse<Record<string, string>>(texte, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  });

  const points: ParDept = {};
  const rejets: Rapport["rejets"] = [];
  let total = 0;

  data.forEach((brut, i) => {
    const r = PointSchema.safeParse(brut);
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
