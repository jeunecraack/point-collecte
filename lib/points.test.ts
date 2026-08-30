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
