"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { analyser } from "@/lib/match";
import type { Wilaya } from "@/lib/wilayas";
import type { Fiche, ParWilaya } from "@/lib/fiches";
import { type Lang, dir, lien, nomWilaya, t } from "@/lib/i18n";
import { WILAYAS } from "@/lib/wilayas";
import { Avertissement, Bande, Barre, Entree, Silence, btnContour, puceVive } from "@/lib/ui";

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
  /** Messages proposés après cette réponse : l'étape suivante en un geste. */
  propositions: string[];
};
type Message = { role: "user"; texte: string } | ({ role: "assistant" } & Reponse);

/** Wilayas couvertes, comme propositions quand on ne sait pas encore où est la personne. */
const couvertes = (lang: Lang, par: ParWilaya) =>
  WILAYAS.filter((w) => par[w.code]).slice(0, 6).map((w) => nomWilaya(lang, w));

/**
 * `memo` : la wilaya du message précédent. « 15 » puis « quoi donner » → besoins à Tizi Ouzou.
 * Une wilaya citée dans le message courant remplace toujours la mémoire.
 */
function repondre(lang: Lang, q: string, par: ParWilaya, memo: Wilaya | null): Reponse & { wilaya?: Wilaya } {
  const d = t(lang);
  const a = analyser(q);
  const wilaya = a.wilaya ?? memo ?? undefined;
  const intention = a.intention;
  const nom = wilaya ? nomWilaya(lang, wilaya) : "";
  const fiches = wilaya ? (par[wilaya.code] ?? []) : [];
  const versWilaya = wilaya ? { href: lien(lang, `/${wilaya.code}`), label: d.pageWilaya(nom) } : undefined;
  const sansWilaya = (texte: string): Reponse => ({ texte, propositions: [...couvertes(lang, par), ...d.propGenerales().slice(0, 1)] });

  const points = (): Reponse => {
    if (!wilaya) return sansWilaya(d.demandeWilaya);
    if (!fiches.length) return { texte: d.rienA(nom), wilaya, silence: true, lien: versWilaya, propositions: d.propApresVide() };
    return { texte: d.pointsA(fiches.length, nom), wilaya, fiches, lien: versWilaya, propositions: d.propApresPoints(nom) };
  };

  // « urgence » est testée en premier : « le feu chez moi » reçoit le 14, pas une liste.
  switch (intention) {
    case "urgence":
      return { texte: d.urgenceReponse, urgences: true, wilaya, propositions: wilaya ? d.propWilaya(nom).slice(0, 2) : couvertes(lang, par) };

    case "quoi": {
      const besoins = [...new Set(fiches.flatMap((p) => p.besoins.split(",")).map((b) => b.trim()).filter(Boolean))];
      if (wilaya && besoins.length) return { texte: d.besoinsA(nom, besoins.join(", ")), wilaya, fiches, lien: versWilaya, propositions: d.propApresPoints(nom).slice(1) };
      if (wilaya && fiches.length) return { ...points(), texte: d.quoiGenerique + d.pointsA(fiches.length, nom) };
      return wilaya ? { texte: d.quoiGenerique + d.rienA(nom), wilaya, silence: true, lien: versWilaya, propositions: d.propApresVide() } : sansWilaya(d.quoiGenerique + d.demandeWilaya);
    }

    case "argent":
      return { texte: d.argent, wilaya, propositions: wilaya ? d.propWilaya(nom) : d.propGenerales() };

    case "sang":
      return { texte: d.sang, wilaya, propositions: wilaya ? d.propWilaya(nom) : d.propGenerales() };

    case "benevole": {
      const base = wilaya ? points() : sansWilaya(d.demandeWilaya);
      return { ...base, texte: d.benevole + base.texte };
    }

    case "ajouter":
      return { texte: d.ajouter, wilaya, lien: { href: lien(lang, "/signaler"), label: d.signalerPoint }, propositions: wilaya ? d.propWilaya(nom).slice(0, 2) : [] };

    case "ou":
    case null:
    default:
      // Wilaya seule (« 15 », « بجاية ») : on montre les points et on propose la suite.
      return points();
  }
}

/** Messages proposés : un geste au lieu d'une phrase. Le texte est renvoyé tel quel dans le matching. */
function Propositions({ items, onChoix }: { items: string[]; onChoix: (s: string) => void }) {
  return (
    <ul className="mt-4 flex flex-wrap gap-2">
      {items.map((s) => (
        <li key={s}>
          <button type="button" onClick={() => onChoix(s)} className={puceVive}>
            {s}
          </button>
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
          <div className="pt-6">
            <h1 className="text-lg font-extrabold tracking-tight">{d.assistant}</h1>
            <p className="mt-2 max-w-prose leading-relaxed text-muted">{d.introAssistant}</p>
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
                {m.silence && m.wilaya && <div className="mt-3"><Silence lang={lang} nom={nomWilaya(lang, m.wilaya)} /></div>}
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
