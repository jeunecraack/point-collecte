import { analyser, fold } from "./match";
import { WILAYAS, type Wilaya } from "./wilayas";
import type { Fiche, ParWilaya } from "./fiches";
import { type Lang, lien, nomWilaya, t } from "./i18n";
import { SIGNALER_ACTIF } from "./config";

/** Politesse seule (« bonjour », « merci », « شكرا ») : hors du matching pour garder « bonjour » → null dans la spec. */
const SALUT = new Set("bonjour bonsoir salut salam salem hello hi cc coucou bslama aurevoir bye سلام مرحبا صباح مساء الخير".split(" ").map(fold));
const MERCI = new Set("merci thanks thank chokran choukran saha sahit sahitou شكرا يعطيك الصحة".split(" ").map(fold));
function politesse(q: string): "salut" | "merci" | null {
  const jetons = fold(q).split(" ").filter(Boolean);
  if (!jetons.length) return null;
  if (jetons.some((j) => MERCI.has(j))) return "merci";
  if (jetons.every((j) => SALUT.has(j))) return "salut";
  return null;
}

/**
 * Invariant 1 : espace de sortie fermé. Une réponse est soit un texte de lib/i18n.ts,
 * soit des fiches du dataset. Aucune génération. Pure : testable sans navigateur.
 */
export type Reponse = {
  texte: string;
  urgences?: true;
  wilaya?: Wilaya;
  commune?: string;
  fiches?: Fiche[];
  silence?: true;
  lien?: { href: string; label: string };
  /** Messages proposés après cette réponse : l'étape suivante en un geste. */
  propositions: string[];
};

/** Wilayas couvertes, comme propositions quand on ne sait pas encore où est la personne. */
export const couvertes = (lang: Lang, par: ParWilaya) =>
  WILAYAS.filter((w) => par[w.code]).slice(0, 6).map((w) => nomWilaya(lang, w));

/** « je suis à Baraki » : une commune présente dans les données désigne sa wilaya. Clé la plus longue d'abord. */
export function trouverCommune(q: string, par: ParWilaya): { code: string; commune: string } | null {
  const f = ` ${fold(q)} `;
  let meilleur: { code: string; commune: string; len: number } | null = null;
  for (const [code, fiches] of Object.entries(par)) {
    for (const p of fiches) {
      const k = fold(p.commune);
      if (k.length >= 4 && f.includes(` ${k} `) && (!meilleur || k.length > meilleur.len)) meilleur = { code, commune: p.commune, len: k.length };
    }
  }
  return meilleur ? { code: meilleur.code, commune: meilleur.commune } : null;
}

const ancre = (commune: string) => "c-" + (commune || "autres").normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, "-");

/**
 * `memo` : la wilaya du message précédent. « 15 » puis « quoi donner » → réponse pour Tizi Ouzou.
 * Une wilaya ou une commune citée dans le message courant remplace toujours la mémoire.
 */
export function repondre(lang: Lang, q: string, par: ParWilaya, memo: Wilaya | null): Reponse {
  const d = t(lang);
  const a = analyser(q);
  const com = a.wilaya ? null : trouverCommune(q, par);
  const wilaya = a.wilaya ?? (com ? WILAYAS.find((w) => w.code === com.code) : undefined) ?? memo ?? undefined;
  const intention = a.intention;
  const nom = wilaya ? nomWilaya(lang, wilaya) : "";
  const toutes = wilaya ? (par[wilaya.code] ?? []) : [];
  const fiches = com ? toutes.filter((p) => fold(p.commune) === fold(com.commune)) : toutes;
  const versWilaya = wilaya ? { href: lien(lang, `/${wilaya.code}`) + (com ? `#${ancre(com.commune)}` : ""), label: d.pageWilaya(nom) } : undefined;
  const sansWilaya = (texte: string): Reponse => ({ texte, propositions: [...couvertes(lang, par), ...d.propGenerales().slice(0, 1)] });
  // Tant que le signalement est masqué, la proposition « Signaler un point » ne s'affiche pas.
  const filtre = (props: string[]) => (SIGNALER_ACTIF ? props : props.filter((p) => p !== d.signalerPoint));

  const points = (prefixe = ""): Reponse => {
    if (!wilaya) return sansWilaya(prefixe + d.demandeWilaya);
    if (!fiches.length) return { texte: prefixe + d.rienA(com ? `${com.commune} (${nom})` : nom), wilaya, commune: com?.commune, silence: true, lien: versWilaya, propositions: filtre(d.propApresVide()) };
    return {
      texte: prefixe + (com ? d.pointsCommune(fiches.length, com.commune, nom) : d.pointsA(fiches.length, nom)),
      wilaya,
      commune: com?.commune,
      fiches,
      lien: versWilaya,
      propositions: filtre(d.propApresPoints(nom)),
    };
  };

  if (!intention && !a.wilaya && !com) {
    const p = politesse(q);
    if (p === "merci") return { texte: d.merciReponse, wilaya, propositions: filtre(wilaya ? d.propWilaya(nom).slice(0, 2) : d.propGenerales()) };
    if (p === "salut") return { texte: d.salutReponse, wilaya, propositions: filtre(wilaya ? d.propWilaya(nom) : [...couvertes(lang, par), ...d.propGenerales().slice(0, 1)]) };
  }

  // « urgence » est testée en premier : « le feu chez moi » reçoit le 14, pas une liste.
  switch (intention) {
    case "urgence":
      return { texte: d.urgenceReponse, urgences: true, wilaya, propositions: wilaya ? d.propWilaya(nom).slice(0, 2) : couvertes(lang, par) };

    case "quoi":
      // Pas de colonne besoins dans les données : conseil général, puis les points de la wilaya.
      return { ...points(d.quoiGenerique), propositions: wilaya && fiches.length ? filtre(d.propApresPoints(nom).slice(1)) : points().propositions };

    case "horaires":
      return points(d.horairesReponse);

    case "argent":
      return { texte: d.argent, wilaya, propositions: filtre(wilaya ? d.propWilaya(nom) : d.propGenerales()) };

    case "sang":
      return { texte: d.sang, wilaya, propositions: filtre(wilaya ? d.propWilaya(nom) : d.propGenerales()) };

    case "benevole":
      return { ...points(d.benevole) };

    case "ajouter":
      return SIGNALER_ACTIF
        ? { texte: d.ajouter, wilaya, lien: { href: lien(lang, "/signaler"), label: d.signalerPoint }, propositions: wilaya ? d.propWilaya(nom).slice(0, 2) : [] }
        : { texte: d.ajouterBientot, wilaya, propositions: filtre(wilaya ? d.propWilaya(nom).slice(0, 2) : d.propGenerales()) };

    case "ou":
    case null:
    default:
      // Wilaya seule (« 15 », « بجاية », « baraki ») : on montre les points et on propose la suite.
      return points();
  }
}
