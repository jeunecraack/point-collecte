import type { Metadata } from "next";
import { fichesParWilaya } from "@/lib/fiches";
import { WILAYAS } from "@/lib/wilayas";
import { Bande, Marque, btnContour, btnPlein } from "@/lib/ui";
import { ONGLET, configSheets, idDepuisUrl } from "@/lib/sheets";
import { connexion, deconnexion, estAdmin, revalider } from "./actions";

export const metadata: Metadata = { title: "Admin — lignes rejetées", robots: { index: false } };

// ponytail: un seul dépôt, une seule équipe. Variable d'environnement si ça change.
const REPO = process.env.NEXT_PUBLIC_REPO_URL ?? "https://github.com/jeunecraack/point-collecte";

const Etat = ({ ok, children }: { ok: boolean; children: React.ReactNode }) => (
  <span className={`inline-flex items-center gap-2 px-2 py-0.5 ${ok ? "bg-fresh-bg text-fresh" : "bg-warm-bg text-warm"}`}>
    <span aria-hidden="true" className="size-2 rounded-full bg-current" />
    {children}
  </span>
);

export default async function Admin({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;

  if (!process.env.ADMIN_SECRET) {
    return <main lang="fr" dir="ltr" className="mx-auto max-w-2xl px-4 py-10"><Marque lang="fr" /><p className="mt-6">ADMIN_SECRET n'est pas configuré : page désactivée.</p></main>;
  }

  if (!(await estAdmin())) {
    return (
      <main lang="fr" dir="ltr" className="mx-auto max-w-sm px-4 py-10">
        <Marque lang="fr" />
        <h1 className="mt-6 text-xl font-extrabold tracking-tight">Admin</h1>
        {sp.refuse && <p role="alert" className="mt-3 bg-warm-bg px-3 py-2 text-warm">Secret refusé.</p>}
        <form action={connexion} className="mt-4 space-y-3">
          <label htmlFor="secret" className="block text-sm font-semibold">ADMIN_SECRET</label>
          <input id="secret" name="secret" type="password" required autoComplete="current-password" className="block w-full border border-rule bg-paper px-3 py-2.5 text-[16px] outline-none focus:border-vert focus:ring-[3px] focus:ring-vert-pale" />
          <button type="submit" className={`${btnPlein} w-full`}>Entrer</button>
        </form>
      </main>
    );
  }

  const { par, rapport, fusions } = await fichesParWilaya();
  const sheets = configSheets();
  const idSheet = idDepuisUrl(process.env.SHEET_CSV_URL);
  const toutes = Object.values(par).flat();
  const nonDatees = toutes.filter((p) => p.f.niveau === "inconnu").length;
  const recentes = toutes.filter((p) => p.f.jours >= 0 && p.f.jours <= 1).length;
  const part = toutes.length ? Math.round((100 * recentes) / toutes.length) : 0;
  const parWilaya = WILAYAS.filter((w) => par[w.code]).map((w) => {
    const fs = par[w.code];
    return { w, n: fs.length, nonDatees: fs.filter((p) => p.f.niveau === "inconnu").length, recentes: fs.filter((p) => p.f.jours >= 0 && p.f.jours <= 1).length };
  });

  return (
    <div lang="fr" dir="ltr">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
        <Marque lang="fr" />
        <form action={deconnexion}><button type="submit" className="min-h-9 text-sm text-muted underline hover:text-ink">Se déconnecter</button></form>
      </div>
      <Bande fine />
      <main className="mx-auto max-w-2xl px-4 pb-16 pt-5">
        <h1 className="text-2xl font-extrabold tracking-tight">Données</h1>

        <dl className="mt-4 grid grid-cols-[9rem_1fr] items-baseline gap-y-1.5 text-sm">
          <dt className="font-mono text-muted">Origine</dt>
          <dd>{rapport.origine === "sheet" ? <Etat ok>Google Sheet</Etat> : <Etat ok={false}>CSV du dépôt (repli) — le Sheet n'est pas lu</Etat>}</dd>
          <dt className="font-mono text-muted">Fiches affichées</dt>
          <dd className="font-mono">{toutes.length} <span className="text-muted">({rapport.total} lignes valides, {fusions.length} doublon{fusions.length > 1 ? "s" : ""} fusionné{fusions.length > 1 ? "s" : ""})</span></dd>
          <dt className="font-mono text-muted">Lignes rejetées</dt>
          <dd className="font-mono">{rapport.rejets.length}</dd>
          <dt className="font-mono text-muted">Signalements</dt>
          <dd>
            {sheets ? (
              <Etat ok>onglet « {ONGLET} »{sheets.id === idSheet ? " du Sheet public — lisible par quiconque a le lien" : " d'un Sheet séparé"}</Etat>
            ) : process.env.SIGNALEMENT_WEBHOOK_URL ? (
              <Etat ok>webhook branché</Etat>
            ) : (
              <Etat ok={false}>dans les logs Vercel, avec nom et téléphone — configurer le compte de service (README)</Etat>
            )}
          </dd>
          <dt className="font-mono text-muted">Lu le</dt>
          <dd className="font-mono">{new Date().toLocaleString("fr-DZ")}</dd>
        </dl>

        <div className="mt-5 flex flex-wrap gap-3">
          <form action={revalider}><button type="submit" className={btnPlein}>Forcer le rafraîchissement</button></form>
          {idSheet && <a href={`https://docs.google.com/spreadsheets/d/${idSheet}/edit`} rel="noopener" className={btnContour}>Ouvrir le Sheet →</a>}
          <a href={`${REPO}/actions/workflows/snapshot.yml`} rel="noopener" className={btnContour}>Instantanés (GitHub) →</a>
        </div>
        {sp.revalide === "ok" && <p role="status" className="mt-3 text-fresh">Fait : accueil, wilayas et assistant régénérés, en arabe et en français.</p>}
        {sp.revalide === "echec" && <p role="alert" className="mt-3 text-warm">Échec de /api/revalidate — voir les logs serveur.</p>}
        {sp.revalide === "sans-secret" && <p role="alert" className="mt-3 text-warm">REVALIDATE_SECRET n'est pas configuré.</p>}

        <h2 className="mt-10 text-lg font-extrabold tracking-tight">Fraîcheur</h2>
        <p className="mt-1 text-sm text-muted">L'indicateur qui compte : la part des fiches vérifiées depuis moins de 48 h. Sous 70 %, relancer les vérificateurs avant toute autre chose.</p>
        <div className="mt-3">
          <div className="h-1.5 w-full bg-surface" role="img" aria-label={`${part} % vérifiées depuis moins de 48 h`}><div className="h-full bg-vert" style={{ width: `${part}%` }} /></div>
          <p className="mt-2 font-mono text-xs text-muted">{part} % vérifiées &lt; 48 h ({recentes}/{toutes.length}) · {nonDatees} sans date</p>
        </div>
        <table className="mt-4 w-full border-collapse text-sm">
          <thead><tr className="border-b border-vert text-left font-mono text-xs uppercase tracking-wider text-muted"><th className="py-2 pr-4">Wilaya</th><th className="py-2 pr-4 text-right">Fiches</th><th className="py-2 pr-4 text-right">&lt; 48 h</th><th className="py-2 text-right">Sans date</th></tr></thead>
          <tbody>
            {parWilaya.map(({ w, n, recentes: r, nonDatees: nd }) => (
              <tr key={w.code} className="border-b border-rule">
                <td className="py-2 pr-4"><a href={`/fr/${w.code}`} className="text-vert underline"><span className="font-mono">{w.code}</span> {w.nom}</a></td>
                <td className="py-2 pr-4 text-right font-mono">{n}</td>
                <td className={`py-2 pr-4 text-right font-mono ${r ? "text-fresh" : "text-muted"}`}>{r}</td>
                <td className={`py-2 text-right font-mono ${nd ? "text-warm" : "text-muted"}`}>{nd}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2 className="mt-10 text-lg font-extrabold tracking-tight">Lignes rejetées</h2>
        <p className="mt-1 text-sm text-muted">Numéro de ligne dans le Sheet (l'en-tête est la ligne 1). Corrigez la cellule, puis forcez le rafraîchissement.</p>
        {rapport.rejets.length === 0 ? (
          <p className="mt-4 text-fresh">Aucune. Toutes les lignes passent.</p>
        ) : (
          <table className="mt-4 w-full border-collapse text-sm">
            <thead><tr className="border-b border-vert text-left font-mono text-xs uppercase tracking-wider text-muted"><th className="py-2 pr-4">Ligne</th><th className="py-2 pr-4">Raison</th><th className="py-2">Aperçu</th></tr></thead>
            <tbody>
              {rapport.rejets.map((r) => (
                <tr key={r.ligne} className="border-b border-rule">
                  <td className="py-2 pr-4 font-mono font-bold text-vert">{r.ligne}</td>
                  <td className="py-2 pr-4">{r.raison}</td>
                  <td dir="auto" className="py-2 text-muted">{r.apercu || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <h2 className="mt-10 text-lg font-extrabold tracking-tight">Doublons fusionnés</h2>
        <p className="mt-1 text-sm text-muted">Deux lignes pour un même point : même nom et même commune, ou un numéro en commun. Une seule fiche est affichée ; supprimez la doublure du Sheet un jour calme.</p>
        {fusions.length === 0 ? (
          <p className="mt-4 text-fresh">Aucun.</p>
        ) : (
          <table className="mt-4 w-full border-collapse text-sm">
            <thead><tr className="border-b border-vert text-left font-mono text-xs uppercase tracking-wider text-muted"><th className="py-2 pr-4">Gardée</th><th className="py-2 pr-4">Doublure</th><th className="py-2 pr-4">Point</th><th className="py-2">Raison</th></tr></thead>
            <tbody>
              {fusions.map((f) => (
                <tr key={`${f.gardee}-${f.doublure}`} className="border-b border-rule">
                  <td className="py-2 pr-4 font-mono font-bold text-vert">{f.gardee}</td>
                  <td className="py-2 pr-4 font-mono text-warm">{f.doublure}</td>
                  <td dir="auto" className="py-2 pr-4">{f.nom}</td>
                  <td className="py-2 font-mono text-xs text-muted">{f.raison}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </div>
  );
}
