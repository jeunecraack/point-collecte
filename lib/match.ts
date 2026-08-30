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
    // Chiffres arabes-indiens (١٥) et persans (۱۵) → 15 : la wilaya se tape aussi au clavier arabe.
    .replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 0x660))
    .replace(/[۰-۹]/g, (c) => String(c.charCodeAt(0) - 0x6f0))
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

  const num = f.match(/\bw(?:il|ill?aya)?\s*0?(\d{1,2})\b/);
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
  if (meilleur) return meilleur.w;

  // Un nombre seul, « 15 », « 06 », « 15eme », suffit : c'est ainsi que les gens désignent leur wilaya.
  // Après les noms, pour que « 5 rue x a bejaia » donne Béjaïa et non Batna.
  const seul = f.match(/ 0?(\d{1,2})(?:eme|er|e)? /);
  if (seul) {
    const w = wilayaParCode(seul[1]);
    if (w) return w;
  }

  // Dernier recours : une faute de frappe (« tlemcenn », « constantin », « bejaiaa »).
  return approx(f);
}

/** Distance de Levenshtein, bornée : on s'arrête dès que ça dépasse `max`. */
function distance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let mini = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      mini = Math.min(mini, cur[j]);
    }
    if (mini > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

/**
 * Tolérance aux fautes : un mot d'au moins 5 lettres à une lettre près d'une clé,
 * deux lettres à partir de 8. Jamais sur les mots courts (« oran » ≠ « iran »), et le
 * meilleur candidat doit être unique — sinon on préfère ne rien reconnaître.
 */
function approx(f: string): Wilaya | null {
  const mots = f.trim().split(" ").filter((m) => m.length >= 5);
  const candidats = [...mots, f.trim()].filter((m) => m.length >= 5);
  let meilleur: { w: Wilaya; d: number; len: number } | null = null;
  let ambigu = false;
  for (const m of candidats) {
    const max = m.length >= 8 ? 2 : 1;
    for (const { w, cles } of INDEX) {
      for (const k of cles) {
        if (k.length < 5) continue;
        const d = distance(m, k, max);
        if (d > max) continue;
        if (!meilleur || d < meilleur.d || (d === meilleur.d && k.length > meilleur.len)) {
          ambigu = !!meilleur && d === meilleur.d && meilleur.w !== w && k.length === meilleur.len;
          meilleur = { w, d, len: k.length };
        } else if (d === meilleur.d && meilleur.w !== w && k.length === meilleur.len) ambigu = true;
      }
    }
  }
  return meilleur && !ambigu ? meilleur.w : null;
}

export type Intention =
  | "urgence"
  | "quoi"
  | "argent"
  | "sang"
  | "benevole"
  | "ajouter"
  | "horaires"
  | "ou";

/**
 * L'ordre du tableau encode une priorité : « urgence » est évalué en premier,
 * avant même la wilaya. Quelqu'un qui écrit « feu chez moi » doit recevoir
 * le 14, pas une liste de points de collecte.
 */
const LEXIQUE: [Intention, string][] = [
  [
    "urgence",
    "urgence urgent secours pompier pompiers protection civile feu incendie flammes fumee brule appeler samu ambulance blesse " +
      "nar nour 7ariq hariq 7ri9 hri9 3afya 3afia sapeurs " +
      "نجدة طوارئ حريق النار نار حرائق اسعاف الحماية المدنية ارقام",
  ],
  [
    "quoi",
    "quoi que besoin besoins liste utile materiel produit produits necessaire manque " +
      "wach wech chnou lazem lazm ykhas ykhess n3ti na3ti nmed nmedd " +
      "نعطي ماذا اش واش نتبرع اتبرع تبرع احتياجات حاجة ينقص يلزم",
  ],
  [
    "argent",
    "argent money virement ccp rib bancaire financier cash cheque baridimob drahem flous dirhem مال فلوس دراهم حساب تحويل",
  ],
  ["sang", "sang transfusion cts donneur globules dem demm دم الدم بالدم"],
  [
    "benevole",
    "benevole benevolat volontaire volontariat aider participer inscrire equipe bras " +
      "n3awen na3wen n3awn ntawa3 ntatawa3 tatawo3 moutatawi3 " +
      "متطوع تطوع اتطوع نتطوع التطوع نساعد اساعد مساعدة",
  ],
  [
    "ajouter",
    "ajouter signaler nouveau corriger erreur mettre jour responsable organise nzid nzidou اضافة ابلاغ اضيف نضيف تصحيح خطا",
  ],
  [
    "horaires",
    "heure heures horaire horaires ouvert ouverte ouverts ferme fermee fermes quand jusqu " +
      "wa9t wa9tach wa9tech w9tach we9tach kifach " +
      "وقت ساعة متى وقتاش يحلو يحل يسكر مفتوح مغلق",
  ],
  [
    "ou",
    "ou point points collecte depot deposer donner adresse pres proche apporter livrer amener " +
      "vetements habits couvertures nourriture manger lait couches eau medicaments " +
      "win wine fin kayen kayn nrouh nhot nhout nweddi ndi " +
      "نقطة نقاط اين وين فين عنوان نودع اودع جمع كاين",
  ],
];

/** « pas d'urgence », « pas urgent », « لا طوارئ » : on retire la négation avant de compter. */
const NEGATION_URGENCE = /\b(pas d urgence|pas urgent|pas une urgence|sans urgence|rien d urgent|لا طوارئ|ماشي طوارئ)\b/g;

const INTENTIONS = LEXIQUE.map(([id, mots]) => ({
  id,
  mots: new Set(mots.split(" ").map(fold)),
}));

export function detectIntent(q: string): Intention | null {
  const jetons = fold(q).replace(NEGATION_URGENCE, " ").split(" ").filter(Boolean);
  let meilleur: { id: Intention; score: number } | null = null;

  for (const { id, mots } of INTENTIONS) {
    let score = 0;
    for (const j of jetons) if (mots.has(j)) score++;
    // Invariant 6 : un mot d'urgence, où qu'il soit dans la phrase, l'emporte sur tout le reste.
    if (id === "urgence" && score > 0) return "urgence";
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
