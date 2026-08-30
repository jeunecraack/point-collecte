import type { GetStaticPaths, GetStaticProps, PageConfig } from "next";
import Head from "next/head";
import Link from "next/link";
import { WILAYAS, wilayaParCode, type Wilaya } from "@/lib/wilayas";
import { getPointsWilaya } from "@/lib/points";
import { visibles, type Fiche } from "@/lib/fiches";
import { BandeauUrgence, Entree, Marque, Silence, dateFr, pluriel } from "@/lib/ui";

// Page servie sans un octet de JavaScript : adresses lisibles dès le premier paquet.
export const config: PageConfig = { unstable_runtimeJS: false };

type Props = { w: Wilaya; points: Fiche[] };

export const getStaticPaths: GetStaticPaths = () => ({
  paths: WILAYAS.map(({ code }) => ({ params: { code } })),
  fallback: false,
});

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const w = wilayaParCode(String(params?.code));
  if (!w) return { notFound: true };
  return { props: { w, points: visibles(await getPointsWilaya(w.code)) }, revalidate: 60 };
};

export default function PageWilaya({ w, points }: Props) {
  const n = points.length;
  const communes = [...new Set(points.map((p) => p.commune).filter(Boolean))];
  const description = n
    ? `${pluriel(n, "point")} de collecte vérifié${n > 1 ? "s" : ""} à ${w.nom}${communes.length ? ` (${communes.join(", ")})` : ""}. Dernière vérification le ${dateFr(points[0].maj)}. Adresses, horaires et téléphones.`
    : `Aucun point de collecte vérifié à ${w.nom} pour l'instant. Numéros d'urgence et orientation vers la Protection civile.`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Points de collecte de dons — ${w.nom}`,
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
        openingHours: p.horaires || undefined,
      },
    })),
  };

  return (
    <>
      <Head>
        <title>{`Points de collecte de dons — ${w.nom}`}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#f1f2f0" />
        <link rel="canonical" href={`/${w.code}`} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
      </Head>

      <header className="mx-auto max-w-2xl px-4 pt-5 pb-4">
        <div className="flex items-center justify-between">
          <Marque />
          <Link href="/" className="font-mono text-xs uppercase tracking-wider text-muted hover:text-ink">
            Toutes les wilayas
          </Link>
        </div>
        <div className="mt-3 flex items-end gap-4">
          <span aria-hidden="true" className="font-mono text-7xl font-bold leading-none tracking-tighter">
            {w.code}
          </span>
          <div className="pb-1">
            <h1 className="text-2xl font-extrabold leading-tight tracking-tight">
              <span className="sr-only">Wilaya {w.code} — </span>
              {w.nom}
            </h1>
            <p dir="rtl" lang="ar" className="text-left text-lg text-muted">{w.nomAr}</p>
          </div>
        </div>
        <p className="mt-3 text-sm text-muted">
          {n === 0
            ? "Aucun point de collecte vérifié pour l'instant."
            : `${pluriel(n, "point")} de collecte vérifié${n > 1 ? "s" : ""} · dernière vérification le ${dateFr(points[0].maj)}`}
        </p>
      </header>

      <BandeauUrgence compact />

      <main className="mx-auto max-w-2xl px-4 pb-16">
        {n === 0 ? (
          <section className="py-8">
            <h2 className="mb-3 text-xl font-extrabold tracking-tight">Rien de vérifié à {w.nom} pour l'instant</h2>
            <Silence nom={w.nom} />
            <p className="mt-6 text-sm text-muted">
              Vous tenez un point de collecte à {w.nom} ?{" "}
              <Link href="/signaler" className="text-ink underline underline-offset-4">Signalez-le</Link>, on vous
              rappelle pour vérifier avant de publier.
            </p>
          </section>
        ) : (
          <ol className="divide-y divide-rule">
            {points.map((p, i) => (
              <li key={i} className="py-6"><Entree p={p} /></li>
            ))}
          </ol>
        )}
        <footer className="mt-10 border-t border-rule pt-4 text-sm text-muted">
          Une adresse a changé, un point a fermé ?{" "}
          <Link href="/signaler" className="text-ink underline underline-offset-4">Signalez-le</Link>. Rien n'est
          publié sans un appel de vérification.
        </footer>
      </main>
    </>
  );
}
