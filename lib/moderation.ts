import { fold } from "./match";

/**
 * Écriture d'un point dans l'onglet des bénévoles, selon LEURS en-têtes (Wilaya, Commune, Adresse,
 * Localisation Maps, Association, Num1…). On lit la ligne 1 et on range chaque valeur sous la bonne
 * colonne ; une colonne inconnue reste vide, une valeur sans colonne est perdue (signalée).
 */
const CIBLES: Record<string, string[]> = {
  wilaya: ["wilaya", "code"],
  commune: ["commune"],
  adresse: ["adresse"],
  maps: ["localisation maps", "maps", "lien"],
  nom: ["association", "nom", "lieu"],
  tel: ["num1", "num", "tel", "telephone"],
  tel2: ["num2"],
  tel3: ["num3"],
  agree: ["agree"],
  source: ["source", "verifie par"],
  maj: ["maj", "date"],
};

export function ligneSelonEntetes(entetes: string[], valeurs: Partial<Record<keyof typeof CIBLES, string>>): { ligne: string[]; perdues: string[] } {
  const ligne = entetes.map(() => "");
  const perdues: string[] = [];
  for (const [cle, val] of Object.entries(valeurs)) {
    if (!val) continue;
    const i = entetes.findIndex((h) => CIBLES[cle]?.includes(fold(h)));
    if (i >= 0) ligne[i] = val;
    else perdues.push(cle);
  }
  return { ligne, perdues };
}

/** Vérifie qu'une ligne relue dans le Sheet est bien celle affichée : au moins un champ parlant identique. */
export function memeLigne(relue: string[], attendus: string[]): boolean {
  const r = relue.map((v) => fold(v)).filter(Boolean);
  const a = attendus.map((v) => fold(v)).filter(Boolean);
  if (!a.length) return false;
  return a.every((v) => r.includes(v));
}
