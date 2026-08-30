import Link from "next/link";
import { WILAYAS } from "@/lib/wilayas";
import { type Lang, dir, etq, lien, nomWilaya, t } from "@/lib/i18n";
import { Avertissement, Bande, Barre, btnPlein } from "@/lib/ui";
import { signaler } from "./actions";

const champ = "mt-1 block w-full border border-rule bg-paper px-3 py-2.5 text-[16px] outline-none focus:border-vert focus:ring-[3px] focus:ring-vert-pale";
const label = "block text-sm font-semibold";

export function Formulaire({ lang, sp }: { lang: Lang; sp: Record<string, string | undefined> }) {
  const d = t(lang);
  return (
    <div lang={lang} dir={dir(lang)}>
      <Barre lang={lang} chemin="/signaler" />
      <Bande fine />
      <main className="mx-auto max-w-2xl px-4 pb-16 pt-5">
        <h1 className="text-2xl font-extrabold tracking-tight">{d.titreSignaler}</h1>

        <p className="mt-3 border-s-4 border-vert bg-surface py-2 ps-3 pe-3 leading-relaxed">
          <strong>{d.rienSansAppel}</strong> {d.encartSignaler}
        </p>

        {sp.envoye && <p role="status" className="mt-4 bg-fresh-bg px-3 py-2 text-fresh">{d.recu}</p>}
        {sp.erreur && <p role="alert" className="mt-4 bg-warm-bg px-3 py-2 text-warm">{d.incomplet}</p>}

        <form action={signaler} className="mt-6 space-y-4">
          <input type="hidden" name="lang" value={lang} />
          {/* Pot de miel : invisible pour les humains, rempli par les robots. */}
          <div className="hidden" aria-hidden="true">
            <label htmlFor="site">Site web</label>
            <input id="site" name="site" tabIndex={-1} autoComplete="off" />
          </div>
          <div>
            <label htmlFor="code" className={label}>{d.wilaya}</label>
            <select id="code" name="code" required className={champ} defaultValue="">
              <option value="" disabled>{d.choisir}</option>
              {WILAYAS.map((w) => <option key={w.code} value={w.code}>{w.code} — {nomWilaya(lang, w)}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="commune" className={label}>{d.commune}</label>
            <input id="commune" name="commune" className={champ} autoComplete="off" />
          </div>
          <div>
            <label htmlFor="nom" className={label}>{d.nomLieu}</label>
            <input id="nom" name="nom" required minLength={3} className={champ} autoComplete="off" />
          </div>
          <div>
            <label htmlFor="adresse" className={label}>{d.adresse}</label>
            <input id="adresse" name="adresse" required minLength={5} className={champ} autoComplete="off" />
          </div>
          <div>
            <label htmlFor="tel" className={label}>{d.telPoint} <span className="font-normal text-muted">{d.facultatif}</span></label>
            <input id="tel" name="tel" type="tel" inputMode="tel" dir="ltr" className={champ} />
          </div>
          <fieldset className="border-t-2 border-signal-text pt-4">
            <legend className={`text-xs text-muted ${etq(lang)}`}>{d.personneSurPlace}</legend>
            <p className="mt-1 text-sm text-muted">{d.personneNote}</p>
            <div className="mt-3">
              <label htmlFor="contact_nom" className={label}>{d.nom}</label>
              <input id="contact_nom" name="contact_nom" required minLength={2} className={champ} autoComplete="name" />
            </div>
            <div className="mt-3">
              <label htmlFor="contact_tel" className={label}>{d.telephone}</label>
              <input id="contact_tel" name="contact_tel" type="tel" inputMode="tel" dir="ltr" required minLength={8} className={champ} autoComplete="tel" />
            </div>
          </fieldset>

          <button type="submit" className={`${btnPlein} w-full sm:w-auto`}>{d.envoyerVerif}</button>
        </form>
        <Avertissement lang={lang} />
        <p className="mt-3 text-sm text-muted">
          <Link href={lien(lang, "/")} className="text-vert underline">{d.toutesWilayas}</Link>
        </p>
      </main>
    </div>
  );
}
