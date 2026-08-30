import { fraicheur, getPoints, type Point, type Rapport } from "./points";

export type Fiche = Point & { f: ReturnType<typeof fraicheur> };
export type ParWilaya = Record<string, Fiche[]>;

/**
 * Une fiche datée de plus de 9 jours est exclue, pas grisée. Une fiche sans date
 * est gardée et marquée « non datée » (décision du 2026-08-30). Tri : datées d'abord, plus récentes en tête.
 */
export const visibles = (points: Point[]): Fiche[] =>
  points
    .map((p) => ({ ...p, f: fraicheur(p.maj) }))
    .filter((p) => p.f.niveau !== "perime")
    .sort((a, b) => b.maj.localeCompare(a.maj));

/** Toutes les fiches visibles, groupées par wilaya. Un seul appel réseau. */
export async function fichesParWilaya(): Promise<{ par: ParWilaya; rapport: Rapport }> {
  const rapport = await getPoints();
  const par: ParWilaya = {};
  for (const [code, pts] of Object.entries(rapport.points)) {
    const v = visibles(pts);
    if (v.length) par[code] = v;
  }
  return { par, rapport };
}
