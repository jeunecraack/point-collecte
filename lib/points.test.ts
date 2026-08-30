import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { fraicheur, parserCsv } from "./points";

const iso = (joursAvant: number) =>
  new Date(Date.now() - joursAvant * 864e5).toISOString().slice(0, 10);

test("data/points.csv : 4 lignes valides + 4 cassées → 4 fiches, 4 rejets", () => {
  const r = parserCsv(readFileSync("data/points.csv", "utf8"), "repo");
  expect(r.total).toBe(4);
  expect(r.rejets).toHaveLength(4);
  expect(r.rejets.map((x) => x.ligne)).toEqual([6, 7, 8, 9]);
  // le zéro initial mangé par Sheets est restauré
  expect(r.points["06"]?.[1]?.tel).toBe("0000000000");
  // colonne agree : « oui » → true, vide → false
  expect(r.points["06"]?.[0]?.agree).toBe(true);
  expect(r.points["06"]?.[1]?.agree).toBe(false);
});

test("en-têtes accentués et valeurs négatives de agree", () => {
  const csv = "code,nom,Agréé,maj,source\n06,PLACEHOLDER,non,2026-08-30,PLACEHOLDER\n06,PLACEHOLDER,x,2026-08-30,PLACEHOLDER\n";
  const r = parserCsv(csv, "repo");
  expect(r.points["06"]?.map((p) => p.agree)).toEqual([false, true]);
});

test("fraicheur : 11 jours → perime, donc exclue du rendu", () => {
  expect(fraicheur(iso(11)).niveau).toBe("perime");
  expect(fraicheur(iso(9)).niveau).toBe("tiede");
  expect(fraicheur(iso(2)).niveau).toBe("frais");
  expect(fraicheur("n'importe quoi").niveau).toBe("inconnu");
});

test("en-têtes du Sheet des bénévoles → modèle (Wilaya en nom, Num1..3, Maps, Agree)", () => {
  const csv =
    "Wilaya,Commune,Adresse,Localisation Maps,Association,Num1,Num2,Num3,Agree ,maj,source\n" +
    "BEJAIA,PLACEHOLDER,PLACEHOLDER ADRESSE,https://maps.app.goo.gl/PLACEHOLDER,PLACEHOLDER ASSO,555000000,,23000000,OUI,2026-08-30,PLACEHOLDER\n" +
    "AIN TIMOUNCHENT,,,,PLACEHOLDER ASSO,,,,NON,2026-08-30,PLACEHOLDER\n" +
    "NULLE PART,,,,PLACEHOLDER ASSO,,,,,2026-08-30,PLACEHOLDER\n" +
    "ALGER,,,,PLACEHOLDER ASSO,,,,,,\n";
  const r = parserCsv(csv, "sheet");
  expect(r.total).toBe(2);
  const b = r.points["06"]?.[0];
  expect(b?.nom).toBe("PLACEHOLDER ASSO");
  expect(b?.tel).toBe("0555000000");
  expect(b?.tel2).toBe("");
  expect(b?.tel3).toBe("023000000");
  expect(b?.maps).toBe("https://maps.app.goo.gl/PLACEHOLDER");
  expect(b?.agree).toBe(true);
  expect(r.points["46"]?.[0]?.agree).toBe(false);
  expect(r.rejets.map((x) => x.ligne)).toEqual([4, 5]);
  expect(r.rejets[0].raison).toMatch(/^code/);
  expect(r.rejets[1].raison).toMatch(/^maj/);
});

test("lien Maps hors domaine Google → vidé", () => {
  const csv = "code,nom,maps,maj,source\n06,PLACEHOLDER,javascript:alert(1),2026-08-30,PLACEHOLDER\n";
  expect(parserCsv(csv, "repo").points["06"]?.[0]?.maps).toBe("");
});

test("cellule Wilaya fusionnée : les lignes vides héritent de la précédente", () => {
  const csv = "Wilaya,Association,maj,source\nORAN,PLACEHOLDER A,2026-08-30,PLACEHOLDER\n,PLACEHOLDER B,2026-08-30,PLACEHOLDER\n,PLACEHOLDER C,2026-08-30,PLACEHOLDER\nBEJAIA,PLACEHOLDER D,2026-08-30,PLACEHOLDER\n";
  const r = parserCsv(csv, "sheet");
  expect(r.points["31"]?.map((p) => p.nom)).toEqual(["PLACEHOLDER A", "PLACEHOLDER B", "PLACEHOLDER C"]);
  expect(r.points["06"]?.map((p) => p.nom)).toEqual(["PLACEHOLDER D"]);
});
