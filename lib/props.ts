import type { GetStaticProps } from "next";
import { WILAYAS, wilayaParCode, type Wilaya } from "./wilayas";
import { getPointsWilaya } from "./points";
import { fichesParWilaya, visibles, type Fiche } from "./fiches";
import type { Lang } from "./i18n";

/**
 * Chargement des données des pages statiques, hors des fichiers de page :
 * un export supplémentaire dans pages/ finit dans le bundle client, avec node:fs.
 */
export type PropsWilaya = { w: Wilaya; points: Fiche[]; lang: Lang };
export type Couverte = { w: Wilaya; n: number; maj: string; f: Fiche["f"] };
export type PropsAccueil = { couvertes: Couverte[]; total: number; recentes: number; lang: Lang };

export const propsWilaya =
  (lang: Lang): GetStaticProps<PropsWilaya> =>
  async ({ params }) => {
    const w = wilayaParCode(String(params?.code));
    if (!w) return { notFound: true };
    return { props: { w, points: visibles(await getPointsWilaya(w.code)), lang }, revalidate: 60 };
  };

export const propsAccueil =
  (lang: Lang): GetStaticProps<PropsAccueil> =>
  async () => {
    const { par } = await fichesParWilaya();
    const couvertes = WILAYAS.filter((w) => par[w.code]).map((w) => {
      const fiches = par[w.code];
      return { w, n: fiches.length, maj: fiches[0].maj, f: fiches[0].f };
    });
    const toutes = Object.values(par).flat();
    return {
      props: { couvertes, total: toutes.length, recentes: toutes.filter((p) => p.f.jours >= 0 && p.f.jours <= 1).length, lang },
      revalidate: 60,
    };
  };
