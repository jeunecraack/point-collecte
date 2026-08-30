import { describe, expect, test } from "bun:test";
import { parserCsv } from "./points";
import { visibles, type ParWilaya } from "./fiches";
import { repondre, trouverCommune } from "./reponse";
import { WILAYAS } from "./wilayas";

const csv =
  "code,nom,commune,tel\n" +
  "16,PLACEHOLDER ALGER A,BARAKI,0550000001\n" +
  "16,PLACEHOLDER ALGER B,BARAKI,0550000002\n" +
  "16,PLACEHOLDER ALGER C,KOUBA,0550000003\n" +
  "15,PLACEHOLDER TIZI,TIZI OUZOU,0550000004\n";
const r = parserCsv(csv, "repo");
const par: ParWilaya = Object.fromEntries(Object.entries(r.points).map(([c, p]) => [c, visibles(p)]));
const tizi = WILAYAS.find((w) => w.code === "15")!;

describe("repondre", () => {
  test("urgence d'abord, même avec une wilaya et une question de lieu", () => {
    const x = repondre("fr", "il y a le feu a bejaia, où déposer", par, null);
    expect(x.urgences).toBe(true);
    expect(x.wilaya?.code).toBe("06");
    expect(x.propositions.length).toBeGreaterThan(0);
  });

  test("« 16 » → les points d'Alger, propositions pour la suite", () => {
    const x = repondre("fr", "16", par, null);
    expect(x.fiches?.length).toBe(3);
    expect(x.texte).toContain("Alger");
    expect(x.propositions).toEqual(["Quoi donner à Alger ?", "Je veux être bénévole à Alger"]); // « Signaler » masqué
  });

  test("mémoire : « 15 » puis « quoi donner » répond pour Tizi Ouzou", () => {
    const x = repondre("fr", "quoi donner", par, tizi);
    expect(x.wilaya?.code).toBe("15");
    expect(x.fiches?.length).toBe(1);
    expect(x.texte).toMatch(/^Le plus utile/);
  });

  test("une wilaya citée remplace la mémoire", () => {
    expect(repondre("fr", "et a alger ?", par, tizi).wilaya?.code).toBe("16");
  });

  test("commune : « je suis à baraki » → Alger, seulement Baraki, lien vers l'ancre", () => {
    expect(trouverCommune("je suis a baraki", par)).toEqual({ code: "16", commune: "BARAKI" });
    const x = repondre("fr", "je suis a baraki", par, null);
    expect(x.wilaya?.code).toBe("16");
    expect(x.fiches?.length).toBe(2);
    expect(x.texte).toContain("BARAKI (Alger)");
    expect(x.lien?.href).toBe("/fr/16#c-baraki");
  });

  test("commune inconnue → demande la wilaya, propose les wilayas couvertes", () => {
    const x = repondre("fr", "je suis a placeholderville", par, null);
    expect(x.fiches).toBeUndefined();
    expect(x.propositions).toContain("Alger");
  });

  test("wilaya couverte sans point → silence + officiels", () => {
    const x = repondre("fr", "oran", par, null);
    expect(x.silence).toBe(true);
    expect(x.wilaya?.code).toBe("31");
  });

  test("horaires : on dit qu'on ne les recense pas, puis les points", () => {
    const x = repondre("fr", "a quelle heure c est ouvert a alger", par, null);
    expect(x.texte).toMatch(/^Les horaires d'ouverture ne sont pas recensés/);
    expect(x.fiches?.length).toBe(3);
  });

  test("politesse : bonjour, merci — et « salam bejaia » montre les points", () => {
    expect(repondre("fr", "bonjour", par, null).texte).toMatch(/^Bonjour/);
    expect(repondre("fr", "merci beaucoup", par, tizi).texte).toMatch(/^Avec plaisir/);
    expect(repondre("ar", "شكرا", par, null).texte).toMatch(/^على الرحب/);
    expect(repondre("fr", "salam alger", par, null).fiches?.length).toBe(3);
  });

  test("signalement masqué : « ajouter » répond « bientôt », sans lien", () => {
    const x = repondre("fr", "je veux signaler un nouveau point", par, null);
    expect(x.lien).toBeUndefined();
    expect(x.texte).toMatch(/bientôt/);
  });

  test("argent et sang : texte fixe, jamais de fiche", () => {
    expect(repondre("fr", "don d argent", par, null).fiches).toBeUndefined();
    expect(repondre("ar", "التبرع بالدم", par, null).texte).toMatch(/CTS/);
  });

  test("arabe : « ١٦ » → points d'Alger, propositions en arabe", () => {
    const x = repondre("ar", "١٦", par, null);
    expect(x.fiches?.length).toBe(3);
    expect(x.texte).toContain("الجزائر");
    expect(x.propositions[0]).toContain("الجزائر");
  });

  test("bénévole avec wilaya : conseil + points", () => {
    const x = repondre("fr", "je veux etre benevole a tizi", par, null);
    expect(x.texte).toMatch(/^Le plus utile : vous présenter/);
    expect(x.fiches?.length).toBe(1);
  });

  test("toute réponse propose une suite ou une fiche", () => {
    for (const q of ["bonjour", "16", "oran", "quoi donner", "don de sang", "numero d urgence", "je veux aider", "à quelle heure", "merci", "n importe quoi"]) {
      const x = repondre("fr", q, par, null);
      expect(x.propositions.length + (x.fiches?.length ?? 0)).toBeGreaterThan(0);
    }
  });
});
