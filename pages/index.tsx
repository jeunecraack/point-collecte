import type { PageConfig } from "next";
import Head from "next/head";
import Link from "next/link";
import { WILAYAS } from "@/lib/wilayas";
import { propsAccueil, type PropsAccueil as Props } from "@/lib/props";
import { dir, etq, etqLarge, lien, nomWilaya, t } from "@/lib/i18n";
import { SIGNALER_ACTIF } from "@/lib/config";
import { Avertissement, Bande, BandeauUrgence, Barre, Pastille, btnContour, btnPlein } from "@/lib/ui";

export const config: PageConfig = { unstable_runtimeJS: false };

export const getStaticProps = propsAccueil("ar");

export default function Accueil({ couvertes, lang }: Props) {
  const d = t(lang);
  return (
    <div lang={lang} dir={dir(lang)}>
      <Head>
        <title>{d.titreAccueil}</title>
        <meta name="description" content={d.descAccueil} />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#006233" />
        <link rel="canonical" href={lien(lang, "/")} />
        <link rel="alternate" hrefLang="ar" href="/" />
        <link rel="alternate" hrefLang="fr" href="/fr" />
        <link rel="alternate" hrefLang="x-default" href="/" />
      </Head>

      <Barre lang={lang} chemin="/" />
      <Bande>
        <div className="flex items-start gap-4">
          <img src="/emblem-white.png" alt={d.titreAccueil} width={72} height={84} className="h-[84px] w-auto shrink-0" />
          <div>
            <p className={`text-xs text-white/80 ${etqLarge(lang)}`}>{d.eyebrow}</p>
            <h1 className="mt-1 text-3xl font-extrabold leading-tight tracking-tight">{d.h1}</h1>
          </div>
        </div>
      </Bande>
      <BandeauUrgence lang={lang} />

      <main className="mx-auto max-w-2xl px-4 pb-16">
        <nav aria-label={d.poserQuestion} className="grid gap-3 py-6 sm:grid-cols-2">
          <Link href={lien(lang, "/assistant")} className={`${btnPlein} text-center`}>{d.poserQuestion}</Link>
          <a href="#toutes" className={`${btnContour} text-center`}>{d.toutes58}</a>
        </nav>

        <section aria-labelledby="couvertes">
          <h2 id="couvertes" className={`text-xs text-muted ${etq(lang)}`}>{d.couvertes(couvertes.length)}</h2>
          {couvertes.length === 0 ? (
            <p className="mt-3 max-w-prose">
              {d.aucuneCouverte}{SIGNALER_ACTIF && <> <Link href={lien(lang, "/signaler")} className="text-vert underline">{d.signalezLe}</Link>.</>}
            </p>
          ) : (
            <ol className="mt-2 divide-y divide-rule border-y border-rule">
              {couvertes.map(({ w, n, maj, f }) => (
                <li key={w.code}>
                  <Link href={lien(lang, `/${w.code}`)} className="flex items-start gap-4 border-s-4 border-signal-text py-3 ps-3 hover:bg-surface">
                    <span aria-hidden="true" dir="ltr" className="w-12 shrink-0 font-mono text-3xl font-bold leading-none tracking-tighter">{w.code}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold leading-tight">
                        {nomWilaya(lang, w)}
                        <span className="font-normal text-muted"> · {d.nPointsCourt(n)}</span>
                      </span>
                      <span className="mt-1.5 block"><Pastille lang={lang} maj={maj} f={f} /></span>
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </section>

        {SIGNALER_ACTIF && (
          <section className="mt-10">
            <Link href={lien(lang, "/signaler")} className="block border-2 border-vert p-4 hover:bg-vert-pale">
              <span className="block font-semibold">{d.signalerPoint}</span>
              <span className="mt-1 block text-sm text-muted">{d.signalerPointNote}</span>
            </Link>
          </section>
        )}

        <section id="toutes" aria-labelledby="toutes-titre" className="mt-10 scroll-mt-4">
          <h2 id="toutes-titre" className={`inline-block border-b-2 border-signal-text pb-1 text-xs text-ink ${etq(lang)}`}>{d.toutes58}</h2>
          <ul className="mt-3 grid grid-cols-2 gap-x-4 sm:grid-cols-3">
            {WILAYAS.map((w) => (
              <li key={w.code}>
                <Link href={lien(lang, `/${w.code}`)} className="flex items-baseline gap-2 py-1.5 hover:underline">
                  <span dir="ltr" className="font-mono text-sm text-muted">{w.code}</span>
                  <span className="truncate">{nomWilaya(lang, w)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <Avertissement lang={lang} />
      </main>
    </div>
  );
}
