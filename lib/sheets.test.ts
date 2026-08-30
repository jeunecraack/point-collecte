import { expect, test } from "bun:test";
import { createVerify, generateKeyPairSync } from "node:crypto";
import { idDepuisUrl, jwtCompteDeService } from "./sheets";

test("JWT du compte de service : RS256 vérifiable, revendications attendues", () => {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const pem = privateKey.export({ type: "pkcs8", format: "pem" }).toString();
  // la clé collée dans Vercel arrive souvent avec des \n échappés : acceptés
  const jwt = jwtCompteDeService("sa@PLACEHOLDER.iam.gserviceaccount.com", pem.replace(/\n/g, "\\n"), 1_000_000);
  const [h, c, s] = jwt.split(".");
  expect(JSON.parse(Buffer.from(h, "base64url").toString())).toEqual({ alg: "RS256", typ: "JWT" });
  const claims = JSON.parse(Buffer.from(c, "base64url").toString());
  expect(claims.iss).toBe("sa@PLACEHOLDER.iam.gserviceaccount.com");
  expect(claims.exp - claims.iat).toBe(3600);
  expect(claims.scope).toContain("spreadsheets");
  expect(createVerify("RSA-SHA256").update(`${h}.${c}`).verify(publicKey, s, "base64url")).toBe(true);
});

test("ID du Sheet extrait de l'URL d'export", () => {
  expect(idDepuisUrl("https://docs.google.com/spreadsheets/d/1abc_DEF-9/export?format=csv")).toBe("1abc_DEF-9");
  expect(idDepuisUrl(undefined)).toBeUndefined();
});
