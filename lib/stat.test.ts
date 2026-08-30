import { expect, test } from "bun:test";
import { nettoyer } from "./stat";

test("stat : question sans wilaya → texte tronqué, numéros masqués", () => {
  const s = nettoyer({ type: "question", sans_wilaya: true, lang: "fr", q: "je suis a placeholderville, appelez le 0555 12 34 56 svp " + "x".repeat(100) });
  expect(s?.q).toBe(("je suis a placeholderville, appelez le [num] svp " + "x".repeat(100)).slice(0, 80));
});

test("stat : avec wilaya → pas de texte", () => {
  expect(nettoyer({ type: "question", sans_wilaya: false, lang: "ar", q: "PLACEHOLDER" })).toEqual({ type: "question", sans_wilaya: false, lang: "ar" });
});

test("stat : corps invalide → null", () => {
  expect(nettoyer(null)).toBeNull();
  expect(nettoyer({ type: "autre", sans_wilaya: true, lang: "fr" })).toBeNull();
  expect(nettoyer({ type: "question", sans_wilaya: "oui", lang: "fr" })).toBeNull();
  expect(nettoyer({ type: "question", sans_wilaya: true, lang: "en" })).toBeNull();
});
