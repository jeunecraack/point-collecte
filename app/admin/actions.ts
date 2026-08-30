"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { egal, jetonAdmin, origineSite } from "@/lib/secret";

export async function estAdmin() {
  const s = process.env.ADMIN_SECRET;
  const c = (await cookies()).get("admin")?.value ?? "";
  return !!s && egal(c, jetonAdmin(s));
}

export async function connexion(form: FormData) {
  const s = process.env.ADMIN_SECRET;
  const saisi = String(form.get("secret") ?? "");
  if (!s || !egal(saisi, s)) {
    // Frein : chaque échec coûte 800 ms et une invocation. Avec un secret aléatoire de 32 octets, la force brute est hors de portée.
    await new Promise((r) => setTimeout(r, 800));
    redirect("/admin?refuse=1");
  }
  (await cookies()).set("admin", jetonAdmin(s), { httpOnly: true, secure: true, sameSite: "strict", path: "/admin", maxAge: 12 * 3600 });
  redirect("/admin");
}

/** Le bouton appelle /api/revalidate sur l'origine de confiance, sans exposer le secret au navigateur. */
export async function revalider() {
  if (!(await estAdmin())) redirect("/admin?refuse=1");
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) redirect("/admin?revalide=sans-secret");
  const res = await fetch(`${origineSite()}/api/revalidate`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ secret }),
  }).catch(() => null);
  redirect(`/admin?revalide=${res?.ok ? "ok" : "echec"}`);
}

export async function deconnexion() {
  (await cookies()).delete({ name: "admin", path: "/admin" });
  redirect("/admin");
}
