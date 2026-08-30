import { expect, test } from "bun:test";
import { ligneSelonEntetes, memeLigne } from "./moderation";

test("ligne selon les en-têtes des bénévoles", () => {
  const entetes = ["Wilaya", "Commune", "Adresse", "Localisation Maps", "Association", "Num1", "Num2", "Num3", "Agree "];
  const { ligne, perdues } = ligneSelonEntetes(entetes, { wilaya: "BEJAIA", commune: "PLACEHOLDER", nom: "PLACEHOLDER ASSO", adresse: "PLACEHOLDER ADRESSE", tel: "0555000000", source: "PLACEHOLDER" });
  expect(ligne).toEqual(["BEJAIA", "PLACEHOLDER", "PLACEHOLDER ADRESSE", "", "PLACEHOLDER ASSO", "0555000000", "", "", ""]);
  expect(perdues).toEqual(["source"]);
});

test("ligne selon le modèle du dépôt", () => {
  const { ligne, perdues } = ligneSelonEntetes(["code", "nom", "commune", "tel", "maj", "source"], { wilaya: "06", nom: "PLACEHOLDER", tel: "0555000000" });
  expect(ligne).toEqual(["06", "PLACEHOLDER", "", "0555000000", "", ""]);
  expect(perdues).toEqual([]);
});

test("memeLigne : garde-fou avant suppression", () => {
  expect(memeLigne(["BEJAIA", "PLACEHOLDER", "Pharmacie X", "", "/", "0555000000"], ["Pharmacie X", "0555000000"])).toBe(true);
  expect(memeLigne(["ALGER", "AUTRE", "Pharmacie Y"], ["Pharmacie X", "0555000000"])).toBe(false);
  expect(memeLigne(["x"], [])).toBe(false);
});
