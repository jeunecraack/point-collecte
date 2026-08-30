"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { analyser } from "@/lib/match";
import type { Wilaya } from "@/lib/wilayas";
import type { Fiche, ParWilaya } from "@/lib/fiches";
import { type Lang, dir, lien, nomWilaya, t } from "@/lib/i18n";
import { Bande, Barre, Entree, Silence, btnContour } from "@/lib/ui";

/**
 * Invariant 1 : espace de sortie fermé. Un message est soit un texte écrit dans lib/i18n.ts,
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

function repondre(lang: Lang, q: string, par: ParWilaya): Reponse {
  const d = t(lang);
  const { wilaya, intention } = analyser(q);
  const nom = wilaya ? nomWilaya(lang, wilaya) : "";
  const fiches = wilaya ? (par[wilaya.code] ?? []) : [];
  const versWilaya = wilaya ? { href: lien(lang, `/${wilaya.code}`), label: d.pageWilaya(nom) } : undefined;

  const points = (): Reponse => {
    if (!wilaya) return { texte: d.demandeWilaya };
    if (!fiches.length) return { texte: d.rienA(nom), wilaya, silence: true, lien: versWilaya };
    return { texte: d.pointsA(fiches.length, nom), wilaya, fiches, lien: versWilaya };
  };

  // « urgence » est testée en premier : « le feu chez moi » reçoit le 14, pas une liste.
  switch (intention) {
    case "urgence":
      return { texte: d.urgenceReponse, urgences: true };

    case "quoi": {
      const besoins = [...new Set(fiches.flatMap((p) => p.besoins.split(",")).map((b) => b.trim()).filter(Boolean))];
      if (wilaya && besoins.length) return { texte: d.besoinsA(nom, besoins.join(", ")), wilaya, fiches, lien: versWilaya };
      return { texte: d.quoiGenerique + (wilaya ? d.rienA(nom) : d.demandeWilaya) };
    }

    case "argent":
      return { texte: d.argent };

    case "sang":
      return { texte: d.sang };

    case "benevole": {
      const base = wilaya ? points() : { texte: d.demandeWilaya };
      return { ...base, texte: d.benevole + base.texte };
    }

    case "ajouter":
      return { texte: d.ajouter, lien: { href: lien(lang, "/signaler"), label: d.signalerPoint } };

    case "ou":
    case null:
    default:
      return points();
  }
}

export default function Assistant({ lang, par }: { lang: Lang; par: ParWilaya }) {
  const d = t(lang);
  const [messages, setMessages] = useState<Message[]>([]);
  const [texte, setTexte] = useState("");
  const fin = useRef<HTMLDivElement>(null);
  const zone = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const reduit = matchMedia("(prefers-reduced-motion: reduce)").matches;
    fin.current?.scrollIntoView({ behavior: reduit ? "auto" : "smooth", block: "end" });
  }, [messages]);

  const envoyer = (q: string) => {
    const s = q.trim();
    if (!s) return;
    setMessages((m) => [...m, { role: "user", texte: s }, { role: "assistant", ...repondre(lang, s, par) }]);
    setTexte("");
    zone.current?.focus();
  };

  const onSubmit = (e: FormEvent) => { e.preventDefault(); envoyer(texte); };
  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); envoyer(texte); }
  };

  return (
    // 100dvh, pas 100 % : le clavier mobile casse la mise en page sinon.
    <div lang={lang} dir={dir(lang)} className="mx-auto flex h-dvh max-w-2xl flex-col">
      <header>
        <Barre lang={lang} chemin="/assistant">
          <span className="text-xs text-muted">{d.sansIA}</span>
        </Barre>
        <Bande fine />
      </header>

      {/* min-h-0 : sans ça le fil pousse la saisie hors écran dès quelques messages. */}
      <div role="log" aria-live="polite" className="min-h-0 flex-1 overflow-y-auto px-4 pt-4 pb-8">
        {messages.length === 0 && (
          <div className="pt-6">
            <h1 className="text-lg font-extrabold tracking-tight">{d.assistant}</h1>
            <p className="mt-2 max-w-prose leading-relaxed text-muted">{d.introAssistant}</p>
            <ul className="mt-5 flex flex-wrap gap-2">
              {d.suggestions.map((s) => (
                <li key={s}>
                  <button type="button" onClick={() => envoyer(s)} className="min-h-11 rounded-full border-[1.5px] border-vert px-4 text-sm font-medium text-vert hover:bg-vert-pale">
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
                <p dir="auto" className="max-w-[85%] rounded-2xl rounded-ee-sm bg-band px-4 py-2.5 text-white">{m.texte}</p>
              </li>
            ) : (
              <li key={i} className="max-w-[95%]">
                <p className="leading-relaxed">{m.texte}</p>
                {m.urgences && (
                  <ul className="mt-3 divide-y divide-rule border-y border-rule">
                    {d.urgences.map((u) => (
                      <li key={u.num} className="flex items-baseline gap-3 py-2">
                        <a href={`tel:${u.num}`} dir="ltr" className="w-16 font-mono text-2xl font-bold text-signal-text underline">{u.num}</a>
                        <span>{u.nom}{u.note && <span className="block text-xs text-muted">{u.note}</span>}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {m.fiches && (
                  <ol className="mt-3 divide-y divide-rule border-y border-rule">
                    {m.fiches.map((p, j) => <li key={j} className="py-4"><Entree lang={lang} p={p} compact /></li>)}
                  </ol>
                )}
                {m.silence && m.wilaya && <div className="mt-3"><Silence lang={lang} nom={nomWilaya(lang, m.wilaya)} /></div>}
                {m.lien && <Link href={m.lien.href} className={`mt-3 text-sm ${btnContour}`}>{m.lien.label} →</Link>}
              </li>
            ),
          )}
        </ol>
        <div ref={fin} />
      </div>

      <form onSubmit={onSubmit} className="border-t border-rule bg-paper px-4 pt-3" style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}>
        <div className="flex items-end gap-2 rounded-xl border border-rule bg-paper p-2 focus-within:border-vert focus-within:ring-[3px] focus-within:ring-vert-pale">
          <textarea
            ref={zone}
            value={texte}
            onChange={(e) => setTexte(e.target.value)}
            onKeyDown={onKey}
            rows={1}
            dir="auto"
            aria-label={d.votreQuestion}
            placeholder={d.placeholder}
            // 16 px : en dessous, iOS zoome au focus.
            className="max-h-40 min-h-11 flex-1 resize-none bg-transparent px-2 py-2.5 text-[16px] leading-snug outline-none placeholder:text-muted"
          />
          <button type="submit" disabled={!texte.trim()} aria-label={d.envoyer} className="grid size-11 shrink-0 place-items-center rounded-lg bg-vert text-paper disabled:opacity-40">
            <span aria-hidden="true" className="text-lg leading-none">↑</span>
          </button>
        </div>
      </form>
    </div>
  );
}
