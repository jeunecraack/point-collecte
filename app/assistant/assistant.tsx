"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import type { Wilaya } from "@/lib/wilayas";
import type { ParWilaya } from "@/lib/fiches";
import { type Lang, dir, nomWilaya, t } from "@/lib/i18n";
import { type Reponse, couvertes, repondre } from "@/lib/reponse";
import { Avertissement, Bande, Barre, Entree, Silence, btnContour, puceVive } from "@/lib/ui";

type Message = { role: "user"; texte: string } | ({ role: "assistant" } & Reponse);

/** Messages proposés : un geste au lieu d'une phrase. Le texte est renvoyé tel quel dans le matching. */
function Propositions({ items, onChoix }: { items: string[]; onChoix: (s: string) => void }) {
  return (
    <ul className="mt-4 flex flex-wrap gap-2">
      {items.map((s) => (
        <li key={s}>
          <button type="button" onClick={() => onChoix(s)} className={puceVive}>{s}</button>
        </li>
      ))}
    </ul>
  );
}

export default function Assistant({ lang, par }: { lang: Lang; par: ParWilaya }) {
  const d = t(lang);
  const [messages, setMessages] = useState<Message[]>([]);
  const [memo, setMemo] = useState<Wilaya | null>(null);
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
    const r = repondre(lang, s, par, memo);
    if (r.wilaya) setMemo(r.wilaya);
    setMessages((m) => [...m, { role: "user", texte: s }, { role: "assistant", ...r }]);
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
          <span className="hidden text-xs text-muted sm:inline">{d.sansIA}</span>
        </Barre>
        <Bande fine />
      </header>

      {/* min-h-0 : sans ça le fil pousse la saisie hors écran dès quelques messages. */}
      <div role="log" aria-live="polite" className="min-h-0 flex-1 overflow-y-auto px-4 pt-4 pb-8">
        {messages.length === 0 && (
          <div className="pt-4">
            <h1 className="text-lg font-extrabold tracking-tight">{d.assistant}</h1>
            <p className="mt-1 text-sm text-muted">{d.demandeWilaya}</p>
            <Propositions items={[...couvertes(lang, par), ...d.suggestions]} onChoix={envoyer} />
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
                {m.silence && m.wilaya && <div className="mt-3"><Silence lang={lang} nom={m.commune ? `${m.commune} (${nomWilaya(lang, m.wilaya)})` : nomWilaya(lang, m.wilaya)} /></div>}
                {m.lien && <Link href={m.lien.href} className={`mt-3 text-sm ${btnContour}`}>{m.lien.label} →</Link>}
                {i === messages.length - 1 && m.propositions.length > 0 && <Propositions items={m.propositions} onChoix={envoyer} />}
              </li>
            ),
          )}
        </ol>
        <div ref={fin} />
        {messages.length === 0 && <Avertissement lang={lang} />}
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
