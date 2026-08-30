"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { analyser } from "@/lib/match";
import type { Wilaya } from "@/lib/wilayas";
import type { Fiche, ParWilaya } from "@/lib/fiches";
import { Bande, Entree, Marque, Silence, URGENCES, btnContour, estArabe } from "@/lib/ui";

/**
 * Invariant 1 : espace de sortie fermé. Un message est soit un texte écrit ici,
 * soit des fiches du dataset. Aucune génération.
 */
type Reponse = {
  texte: string;
  urgences?: true;
  wilaya?: Wilaya;
  fiches?: Fiche[];
  silence?: true;
  lien?: { href: string; label: string };
};
type Message = { role: "user"; texte: string } | ({ role: "assistant" } & Reponse);

const DEMANDE_WILAYA = "Dites-moi votre wilaya — son nom ou son numéro : « Béjaïa », « 06 », « w15 »…";

function repondre(q: string, par: ParWilaya): Reponse {
  const { wilaya, intention } = analyser(q);
  const fiches = wilaya ? (par[wilaya.code] ?? []) : [];
  const versWilaya = wilaya ? { href: `/${wilaya.code}`, label: `Page ${wilaya.nom}` } : undefined;

  const points = (): Reponse => {
    if (!wilaya) return { texte: DEMANDE_WILAYA };
    if (!fiches.length)
      return { texte: `Rien de vérifié à ${wilaya.nom} pour l'instant.`, wilaya, silence: true, lien: versWilaya };
    return {
      texte: `${fiches.length} point${fiches.length > 1 ? "s" : ""} de collecte vérifié${fiches.length > 1 ? "s" : ""} à ${wilaya.nom} :`,
      wilaya,
      fiches,
      lien: versWilaya,
    };
  };

  // « urgence » est testée en premier : « le feu chez moi » reçoit le 14, pas une liste.
  switch (intention) {
    case "urgence":
      return { texte: "Si vous êtes en danger, appelez maintenant :", urgences: true };

    case "quoi": {
      const besoins = [...new Set(fiches.flatMap((p) => p.besoins.split(",")).map((b) => b.trim()).filter(Boolean))];
      if (wilaya && besoins.length)
        return { texte: `Besoins signalés à ${wilaya.nom} : ${besoins.join(", ")}. Le détail par point :`, wilaya, fiches, lien: versWilaya };
      return {
        texte:
          "Chaque fiche liste ses besoins du jour — ils changent vite, fiez-vous à la fiche plutôt qu'à une liste générale. " +
          (wilaya ? `Rien de vérifié à ${wilaya.nom} pour l'instant.` : DEMANDE_WILAYA),
      };
    }

    case "argent":
      return {
        texte:
          "Nous ne collectons pas d'argent et n'affichons aucun numéro de compte. Pour un don financier, passez par le Croissant-Rouge algérien ou un organisme officiel, via leurs canaux à eux — jamais via un compte partagé sur les réseaux sociaux.",
      };

    case "sang":
      return {
        texte:
          "Le don de sang passe par le centre de transfusion sanguine (CTS) de votre wilaya ou l'hôpital le plus proche. Nous n'affichons pas de créneaux de collecte de sang.",
      };

    case "benevole": {
      const base = wilaya ? points() : { texte: DEMANDE_WILAYA };
      return {
        ...base,
        texte:
          "Le plus utile : vous présenter directement à un point de collecte, ils manquent toujours de bras. Le comité de wilaya du Croissant-Rouge algérien inscrit aussi des volontaires. " +
          base.texte,
      };
    }

    case "ajouter":
      return {
        texte: "Vous connaissez un point qui n'est pas listé, ou une fiche à corriger ? Passez par le formulaire — on vous rappelle pour vérifier avant de publier.",
        lien: { href: "/signaler", label: "Signaler un point" },
      };

    case "ou":
    case null:
    default:
      return points();
  }
}

const SUGGESTIONS = ["Où déposer à Béjaïa ?", "Quoi donner ?", "Numéros d'urgence", "Je veux être bénévole"];

export default function Assistant({ par }: { par: ParWilaya }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [texte, setTexte] = useState("");
  const fin = useRef<HTMLDivElement>(null);
  const zone = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const reduit = matchMedia("(prefers-reduced-motion: reduce)").matches;
    fin.current?.scrollIntoView({ behavior: reduit ? "auto" : "smooth", block: "end" });
  }, [messages]);

  const envoyer = (q: string) => {
    const t = q.trim();
    if (!t) return;
    setMessages((m) => [...m, { role: "user", texte: t }, { role: "assistant", ...repondre(t, par) }]);
    setTexte("");
    zone.current?.focus();
  };

  const onSubmit = (e: FormEvent) => { e.preventDefault(); envoyer(texte); };
  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); envoyer(texte); }
  };

  return (
    // 100dvh, pas 100 % : le clavier mobile casse la mise en page sinon.
    <div className="mx-auto flex h-dvh max-w-2xl flex-col">
      <header>
        <div className="flex items-center justify-between px-4 py-3">
          <Marque />
          <h1 className="text-sm font-semibold">Assistant</h1>
          <span className="font-mono text-xs text-muted">sans IA</span>
        </div>
        <Bande fine />
      </header>

      {/* min-h-0 : sans ça le fil pousse la saisie hors écran dès quelques messages. */}
      <div role="log" aria-live="polite" className="min-h-0 flex-1 overflow-y-auto px-4 pt-4 pb-8">
        {messages.length === 0 && (
          <div className="pt-6">
            <p className="max-w-prose leading-relaxed text-muted">
              Je reconnais votre wilaya et ce que vous cherchez, et je ne réponds qu'avec des fiches vérifiées.
              Je n'invente rien : si je n'ai pas l'information, je vous le dis.
            </p>
            <ul className="mt-5 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    onClick={() => envoyer(s)}
                    className="min-h-11 rounded-full border-[1.5px] border-vert px-4 text-sm font-medium text-vert hover:bg-vert-pale"
                  >
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <ol className="space-y-5">
          {messages.map((m, i) =>
            m.role === "user" ? (
              <li key={i} className="flex justify-end">
                <p dir={estArabe(m.texte) ? "rtl" : undefined} className="max-w-[85%] rounded-2xl rounded-br-sm bg-band px-4 py-2.5 text-white">
                  {m.texte}
                </p>
              </li>
            ) : (
              <li key={i} className="max-w-[95%]">
                <p dir={estArabe(m.texte) ? "rtl" : undefined} className="leading-relaxed">{m.texte}</p>
                {m.urgences && (
                  <ul className="mt-3 divide-y divide-rule border-y border-rule">
                    {URGENCES.map((u) => (
                      <li key={u.num} className="flex items-baseline gap-3 py-2">
                        <a href={`tel:${u.num}`} className="w-16 font-mono text-2xl font-bold text-signal-text underline">{u.num}</a>
                        <span>{u.nom}{u.note && <span className="block text-xs text-muted">{u.note}</span>}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {m.fiches && (
                  <ol className="mt-3 divide-y divide-rule border-y border-rule">
                    {m.fiches.map((p, j) => <li key={j} className="py-4"><Entree p={p} compact /></li>)}
                  </ol>
                )}
                {m.silence && m.wilaya && <div className="mt-3"><Silence nom={m.wilaya.nom} /></div>}
                {m.lien && (
                  <Link href={m.lien.href} className={`mt-3 text-sm ${btnContour}`}>
                    {m.lien.label} →
                  </Link>
                )}
              </li>
            ),
          )}
        </ol>
        <div ref={fin} />
      </div>

      <form
        onSubmit={onSubmit}
        className="border-t border-rule bg-paper px-4 pt-3"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
      >
        <div className="flex items-end gap-2 rounded-xl border border-rule bg-paper p-2 focus-within:border-vert focus-within:ring-[3px] focus-within:ring-vert-pale">
          <textarea
            ref={zone}
            value={texte}
            onChange={(e) => setTexte(e.target.value)}
            onKeyDown={onKey}
            rows={1}
            dir={estArabe(texte) ? "rtl" : undefined}
            aria-label="Votre question"
            placeholder="Votre wilaya, votre question…"
            // 16 px : en dessous, iOS zoome au focus.
            className="max-h-40 min-h-11 flex-1 resize-none bg-transparent px-2 py-2.5 text-[16px] leading-snug outline-none placeholder:text-muted"
          />
          <button
            type="submit"
            disabled={!texte.trim()}
            aria-label="Envoyer"
            className="grid size-11 shrink-0 place-items-center rounded-lg bg-vert text-paper disabled:opacity-40"
          >
            <span aria-hidden="true" className="text-lg leading-none">↑</span>
          </button>
        </div>
      </form>
    </div>
  );
}
