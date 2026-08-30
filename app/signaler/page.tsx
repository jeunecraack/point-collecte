import type { Metadata } from "next";
import { WILAYAS } from "@/lib/wilayas";
import { Marque } from "@/lib/ui";
import { signaler } from "./actions";

export const metadata: Metadata = {
  title: "Signaler un point de collecte",
  description: "Proposez un point de collecte ou une correction. Rien n'est publié sans un appel de vérification.",
};

const champ = "mt-1 block w-full border border-rule bg-white px-3 py-2.5 text-[16px] focus:border-ink";
const label = "block text-sm font-semibold";

export default async function Signaler({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  return (
    <main className="mx-auto max-w-2xl px-4 pb-16 pt-5">
      <Marque />
      <h1 className="mt-3 text-2xl font-extrabold tracking-tight">Signaler un point de collecte</h1>

      <p className="mt-3 border-l-4 border-ink pl-3 leading-relaxed">
        <strong>Rien n'est publié sans un appel de vérification.</strong> Un bénévole rappelle la personne
        indiquée ci-dessous, confirme l'adresse et les horaires, puis seulement la fiche apparaît sur le site.
      </p>

      {sp.envoye && (
        <p role="status" className="mt-4 bg-fresh-bg px-3 py-2 text-fresh">
          Reçu. On vous rappelle pour vérifier avant toute publication.
        </p>
      )}
      {sp.erreur && (
        <p role="alert" className="mt-4 bg-warm-bg px-3 py-2 text-warm">
          Le formulaire est incomplet : vérifiez la wilaya, le nom du lieu, l'adresse et la personne à rappeler.
        </p>
      )}

      <form action={signaler} className="mt-6 space-y-4">
        <div>
          <label htmlFor="code" className={label}>Wilaya</label>
          <select id="code" name="code" required className={champ} defaultValue="">
            <option value="" disabled>Choisir…</option>
            {WILAYAS.map((w) => <option key={w.code} value={w.code}>{w.code} — {w.nom}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="commune" className={label}>Commune</label>
          <input id="commune" name="commune" className={champ} autoComplete="off" />
        </div>
        <div>
          <label htmlFor="nom" className={label}>Nom du lieu</label>
          <input id="nom" name="nom" required minLength={3} className={champ} autoComplete="off" />
        </div>
        <div>
          <label htmlFor="adresse" className={label}>Adresse</label>
          <input id="adresse" name="adresse" required minLength={5} className={champ} autoComplete="off" />
        </div>
        <div>
          <label htmlFor="tel" className={label}>Téléphone du point <span className="font-normal text-muted">(facultatif)</span></label>
          <input id="tel" name="tel" type="tel" inputMode="tel" className={champ} />
        </div>
        <div>
          <label htmlFor="horaires" className={label}>Horaires</label>
          <input id="horaires" name="horaires" className={champ} autoComplete="off" />
        </div>
        <div>
          <label htmlFor="besoins" className={label}>Besoins <span className="font-normal text-muted">(séparés par des virgules)</span></label>
          <input id="besoins" name="besoins" className={champ} autoComplete="off" />
        </div>

        <fieldset className="border-t border-rule pt-4">
          <legend className="font-mono text-xs uppercase tracking-wider text-muted">Personne qui répond sur place</legend>
          <p className="mt-1 text-sm text-muted">C'est elle qu'on rappelle. Son numéro n'est jamais publié.</p>
          <div className="mt-3">
            <label htmlFor="contact_nom" className={label}>Nom</label>
            <input id="contact_nom" name="contact_nom" required minLength={2} className={champ} autoComplete="name" />
          </div>
          <div className="mt-3">
            <label htmlFor="contact_tel" className={label}>Téléphone</label>
            <input id="contact_tel" name="contact_tel" type="tel" inputMode="tel" required minLength={8} className={champ} autoComplete="tel" />
          </div>
        </fieldset>

        <button type="submit" className="min-h-11 w-full bg-ink px-4 py-3 font-semibold text-white sm:w-auto">
          Envoyer pour vérification
        </button>
      </form>
    </main>
  );
}
