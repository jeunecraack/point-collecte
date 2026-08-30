import { WILAYAS, type Wilaya, wilayaParCode } from "./wilayas";

/**
 * Réduit la variance d'écriture à une forme canonique.
 * Accents latins supprimés, variantes arabes unifiées, ponctuation en espaces.
 * C'est ici que « Béjaïa », « bejaia », « BGAYET » et « بجاية » convergent.
 */
export function fold(s: string): string {
  return (s ?? "")
    .normalize("NFD")
    // \p{M} et non [\u0300-\u036f] : sous NFD, ئ se décompose en ي + U+0654,
    // hors de la plage latine. Ne retirer que les marques latines couperait
    // « الجزائر » en deux mots. Cela retire aussi le tashkil au passage.
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/[ىی]/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

type Entree = { w: Wilaya; cles: string[] };

const INDEX: Entree[] = WILAYAS.map((w) => {
  const cles = [
    fold(w.nom),
    fold(w.nomAr),
    fold(w.nomAr).replace(/^ال/, ""),
    ...w.alias.map(fold),
  ];
  return { w, cles: [...new Set(cles.filter(Boolean))] };
});

/**
 * Extraction déterministe de la wilaya.
 *
 * Deux règles portent toute la fiabilité :
 *  - la comparaison est délimitée par des espaces, jamais par sous-chaîne,
 *    sinon « Algérie » matcherait « Alger » ;
 *  - en cas de recouvrement, la clé la plus longue gagne,
 *    donc « tizi ouzou » bat « tizi ».
 */
export function findWilaya(q: string): Wilaya | null {
  const f = ` ${fold(q)} `;

  const num = f.match(/\bw(?:ilaya)?\s*0?(\d{1,2})\b/);
  if (num) {
    const w = wilayaParCode(num[1]);
    if (w) return w;
  }

  let meilleur: { w: Wilaya; len: number } | null = null;
  for (const { w, cles } of INDEX) {
    for (const k of cles) {
      if (f.includes(` ${k} `) && (!meilleur || k.length > meilleur.len)) {
        meilleur = { w, len: k.length };
      }
    }
  }
  return meilleur?.w ?? null;
}

export type Intention =
  | "urgence"
  | "quoi"
  | "argent"
  | "sang"
  | "benevole"
  | "ajouter"
  | "ou";

/**
 * L'ordre du tableau encode une priorité : « urgence » est évalué en premier,
 * avant même la wilaya. Quelqu'un qui écrit « feu chez moi » doit recevoir
 * le 14, pas une liste de points de collecte.
 */
const LEXIQUE: [Intention, string][] = [
  [
    "urgence",
    "urgence secours pompier pompiers protection civile numero numeros feu incendie appeler samu ambulance نجدة طوارئ حريق",
  ],
  [
    "quoi",
    "quoi que donner besoin besoins liste utile materiel produit produits necessaire manque نعطي",
  ],
  [
    "argent",
    "argent money virement ccp rib compte bancaire financier cash cheque baridimob مال فلوس",
  ],
  ["sang", "sang transfusion cts donneur globules دم"],
  [
    "benevole",
    "benevole benevolat volontaire volontariat aider participer inscrire equipe متطوع",
  ],
  [
    "ajouter",
    "ajouter signaler nouveau corriger erreur mettre jour responsable organise",
  ],
  [
    "ou",
    "ou point points collecte depot deposer adresse pres proche apporter livrer نقطة اين وين",
  ],
];

const INTENTIONS = LEXIQUE.map(([id, mots]) => ({
  id,
  mots: new Set(mots.split(" ").map(fold)),
}));

export function detectIntent(q: string): Intention | null {
  const jetons = fold(q).split(" ").filter(Boolean);
  let meilleur: { id: Intention; score: number } | null = null;

  for (const { id, mots } of INTENTIONS) {
    let score = 0;
    for (const j of jetons) if (mots.has(j)) score++;
    if (score > 0 && (!meilleur || score > meilleur.score)) {
      meilleur = { id, score };
    }
  }
  return meilleur?.id ?? null;
}

export type Analyse = { wilaya: Wilaya | null; intention: Intention | null };

export function analyser(q: string): Analyse {
  return { wilaya: findWilaya(q), intention: detectIntent(q) };
}
