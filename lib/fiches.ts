import { fraicheur, getPoints, type Point, type Rapport } from "./points";

export type Fiche = Point & { f: ReturnType<typeof fraicheur> };
export type ParWilaya = Record<string, Fiche[]>;

/** Invariant 5 : une fiche de plus de 9 jours est exclue, pas grisée. Tri : plus récente d'abord. */
export const visibles = (points: Point[]): Fiche[] =>
  points
    .map((p) => ({ ...p, f: fraicheur(p.maj) }))
    .filter((p) => p.f.niveau === "frais" || p.f.niveau === "tiede")
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
