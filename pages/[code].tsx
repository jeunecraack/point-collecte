import type { GetStaticPaths, PageConfig } from "next";
import Head from "next/head";
import Link from "next/link";
import { WILAYAS } from "@/lib/wilayas";
import type { Fiche } from "@/lib/fiches";
import { propsWilaya, type PropsWilaya as Props } from "@/lib/props";
import { dateLoc, dir, etq, lien, nomWilaya, t } from "@/lib/i18n";
import { SIGNALER_ACTIF } from "@/lib/config";
import { Avertissement, Bande, BandeauUrgence, Barre, Entree, Silence, btnContour, btnSignaler, puceVive } from "@/lib/ui";

// Page servie sans un octet de JavaScript : adresses lisibles dès le premier paquet.
export const config: PageConfig = { unstable_runtimeJS: false };

export const getStaticPaths: GetStaticPaths = () => ({
  paths: WILAYAS.map(({ code }) => ({ params: { code } })),
  fallback: false,
});

export const getStaticProps = propsWilaya("ar");

/** Regroupe par commune, ordre alphabétique, « non renseignée » en dernier. L'ordre interne (datées d'abord) est conservé. */
function parCommune(points: Fiche[]): [string, Fiche[]][] {
  const m = new Map<string, Fiche[]>();
  for (const p of points) (m.get(p.commune) ?? m.set(p.commune, []).get(p.commune)!).push(p);
  return [...m].sort(([a], [b]) => (a === "" ? 1 : b === "" ? -1 : a.localeCompare(b, "fr")));
}

const ancre = (commune: string) =>
  "c-" + (commune || "autres").normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, "-");

export default function PageWilaya({ w, points, lang }: Props) {
  const d = t(lang);
  const nom = nomWilaya(lang, w);
  const nomAutre = lang === "ar" ? w.nom : w.nomAr;
  const n = points.length;
  const groupes = parCommune(points);
  const communes = groupes.map(([c]) => c).filter(Boolean);
  const derniere = points[0]?.maj;
  const description = n
    ? d.descWilaya(n, nom, communes.slice(0, 6).join(", "), derniere ? dateLoc(lang, derniere) : undefined)
    : d.descWilayaVide(nom);
  const chemin = `/${w.code}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: d.titreWilaya(nom),
    numberOfItems: n,
    itemListElement: points.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "LocalBusiness",
        name: p.nom,
        address: {
          "@type": "PostalAddress",
          streetAddress: p.adresse || undefined,
          addressLocality: p.commune || undefined,
          addressRegion: w.nom,
          addressCountry: "DZ",
        },
        telephone: [p.tel, p.tel2, p.tel3].filter(Boolean),
        hasMap: p.maps || undefined,
      },
    })),
  };

  return (
    <div lang={lang} dir={dir(lang)}>
      <Head>
        <title>{d.titreWilaya(nom)}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#006233" />
        <link rel="canonical" href={lien(lang, chemin)} />
        <link rel="alternate" hrefLang="ar" href={lien("ar", chemin)} />
        <link rel="alternate" hrefLang="fr" href={lien("fr", chemin)} />
        <link rel="alternate" hrefLang="x-default" href={lien("ar", chemin)} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      </Head>

      <header>
        <Barre lang={lang} chemin={chemin}>
          <Link href={lien(lang, "/")} className={`hidden text-xs text-muted hover:text-ink sm:inline ${etq(lang)}`}>
            {d.toutesWilayas}
          </Link>
        </Barre>
        <Bande>
          <div className="flex items-end gap-4">
            <span aria-hidden="true" dir="ltr" className="font-mono text-7xl font-bold leading-[.85] tracking-tighter">{w.code}</span>
            <div className="pb-0.5">
              <h1 className="text-2xl font-extrabold leading-tight tracking-tight">
                <span className="sr-only">{lang === "ar" ? `ولاية ${w.code} — ` : `Wilaya ${w.code} — `}</span>
                {nom}
              </h1>
              <p lang={lang === "ar" ? "fr" : "ar"} dir={lang === "ar" ? "ltr" : "rtl"} className="text-start text-lg text-white/85">{nomAutre}</p>
            </div>
          </div>
          <p className="mt-3 text-sm text-white/90">
            {n === 0 ? d.aucunPoint : `${d.nPoints(n)}${derniere ? ` · ${d.derniereMaj(dateLoc(lang, derniere))}` : ""}`}
          </p>
        </Bande>
      </header>

      <BandeauUrgence lang={lang} compact />

      <main className="mx-auto max-w-2xl px-4 pb-16">
        {SIGNALER_ACTIF && (
          <p className="pt-4"><Link href={lien(lang, "/signaler")} className={btnSignaler}>{d.signalerPoint}</Link></p>
        )}
        {n === 0 ? (
          <section className="py-8">
            <h2 className="mb-3 text-xl font-extrabold tracking-tight">{d.rienVerifie(nom)}</h2>
            <Silence lang={lang} nom={nom} />
            {SIGNALER_ACTIF && <p className="mt-6"><Link href={lien(lang, "/signaler")} className={btnContour}>{d.signalerA(nom)}</Link></p>}
          </section>
        ) : (
          <>
            {groupes.length > 1 && (
              <nav aria-label={d.communes} className="border-b border-rule py-4">
                <p className={`text-[11px] text-muted ${etq(lang)}`}>{d.nCommunes(groupes.length)}</p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {groupes.map(([c, fs]) => (
                    <li key={c}>
                      <a href={`#${ancre(c)}`} className={`${puceVive} min-h-9 px-3`}>
                        <span dir="auto">{c || d.communeInconnue}</span>
                        <span className="font-mono text-xs font-bold text-signal-text">{fs.length}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
            {groupes.map(([c, fs]) => (
              <section key={c} id={groupes.length > 1 ? ancre(c) : undefined} className="scroll-mt-4">
                {groupes.length > 1 && (
                  <h2 className={`mt-8 flex items-baseline gap-2 border-b-2 border-signal-text pb-1 text-base font-extrabold ${lang === "fr" ? "uppercase tracking-wide" : ""}`}>
                    <span dir="auto">{c || d.communeInconnue}</span>
                    <span className="text-xs font-normal text-signal-text tabular-nums">{d.nPointsCourt(fs.length)}</span>
                  </h2>
                )}
                <ol className="divide-y divide-rule">
                  {fs.map((p, i) => (
                    <li key={i} className="py-6"><Entree lang={lang} p={p} sansCommune={groupes.length > 1} /></li>
                  ))}
                </ol>
              </section>
            ))}
          </>
        )}
        <footer>
          <Avertissement lang={lang} />
          {SIGNALER_ACTIF && (
            <p className="mt-3 text-sm text-muted">
              {d.footerFiche} <Link href={lien(lang, "/signaler")} className="text-vert underline">{d.signalezLe}</Link>.
            </p>
          )}
        </footer>
      </main>
    </div>
  );
}
