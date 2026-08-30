import type { PageConfig } from "next";
import Head from "next/head";
import Link from "next/link";
import { WILAYAS } from "@/lib/wilayas";
import { propsAccueil, type PropsAccueil as Props } from "@/lib/props";
import { dir, etq, etqLarge, lien, nomWilaya, t } from "@/lib/i18n";
import { Avertissement, Bande, BandeauUrgence, Barre, Pastille } from "@/lib/ui";

export const config: PageConfig = { unstable_runtimeJS: false };

export const getStaticProps = propsAccueil("ar");

export default function Accueil({ couvertes, total, recentes, lang }: Props) {
  const d = t(lang);
  const part = total ? Math.round((100 * recentes) / total) : 0;
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
        <p className="max-w-prose pt-6 pb-8 leading-relaxed">{d.lede}</p>

        <section aria-labelledby="couvertes">
          <h2 id="couvertes" className={`text-xs text-muted ${etq(lang)}`}>{d.couvertes(couvertes.length)}</h2>
          {couvertes.length === 0 ? (
            <p className="mt-3 max-w-prose">
              {d.aucuneCouverte} <Link href={lien(lang, "/signaler")} className="text-vert underline">{d.signalezLe}</Link>.
            </p>
          ) : (
            <ol className="mt-2 divide-y divide-rule border-y border-rule">
              {couvertes.map(({ w, n, maj, f }) => (
                <li key={w.code}>
                  <Link href={lien(lang, `/${w.code}`)} className="flex items-start gap-4 border-s-4 border-transparent py-3 ps-2 hover:border-vert hover:bg-surface">
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
          {total > 0 && (
            <div className="mt-4">
              <div className="h-1.5 w-full bg-surface" role="img" aria-label={d.jauge(part, recentes, total)}>
                <div className="h-full bg-vert" style={{ width: `${part}%` }} />
              </div>
              <p className="mt-2 text-xs text-muted tabular-nums">{d.jauge(part, recentes, total)}</p>
            </div>
          )}
        </section>

        <section className="mt-10 grid gap-3 sm:grid-cols-2">
          <Link href={lien(lang, "/assistant")} className="block border-[1.5px] border-vert p-4 hover:bg-vert-pale">
            <span className="block font-semibold">{d.poserQuestion}</span>
            <span className="mt-1 block text-sm text-muted">{d.poserQuestionNote}</span>
          </Link>
          <Link href={lien(lang, "/signaler")} className="block border border-rule p-4 hover:bg-surface">
            <span className="block font-semibold">{d.signalerPoint}</span>
            <span className="mt-1 block text-sm text-muted">{d.signalerPointNote}</span>
          </Link>
        </section>

        <details className="mt-10">
          <summary className={`cursor-pointer text-xs text-muted ${etq(lang)}`}>{d.toutes58}</summary>
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
        </details>
        <Avertissement lang={lang} />
      </main>
    </div>
  );
}
