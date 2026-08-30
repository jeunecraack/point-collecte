"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

// ponytail: le cookie porte le secret lui-même (httpOnly, secure). Suffisant pour
// une page interne à quelques bénévoles ; passer à un jeton signé si ça grandit.
export async function estAdmin() {
  const s = process.env.ADMIN_SECRET;
  return !!s && (await cookies()).get("admin")?.value === s;
}

export async function connexion(form: FormData) {
  const s = process.env.ADMIN_SECRET;
  if (!s || form.get("secret") !== s) redirect("/admin?refuse=1");
  (await cookies()).set("admin", s, { httpOnly: true, secure: true, sameSite: "strict", path: "/admin", maxAge: 12 * 3600 });
  redirect("/admin");
}

/** Le bouton appelle /api/revalidate, comme le ferait un curl, sans exposer le secret au navigateur. */
export async function revalider() {
  if (!(await estAdmin())) redirect("/admin?refuse=1");
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) redirect("/admin?revalide=sans-secret");
  const h = await headers();
  const origine = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  const res = await fetch(`${origine}/api/revalidate`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ secret }),
  }).catch(() => null);
  redirect(`/admin?revalide=${res?.ok ? "ok" : "echec"}`);
}
