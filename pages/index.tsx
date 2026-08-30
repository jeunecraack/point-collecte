import type { GetStaticProps, PageConfig } from "next";
import Head from "next/head";
import Link from "next/link";
import { WILAYAS, type Wilaya } from "@/lib/wilayas";
import { fichesParWilaya } from "@/lib/fiches";
import { Bande, BandeauUrgence, Pastille, pluriel } from "@/lib/ui";

export const config: PageConfig = { unstable_runtimeJS: false };

type Couverte = { w: Wilaya; n: number; maj: string; f: { jours: number; niveau: "frais" | "tiede" | "perime" | "inconnu" } };
type Props = { couvertes: Couverte[]; total: number; recentes: number };

export const getStaticProps: GetStaticProps<Props> = async () => {
  const { par } = await fichesParWilaya();
  const couvertes = WILAYAS.filter((w) => par[w.code]).map((w) => {
    const fiches = par[w.code];
    return { w, n: fiches.length, maj: fiches[0].maj, f: fiches[0].f };
  });
  const toutes = Object.values(par).flat();
  return {
    props: {
      couvertes,
      total: toutes.length,
      // L'indicateur qui compte : part des fiches vérifiées il y a moins de 48 h.
      recentes: toutes.filter((p) => p.f.jours <= 1).length,
    },
    revalidate: 60,
  };
};

export default function Accueil({ couvertes, total, recentes }: Props) {
  const part = total ? Math.round((100 * recentes) / total) : 0;
  return (
    <>
      <Head>
        <title>Points de collecte de dons — incendies Algérie</title>
        <meta name="description" content="Où déposer ses dons, maintenant, dans sa wilaya. Adresses vérifiées par téléphone et datées. Numéros d'urgence." />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#006233" />
        <link rel="canonical" href="/" />
      </Head>

      <Bande>
        <div className="flex items-start gap-4">
          <img src="/emblem-white.png" alt="Points de collecte — incendies Algérie" width={72} height={84} className="h-[84px] w-auto shrink-0" />
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-white/80">Incendies · dons · Algérie</p>
            <h1 className="mt-1 text-3xl font-extrabold leading-tight tracking-tight">Où déposer vos dons, maintenant.</h1>
          </div>
        </div>
      </Bande>
      <BandeauUrgence />

      <main className="mx-auto max-w-2xl px-4 pb-16">
        <p className="max-w-prose pt-6 pb-8 leading-relaxed">
          Chaque adresse ci-dessous a été confirmée par un appel, et porte sa date. Une fiche de plus de
          10 jours disparaît d'elle-même. Pas de capture d'écran, pas de « on m'a dit ».
        </p>

        <section aria-labelledby="couvertes">
          <h2 id="couvertes" className="font-mono text-xs uppercase tracking-wider text-muted">
            Wilayas couvertes — {couvertes.length}
          </h2>
          {couvertes.length === 0 ? (
            <p className="mt-3 max-w-prose">
              Aucun point vérifié pour l'instant. Si vous tenez un point de collecte,{" "}
              <Link href="/signaler" className="text-vert underline">signalez-le</Link>.
            </p>
          ) : (
            <ol className="mt-2 divide-y divide-rule border-y border-rule">
              {couvertes.map(({ w, n, maj, f }) => (
                <li key={w.code}>
                  <Link href={`/${w.code}`} className="flex items-start gap-4 border-l-4 border-transparent py-3 pl-2 hover:border-vert hover:bg-surface">
                    <span aria-hidden="true" className="w-12 shrink-0 font-mono text-3xl font-bold leading-none tracking-tighter">
                      {w.code}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold leading-tight">
                        <span className="sr-only">Wilaya {w.code} </span>{w.nom}
                        <span className="font-normal text-muted"> · {pluriel(n, "point")}</span>
                      </span>
                      <span className="mt-1.5 block"><Pastille maj={maj} f={f} /></span>
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
          {total > 0 && (
            <div className="mt-4">
              <div className="h-1.5 w-full bg-surface" role="img" aria-label={`${part} % des fiches vérifiées depuis moins de 48 heures`}>
                <div className="h-full bg-vert" style={{ width: `${part}%` }} />
              </div>
              <p className="mt-2 font-mono text-xs text-muted">
                {part} % des fiches vérifiées depuis moins de 48 h ({recentes}/{total}).
              </p>
            </div>
          )}
        </section>

        <section className="mt-10 grid gap-3 sm:grid-cols-2">
          <Link href="/assistant" className="block border-[1.5px] border-vert p-4 hover:bg-vert-pale">
            <span className="block font-semibold">Poser une question</span>
            <span className="mt-1 block text-sm text-muted">
              « Où déposer à Béjaïa ? », « quoi donner ? ». L'assistant reconnaît votre wilaya et votre
              besoin — sans IA, sans inventer.
            </span>
          </Link>
          <Link href="/signaler" className="block border border-rule p-4 hover:bg-surface">
            <span className="block font-semibold">Signaler un point</span>
            <span className="mt-1 block text-sm text-muted">
              Vous tenez ou connaissez un point de collecte. On vous rappelle avant de publier.
            </span>
          </Link>
        </section>

        <details className="mt-10">
          <summary className="cursor-pointer font-mono text-xs uppercase tracking-wider text-muted">
            Toutes les wilayas — 58
          </summary>
          <ul className="mt-3 grid grid-cols-2 gap-x-4 sm:grid-cols-3">
            {WILAYAS.map((w) => (
              <li key={w.code}>
                <Link href={`/${w.code}`} className="flex items-baseline gap-2 py-1.5 hover:underline">
                  <span className="font-mono text-sm text-muted">{w.code}</span>
                  <span className="truncate">{w.nom}</span>
                </Link>
              </li>
            ))}
          </ul>
        </details>
      </main>
    </>
  );
}
