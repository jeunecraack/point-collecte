import type { Metadata } from "next";
import { getPoints } from "@/lib/points";
import { Marque } from "@/lib/ui";
import { connexion, estAdmin, revalider } from "./actions";

export const metadata: Metadata = { title: "Admin — lignes rejetées", robots: { index: false } };

export default async function Admin({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;

  if (!process.env.ADMIN_SECRET) {
    return <main className="mx-auto max-w-2xl px-4 py-10"><p>ADMIN_SECRET n'est pas configuré : page désactivée.</p></main>;
  }

  if (!(await estAdmin())) {
    return (
      <main className="mx-auto max-w-sm px-4 py-10">
        <h1 className="text-xl font-extrabold tracking-tight">Admin</h1>
        {sp.refuse && <p role="alert" className="mt-3 bg-warm-bg px-3 py-2 text-warm">Secret refusé.</p>}
        <form action={connexion} className="mt-4 space-y-3">
          <label htmlFor="secret" className="block text-sm font-semibold">ADMIN_SECRET</label>
          <input id="secret" name="secret" type="password" required autoComplete="current-password" className="block w-full border border-rule bg-white px-3 py-2.5 text-[16px] focus:border-ink" />
          <button type="submit" className="min-h-11 w-full bg-ink px-4 py-3 font-semibold text-white">Entrer</button>
        </form>
      </main>
    );
  }

  const rapport = await getPoints();
  return (
    <main className="mx-auto max-w-2xl px-4 pb-16 pt-5">
      <Marque />
      <h1 className="mt-4 text-2xl font-extrabold tracking-tight">Données</h1>
      <dl className="mt-4 grid grid-cols-[8rem_1fr] gap-y-1 font-mono text-sm">
        <dt className="text-muted">Origine</dt><dd>{rapport.origine === "sheet" ? "Google Sheet" : "CSV du dépôt (repli)"}</dd>
        <dt className="text-muted">Fiches valides</dt><dd>{rapport.total}</dd>
        <dt className="text-muted">Lignes rejetées</dt><dd>{rapport.rejets.length}</dd>
        <dt className="text-muted">SHEET_CSV_URL</dt><dd>{process.env.SHEET_CSV_URL ? "défini" : "vide"}</dd>
        <dt className="text-muted">Lu le</dt><dd>{new Date().toLocaleString("fr-DZ")}</dd>
      </dl>

      <form action={revalider} className="mt-6">
        <button type="submit" className="min-h-11 bg-ink px-4 py-3 font-semibold text-white">Forcer le rafraîchissement</button>
        {sp.revalide === "ok" && <span role="status" className="ml-3 text-fresh">Fait : accueil, 58 wilayas et assistant régénérés.</span>}
        {sp.revalide === "echec" && <span role="alert" className="ml-3 text-warm">Échec de /api/revalidate — voir les logs serveur.</span>}
        {sp.revalide === "sans-secret" && <span role="alert" className="ml-3 text-warm">REVALIDATE_SECRET n'est pas configuré.</span>}
      </form>

      <h2 className="mt-10 text-lg font-extrabold tracking-tight">Lignes rejetées</h2>
      <p className="mt-1 text-sm text-muted">Numéro de ligne dans le Sheet (l'en-tête est la ligne 1). Corrigez la cellule, puis rafraîchissez.</p>
      {rapport.rejets.length === 0 ? (
        <p className="mt-4 text-fresh">Aucune. Toutes les lignes passent.</p>
      ) : (
        <table className="mt-4 w-full border-collapse text-sm">
          <thead><tr className="border-b border-ink text-left font-mono text-xs uppercase tracking-wider text-muted"><th className="py-2 pr-4">Ligne</th><th className="py-2">Raison</th></tr></thead>
          <tbody>
            {rapport.rejets.map((r) => (
              <tr key={r.ligne} className="border-b border-rule"><td className="py-2 pr-4 font-mono">{r.ligne}</td><td className="py-2">{r.raison}</td></tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
