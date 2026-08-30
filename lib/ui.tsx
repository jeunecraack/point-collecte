import Link from "next/link";
import type { ReactNode } from "react";
import type { Fiche } from "./fiches";
import { type Lang, data, dateLoc, etq, etqLarge, lien, t } from "./i18n";

/** Seules données factuelles autorisées en dur : numéros nationaux, vérifiés. Libellés dans lib/i18n.ts. */
export const URGENCES = ["14", "16", "17", "1055"] as const;

/** Bascule de langue : deux liens, l'URL fait foi. Zéro JavaScript. */
export function Langue({ lang, chemin }: { lang: Lang; chemin: string }) {
  const d = t(lang);
  return (
    <nav aria-label={d.changerLangue} className="inline-flex overflow-hidden rounded-full border border-rule text-xs font-semibold">
      {(["ar", "fr"] as Lang[]).map((l) => (
        <Link
          key={l}
          href={lien(l, chemin)}
          hrefLang={l}
          lang={l}
          aria-current={l === lang ? "page" : undefined}
          className={`min-h-9 px-3 py-2 ${l === lang ? "bg-vert text-paper" : "text-muted hover:text-ink"}`}
        >
          {t(l).langue}
        </Link>
      ))}
    </nav>
  );
}

/** Emblème + retour à l'accueil. Couleur sur blanc (blanc en sombre), blanc sur la bande verte. */
export function Marque({ lang, surBande = false }: { lang: Lang; surBande?: boolean }) {
  return (
    <Link href={lien(lang, "/")} className={`inline-flex items-center gap-2.5 hover:underline ${surBande ? "text-white" : ""}`}>
      <picture>
        {!surBande && <source srcSet="/emblem-white.png" media="(prefers-color-scheme: dark)" />}
        <img src={surBande ? "/emblem-white.png" : "/emblem.png"} alt="" width={36} height={42} className="h-[42px] w-auto" />
      </picture>
      <span className="text-sm font-semibold leading-tight">{t(lang).marque}</span>
    </Link>
  );
}

/** Barre blanche du haut : marque, lien optionnel, bascule de langue. */
export function Barre({ lang, chemin, children }: { lang: Lang; chemin: string; children?: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
      <Marque lang={lang} />
      <div className="flex items-center gap-3">
        {children}
        <Langue lang={lang} chemin={chemin} />
      </div>
    </div>
  );
}

/** La bande verte : la signature. Pleine sur l'accueil et les pages wilaya, filet de 6 px ailleurs. */
export function Bande({ children, fine = false }: { children?: ReactNode; fine?: boolean }) {
  if (fine) return <div aria-hidden="true" className="h-1.5 bg-band" />;
  return (
    <div className="bg-band text-white">
      <div className="mx-auto max-w-2xl px-4 py-4">{children}</div>
    </div>
  );
}

/** Bandeau rouge : le seul élément rouge du site. */
export function BandeauUrgence({ lang, compact = false }: { lang: Lang; compact?: boolean }) {
  const d = t(lang);
  return (
    <section aria-label={d.urgenceTitre} className="bg-signal text-white">
      <div className={`mx-auto max-w-2xl px-4 ${compact ? "py-2" : "py-4"}`}>
        {!compact && <p className={`mb-2 text-xs ${etqLarge(lang)}`}>{d.urgenceTitre}</p>}
        <ul className={`flex flex-wrap gap-x-5 gap-y-1 ${compact ? "text-sm" : ""}`}>
          {d.urgences.map((u) => (
            <li key={u.num} className="flex items-baseline gap-2">
              <a
                href={`tel:${u.num}`}
                dir="ltr"
                className={`font-mono font-bold underline decoration-white/50 hover:decoration-white ${compact ? "text-lg" : "text-3xl"}`}
              >
                {u.num}
              </a>
              <span className="leading-tight">
                {u.nom}
                {!compact && u.note && <span className="block text-xs text-white/80">{u.note}</span>}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** Pastille de fraîcheur. Une fiche « perime » n'arrive jamais ici : elle est exclue en amont. */
export function Pastille({ lang, maj, f }: { lang: Lang } & Pick<Fiche, "maj" | "f">) {
  const d = t(lang);
  if (f.niveau === "perime") return null;
  if (f.niveau === "inconnu")
    return (
      <span className={`inline-flex items-center gap-2 rounded-sm bg-surface px-2 py-1 text-xs text-muted ${data(lang)}`}>
        <span aria-hidden="true" className="size-2 rounded-full border border-current" />
        <span>{d.nonDate}</span>
      </span>
    );
  const tone = f.niveau === "frais" ? "bg-fresh-bg text-fresh" : "bg-warm-bg text-warm";
  return (
    <span className={`inline-flex items-center gap-2 rounded-sm px-2 py-1 text-xs ${data(lang)} ${tone}`}>
      <span aria-hidden="true" className="size-2 rounded-full bg-current" />
      <span>{d.verifieLe(dateLoc(lang, maj), d.age(f.jours))}</span>
    </span>
  );
}

/** Badge « Agréé par l'État » : plein vert, uniquement si la colonne `agree` de la fiche est renseignée. */
export function Agree({ lang }: { lang: Lang }) {
  return (
    <span className={`inline-flex items-center gap-1.5 bg-vert px-2 py-1 text-[11px] font-bold text-paper ${etq(lang)}`}>
      <span aria-hidden="true">✓</span> {t(lang).agree}
    </span>
  );
}

function Ligne({ lang, label, children }: { lang: Lang; label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[6.5rem_1fr] items-baseline gap-x-3 py-1">
      <dt className={`text-[11px] text-muted ${etq(lang)}`}>{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}

/** Une entrée du registre. Tout ce qui est affiché vient de la fiche, rien d'autre. `dir="auto"` : chaque texte suit sa propre langue. */
export function Entree({ lang, p, compact = false, sansCommune = false }: { lang: Lang; p: Fiche; compact?: boolean; sansCommune?: boolean }) {
  const d = t(lang);
  return (
    <article>
      <span className="flex flex-wrap items-center gap-2">
        <Pastille lang={lang} maj={p.maj} f={p.f} />
        {p.agree && <Agree lang={lang} />}
      </span>
      <h3 dir="auto" className={`mt-3 font-extrabold leading-snug tracking-tight ${compact ? "text-lg" : "text-xl"}`}>{p.nom}</h3>
      {((p.commune && !sansCommune) || p.type !== "Point de collecte") && (
        <p dir="auto" className="text-sm text-muted">
          {[p.type !== "Point de collecte" ? p.type : "", sansCommune ? "" : p.commune].filter(Boolean).join(" · ")}
        </p>
      )}
      {p.adresse && p.adresse !== p.nom && (
        <p dir="auto" className={`mt-2 leading-snug ${compact ? "" : "text-lg"}`}>{p.adresse}</p>
      )}
      <dl className="mt-3">
        {p.horaires && (
          <Ligne lang={lang} label={d.horaires}><span dir="auto" className="font-mono text-sm">{p.horaires}</span></Ligne>
        )}
        {(p.tel || p.tel2 || p.tel3) && (
          <Ligne lang={lang} label={d.telephone}>
            <span className="flex flex-wrap gap-x-5">
              {[p.tel, p.tel2, p.tel3].filter(Boolean).map((n) => (
                <a key={n} href={`tel:${n}`} dir="ltr" className="inline-block min-h-11 py-2 font-mono text-lg font-bold text-vert underline">
                  {n}
                </a>
              ))}
            </span>
          </Ligne>
        )}
        {p.maps && (
          <Ligne lang={lang} label={d.itineraire}>
            <a href={p.maps} rel="noopener" className="inline-block min-h-11 py-2 text-vert underline">{d.ouvrirMaps}</a>
          </Ligne>
        )}
        {p.besoins && (
          <Ligne lang={lang} label={d.besoins}>
            <ul className="flex flex-wrap gap-1.5">
              {p.besoins.split(",").map((b) => b.trim()).filter(Boolean).map((b) => (
                <li key={b} dir="auto" className="rounded-sm border border-rule px-2 py-0.5 text-sm">{b}</li>
              ))}
            </ul>
          </Ligne>
        )}
        {p.source && <Ligne lang={lang} label={d.source}><span dir="auto" className="text-sm text-muted">{p.source}</span></Ligne>}
      </dl>
    </article>
  );
}

/** Invariant 4 : wilaya sans point → on le dit, on renvoie vers les officiels, jamais vers une voisine. */
export function Silence({ lang, nom }: { lang: Lang; nom: string }) {
  const d = t(lang);
  return (
    <>
      <p className="max-w-prose leading-relaxed">{d.silence(nom)}</p>
      <ul className="mt-4 space-y-3">
        <li>
          <span className="font-semibold">{d.protectionCivile}</span> —{" "}
          <a href="tel:14" dir="ltr" className="font-mono font-bold text-vert underline">14</a> · {d.numeroVert}{" "}
          <a href="tel:1021" dir="ltr" className="font-mono font-bold text-vert underline">1021</a>
        </li>
        <li>
          <span className="font-semibold">{d.croissantRouge}</span> — {d.croissantRougeNote(nom)}
        </li>
      </ul>
    </>
  );
}

/** Boutons : un seul plein par écran, les autres en contour. Jamais rouges. */
export const btnPlein = "inline-block min-h-11 bg-vert px-4 py-3 font-semibold text-paper hover:bg-vert-deep";
export const btnContour = "inline-block min-h-11 border-[1.5px] border-vert px-4 py-2.5 font-semibold text-vert hover:bg-vert-pale";

/** Page introuvable, bilingue, partagée entre pages/404 et app/not-found. Même perdu, on trouve le 14. */
export function PageIntrouvable() {
  return (
    <>
      <Barre lang="ar" chemin="/" />
      <Bande>
        <p className="text-xs text-white/80">{t("ar").erreur404}</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight">{t("ar").introuvable}</h1>
        <p lang="fr" dir="ltr" className="mt-1 text-white/85">{t("fr").introuvable}</p>
      </Bande>
      <BandeauUrgence lang="ar" compact />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <p className="max-w-prose leading-relaxed">{t("ar").introuvableNote}</p>
        <p lang="fr" dir="ltr" className="mt-3 max-w-prose leading-relaxed text-muted">{t("fr").introuvableNote}</p>
        <p className="mt-6 flex flex-wrap gap-3">
          <Link href="/" className={btnContour}>{t("ar").toutesWilayas}</Link>
          <Link href="/fr" lang="fr" className={btnContour}>{t("fr").toutesWilayas}</Link>
        </p>
      </main>
    </>
  );
}
