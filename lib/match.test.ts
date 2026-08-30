import { describe, expect, test } from "bun:test";
import { analyser, detectIntent, findWilaya, fold, type Intention } from "./match";
import { WILAYAS } from "./wilayas";

describe("findWilaya", () => {
  const cas: [string, string | null][] = [
    ["bejaia", "06"],
    ["Béjaïa", "06"],
    ["BGAYET", "06"],
    ["بجاية", "06"],
    ["بِجَايَة", "06"],
    ["الجزائر", "16"],
    ["الجزاير", "16"],
    ["tizi ouzou", "15"],
    ["tizi", "15"],
    ["wilaya 06", "06"],
    ["w15", "15"],
    ["bba", "34"],
    ["bordj bou arreridj", "34"],
    ["ain temouchent", "46"],
    ["el tarf", "36"],
    ["m sila", "28"],
    ["oran", "31"],
    ["Algérie", null],
    ["wilaya 99", null],
  ];
  for (const [q, code] of cas) {
    test(`${JSON.stringify(q)} → ${code}`, () => {
      expect(findWilaya(q)?.code ?? null).toBe(code);
    });
  }
});

describe("detectIntent", () => {
  const cas: [string, Intention | null][] = [
    ["quoi donner", "quoi"],
    ["numero d urgence", "urgence"],
    ["il y a le feu chez moi", "urgence"],
    ["don de sang", "sang"],
    ["je veux etre benevole", "benevole"],
    ["don d argent", "argent"],
    ["bonjour", null],
  ];
  for (const [q, intention] of cas) {
    test(`${JSON.stringify(q)} → ${intention}`, () => {
      expect(detectIntent(q)).toBe(intention);
    });
  }
});

test("priorité : « il y a le feu a bejaia » → urgence ET wilaya 06", () => {
  const a = analyser("il y a le feu a bejaia");
  expect(a.intention).toBe("urgence");
  expect(a.wilaya?.code).toBe("06");
});

test("unicité : aucune clé de matching ne pointe vers deux wilayas", () => {
  const vus = new Map<string, string>();
  const collisions: string[] = [];
  for (const w of WILAYAS) {
    const cles = [fold(w.nom), fold(w.nomAr), fold(w.nomAr).replace(/^ال/, ""), ...w.alias.map(fold)];
    for (const k of new Set(cles.filter(Boolean))) {
      const autre = vus.get(k);
      if (autre && autre !== w.code) collisions.push(`${k}: ${autre} vs ${w.code}`);
      vus.set(k, w.code);
    }
  }
  expect(collisions).toEqual([]);
});
