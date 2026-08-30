import Link from "next/link";
import type { ReactNode } from "react";
import type { Fiche } from "./fiches";

/** Seules données factuelles autorisées en dur : numéros nationaux, vérifiés. */
export const URGENCES = [
  { num: "14", nom: "Protection civile", note: "incendies — numéro vert 1021" },
  { num: "16", nom: "SAMU", note: "" },
  { num: "17", nom: "Police secours", note: "numéro vert 1548" },
  { num: "1055", nom: "Gendarmerie nationale", note: "" },
] as const;

export const dateFr = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-DZ", { day: "numeric", month: "long" });

export const estArabe = (s: string) => /[؀-ۿ]/.test(s);

export const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? "s" : ""}`;

/** Emblème + retour à l'accueil. Couleur sur blanc, blanc sur la bande verte. */
export function Marque({ surBande = false, label = "Points de collecte" }: { surBande?: boolean; label?: string }) {
  return (
    <Link href="/" className={`inline-flex items-center gap-2.5 hover:underline ${surBande ? "text-white" : ""}`}>
      <img src={surBande ? "/emblem-white.png" : "/emblem.png"} alt="" width={36} height={42} className="h-[42px] w-auto" />
      <span className="text-sm font-semibold leading-tight">{label}</span>
    </Link>
  );
}

/**
 * La bande verte : la signature. Pleine sur l'accueil et les pages wilaya,
 * réduite à un filet de 6 px sur les pages secondaires.
 */
export function Bande({ children, fine = false }: { children?: ReactNode; fine?: boolean }) {
  if (fine) return <div aria-hidden="true" className="h-1.5 bg-band" />;
  return (
    <div className="bg-band text-white">
      <div className="mx-auto max-w-2xl px-4 py-4">{children}</div>
    </div>
  );
}

/** Bandeau rouge : le seul élément rouge du site. */
export function BandeauUrgence({ compact = false }: { compact?: boolean }) {
  return (
    <section aria-label="Numéros d'urgence" className="bg-signal text-white">
      <div className={`mx-auto max-w-2xl px-4 ${compact ? "py-2" : "py-4"}`}>
        {!compact && (
          <p className="mb-2 font-mono text-xs uppercase tracking-widest">Urgence — appeler avant tout</p>
        )}
        <ul className={`flex flex-wrap gap-x-5 gap-y-1 ${compact ? "text-sm" : ""}`}>
          {URGENCES.map((u) => (
            <li key={u.num} className="flex items-baseline gap-2">
              <a
                href={`tel:${u.num}`}
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
export function Pastille({ maj, f }: Pick<Fiche, "maj" | "f">) {
  if (f.niveau === "perime" || f.niveau === "inconnu") return null;
  const age = f.jours === 0 ? "aujourd'hui" : f.jours === 1 ? "hier" : `il y a ${f.jours} j`;
  const tone = f.niveau === "frais" ? "bg-fresh-bg text-fresh" : "bg-warm-bg text-warm";
  return (
    <span className={`inline-flex items-center gap-2 rounded-sm px-2 py-1 font-mono text-xs ${tone}`}>
      <span aria-hidden="true" className="size-2 rounded-full bg-current" />
      <span>Vérifié le {dateFr(maj)} — {age}</span>
    </span>
  );
}

/** Badge « Agréé par l'État » : plein vert, uniquement si la colonne `agree` de la fiche est renseignée. */
export function Agree() {
  return (
    <span className="inline-flex items-center gap-1.5 bg-vert px-2 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-paper">
      <span aria-hidden="true">✓</span> Agréé par l'État
    </span>
  );
}

function Ligne({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[6.5rem_1fr] items-baseline gap-x-3 py-1">
      <dt className="font-mono text-[11px] uppercase tracking-wider text-muted">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}

/** Une entrée du registre. Tout ce qui est affiché vient de la fiche, rien d'autre. */
export function Entree({ p, compact = false }: { p: Fiche; compact?: boolean }) {
  return (
    <article dir={estArabe(p.nom + p.adresse) ? "rtl" : undefined}>
      <span className="flex flex-wrap items-center gap-2">
        <Pastille maj={p.maj} f={p.f} />
        {p.agree && <Agree />}
      </span>
      <h3 className={`mt-3 font-extrabold leading-snug tracking-tight ${compact ? "text-lg" : "text-xl"}`}>{p.nom}</h3>
      {(p.commune || p.type !== "Point de collecte") && (
        <p className="text-sm text-muted">
          {[p.type !== "Point de collecte" ? p.type : "", p.commune].filter(Boolean).join(" · ")}
        </p>
      )}
      {p.adresse && p.adresse !== p.nom && <p className={`mt-2 leading-snug ${compact ? "" : "text-lg"}`}>{p.adresse}</p>}
      <dl className="mt-3">
        {p.horaires && (
          <Ligne label="Horaires"><span className="font-mono text-sm">{p.horaires}</span></Ligne>
        )}
        {(p.tel || p.tel2 || p.tel3) && (
          <Ligne label="Téléphone">
            <span className="flex flex-wrap gap-x-5">
              {[p.tel, p.tel2, p.tel3].filter(Boolean).map((t) => (
                <a key={t} href={`tel:${t}`} className="inline-block min-h-11 py-2 font-mono text-lg font-bold text-vert underline">
                  {t}
                </a>
              ))}
            </span>
          </Ligne>
        )}
        {p.maps && (
          <Ligne label="Itinéraire">
            <a href={p.maps} rel="noopener" className="inline-block min-h-11 py-2 text-vert underline">
              Ouvrir dans Google Maps
            </a>
          </Ligne>
        )}
        {p.besoins && (
          <Ligne label="Besoins">
            <ul className="flex flex-wrap gap-1.5">
              {p.besoins.split(",").map((b) => b.trim()).filter(Boolean).map((b) => (
                <li key={b} className="rounded-sm border border-rule px-2 py-0.5 text-sm">{b}</li>
              ))}
            </ul>
          </Ligne>
        )}
        <Ligne label="Source"><span className="text-sm text-muted">{p.source}</span></Ligne>
      </dl>
    </article>
  );
}

/** Invariant 4 : wilaya sans point → on le dit, on renvoie vers les officiels, jamais vers une voisine. */
export function Silence({ nom }: { nom: string }) {
  return (
    <>
      <p className="max-w-prose leading-relaxed">
        On ne publie que des points confirmés par téléphone. Tant qu'aucun bénévole n'a vérifié un
        point à {nom}, il n'y a rien à afficher ici — plutôt que de vous envoyer vers une adresse incertaine.
      </p>
      <ul className="mt-4 space-y-3">
        <li>
          <span className="font-semibold">Protection civile</span> —{" "}
          <a href="tel:14" className="font-mono font-bold text-vert underline">14</a> · numéro vert{" "}
          <a href="tel:1021" className="font-mono font-bold text-vert underline">1021</a>
        </li>
        <li>
          <span className="font-semibold">Comité de wilaya du Croissant-Rouge algérien</span> — le comité de {nom}{" "}
          coordonne les dons localement.
        </li>
      </ul>
    </>
  );
}

/** Boutons : un seul plein par écran, les autres en contour. Jamais rouges. */
export const btnPlein = "inline-block min-h-11 bg-vert px-4 py-3 font-semibold text-paper hover:bg-vert-deep";
export const btnContour = "inline-block min-h-11 border-[1.5px] border-vert px-4 py-2.5 font-semibold text-vert hover:bg-vert-pale";

/** Page introuvable, partagée entre pages/404 et app/not-found. Même perdu, on trouve le 14. */
export function PageIntrouvable() {
  return (
    <>
      <div className="mx-auto max-w-2xl px-4 py-3"><Marque /></div>
      <Bande>
        <p className="font-mono text-xs uppercase tracking-widest text-white/80">Erreur 404</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight">Cette page n'existe pas</h1>
      </Bande>
      <BandeauUrgence compact />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <p className="max-w-prose leading-relaxed">
          L'adresse a peut-être été mal copiée. Les pages wilaya s'écrivent avec le code à deux chiffres :{" "}
          <span className="font-mono">/06</span> pour Béjaïa, <span className="font-mono">/16</span> pour Alger.
        </p>
        <p className="mt-6"><Link href="/" className={btnContour}>Toutes les wilayas →</Link></p>
      </main>
    </>
  );
}
