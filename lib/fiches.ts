import { fold } from "./match";
import { fraicheur, getPoints, type Point, type Rapport } from "./points";

export type Fiche = Point & { f: ReturnType<typeof fraicheur> };
export type ParWilaya = Record<string, Fiche[]>;

const tels = (p: Point) => [p.tel, p.tel2, p.tel3].filter(Boolean);

/**
 * Deux lignes décrivent le même point si (même nom, même commune) ou si elles partagent
 * un numéro de téléphone. La première (datée, ou la plus récente) reste ; ses champs vides
 * sont complétés par la doublure ; « agréé » gagne si l'une des deux l'est.
 */
export type Fusion = { gardee: number; doublure: number; nom: string; raison: string };

export function dedoublonner(points: Fiche[]): { fiches: Fiche[]; doublons: number; fusions: Fusion[] } {
  const fiches: Fiche[] = [];
  const fusions: Fusion[] = [];
  for (const p of points) {
    const cle = `${fold(p.nom)}|${fold(p.commune)}`;
    const nums = tels(p);
    const deja = fiches.find((q) => `${fold(q.nom)}|${fold(q.commune)}` === cle || tels(q).some((n) => nums.includes(n)));
    if (!deja) {
      fiches.push(p);
      continue;
    }
    const commun = tels(deja).find((n) => nums.includes(n));
    fusions.push({ gardee: deja.ligne, doublure: p.ligne, nom: deja.nom, raison: commun ? `même numéro ${commun}` : "même nom et même commune" });
    for (const k of ["adresse", "maps", "source", "commune"] as const) if (!deja[k] && p[k]) deja[k] = p[k];
    for (const n of nums) {
      if (tels(deja).includes(n)) continue;
      if (!deja.tel) deja.tel = n;
      else if (!deja.tel2) deja.tel2 = n;
      else if (!deja.tel3) deja.tel3 = n;
    }
    deja.agree = deja.agree || p.agree;
  }
  return { fiches, doublons: fusions.length, fusions };
}

/**
 * Une fiche datée de plus de 9 jours est exclue, pas grisée. Une fiche sans date
 * est gardée et marquée « non datée ». Tri : datées d'abord, plus récentes en tête. Puis dédoublonnage.
 */
export const visibles = (points: Point[]): Fiche[] =>
  dedoublonner(
    points
      .map((p) => ({ ...p, f: fraicheur(p.maj) }))
      .filter((p) => p.f.niveau !== "perime")
      .sort((a, b) => b.maj.localeCompare(a.maj)),
  ).fiches;

/** Toutes les fiches visibles, groupées par wilaya. Un seul appel réseau. */
export async function fichesParWilaya(): Promise<{ par: ParWilaya; rapport: Rapport; doublons: number; fusions: Fusion[] }> {
  const rapport = await getPoints();
  const par: ParWilaya = {};
  const fusions: Fusion[] = [];
  for (const [code, pts] of Object.entries(rapport.points)) {
    const tries = pts.map((p) => ({ ...p, f: fraicheur(p.maj) })).filter((p) => p.f.niveau !== "perime").sort((a, b) => b.maj.localeCompare(a.maj));
    const d = dedoublonner(tries);
    fusions.push(...d.fusions);
    if (d.fiches.length) par[code] = d.fiches;
  }
  return { par, rapport, doublons: fusions.length, fusions };
}
