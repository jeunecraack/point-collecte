import { expect, test } from "bun:test";
import { dedoublonner, visibles } from "./fiches";
import { parserCsv } from "./points";

const lire = (csv: string) => parserCsv(csv, "repo").points["06"] ?? [];

test("doublon : même nom et même commune → une seule fiche, champs complétés", () => {
  const pts = lire(
    "code,nom,commune,adresse,tel,agree\n" +
      "06,Pharmacie PLACEHOLDER,PLACEHOLDER,,0555000000,\n" +
      "06,PHARMACIE  placeholder,placeholder,PLACEHOLDER ADRESSE,0555000001,oui\n",
  );
  const { fiches, doublons } = dedoublonner(visibles(pts));
  expect(doublons).toBe(0); // visibles() a déjà dédoublonné
  expect(fiches).toHaveLength(1);
  expect(fiches[0].adresse).toBe("PLACEHOLDER ADRESSE");
  expect(fiches[0].tel).toBe("0555000000");
  expect(fiches[0].tel2).toBe("0555000001");
  expect(fiches[0].agree).toBe(true);
});

test("doublon : même numéro de téléphone, noms différents → fusion", () => {
  const pts = lire("code,nom,commune,tel\n06,PLACEHOLDER A,X,0555000000\n06,PLACEHOLDER B,Y,555000000\n");
  expect(visibles(pts)).toHaveLength(1);
});

test("pas de doublon : même nom, communes différentes, numéros différents", () => {
  const pts = lire("code,nom,commune,tel\n06,PLACEHOLDER,X,0555000000\n06,PLACEHOLDER,Y,0555000001\n");
  expect(visibles(pts)).toHaveLength(2);
});

test("la fiche datée l'emporte sur la doublure non datée", () => {
  const pts = lire("code,nom,commune,maj\n06,PLACEHOLDER,X,\n06,PLACEHOLDER,X,2026-08-30\n");
  const v = visibles(pts);
  expect(v).toHaveLength(1);
  expect(v[0].maj).toBe("2026-08-30");
});
