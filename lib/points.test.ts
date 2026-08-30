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
  expect(r.rejets[0].apercu).toBe("99 · PLACEHOLDER A REMPLACER");
  expect(r.points["06"]?.map((p) => p.ligne)).toEqual([2, 3]);
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
  expect(r.total).toBe(3);
  const b = r.points["06"]?.[0];
  expect(b?.nom).toBe("PLACEHOLDER ASSO");
  expect(b?.tel).toBe("0555000000");
  expect(b?.tel2).toBe("");
  expect(b?.tel3).toBe("023000000");
  expect(b?.maps).toBe("https://maps.app.goo.gl/PLACEHOLDER");
  expect(b?.agree).toBe(true);
  expect(r.points["46"]?.[0]?.agree).toBe(false);
  expect(r.rejets.map((x) => x.ligne)).toEqual([4]);
  expect(r.rejets[0].raison).toMatch(/^code/);
  // sans date ni source : acceptée, « non datée »
  expect(r.points["16"]?.[0]?.maj).toBe("");
  expect(fraicheur(r.points["16"]![0].maj).niveau).toBe("inconnu");
});

test("date renseignée mais mal formée → rejet ; vide → non datée, jamais périmée", () => {
  const csv = "code,nom,maj\n06,PLACEHOLDER,30/08/2026\n06,PLACEHOLDER B,\n";
  const r = parserCsv(csv, "repo");
  expect(r.rejets.map((x) => x.raison)).toEqual(["maj: date attendue au format AAAA-MM-JJ"]);
  expect(fraicheur("").niveau).toBe("inconnu");
});

test("lien Maps : seuls les domaines Google, ancrés", () => {
  const lire = (u: string) => parserCsv(`code,nom,maps\n06,PLACEHOLDER,${u}\n`, "repo").points["06"]![0].maps;
  for (const u of ["https://maps.app.goo.gl/x", "https://www.google.com/maps/place/x", "https://google.dz/maps/x", "https://goo.gl/maps/x", "https://maps.google.com/x"])
    expect(lire(u)).toBe(u);
  for (const u of ["https://www.google.evil.com/maps/x", "https://maps.google.attacker.io/x", "https://maps.app.goo.gl.evil.com/x", "javascript:alert(1)", "http://maps.app.goo.gl/x", "https://example.com/?u=https://maps.app.goo.gl/"])
    expect(lire(u)).toBe("");
});

test("cellule Wilaya fusionnée : les lignes vides héritent de la précédente", () => {
  const csv = "Wilaya,Association,maj,source\nORAN,PLACEHOLDER A,2026-08-30,PLACEHOLDER\n,PLACEHOLDER B,2026-08-30,PLACEHOLDER\n,PLACEHOLDER C,2026-08-30,PLACEHOLDER\nBEJAIA,PLACEHOLDER D,2026-08-30,PLACEHOLDER\n";
  const r = parserCsv(csv, "sheet");
  expect(r.points["31"]?.map((p) => p.nom)).toEqual(["PLACEHOLDER A", "PLACEHOLDER B", "PLACEHOLDER C"]);
  expect(r.points["06"]?.map((p) => p.nom)).toEqual(["PLACEHOLDER D"]);
});

test("Association « / » → le lieu (Adresse) devient le nom ; « / » ailleurs → vide", () => {
  const csv = "Wilaya,Commune,Adresse,Association,Num1,maj,source\nORAN,PLACEHOLDER,PLACEHOLDER LIEU,/,/,2026-08-30,PLACEHOLDER\nORAN,PLACEHOLDER,/,/,,2026-08-30,PLACEHOLDER\n";
  const r = parserCsv(csv, "sheet");
  expect(r.total).toBe(1);
  expect(r.points["31"]?.[0]?.nom).toBe("PLACEHOLDER LIEU");
  expect(r.points["31"]?.[0]?.tel).toBe("");
  expect(r.rejets[0]?.raison).toMatch(/^nom/);
});

test("numérotation : une ligne vide au milieu du Sheet compte", () => {
  const csv = "code,nom\n06,PLACEHOLDER A\n,\n\n06,PLACEHOLDER B\n99,PLACEHOLDER C\n";
  const r = parserCsv(csv, "repo");
  expect(r.points["06"]?.map((p) => [p.nom, p.ligne])).toEqual([["PLACEHOLDER A", 2], ["PLACEHOLDER B", 5]]);
  expect(r.rejets.map((x) => x.ligne)).toEqual([6]);
});
