/**
 * Statistique de l'assistant : part des questions sans wilaya reconnue (indicateur
 * secondaire de PRODUCT.md — révèle les alias manquants). Aucun stockage : une ligne
 * de log par question, comptée dans les logs Vercel (filtre « [stat] »).
 */
export type Stat = { type: "question"; sans_wilaya: boolean; lang: "ar" | "fr"; q?: string };

/** Le texte n'est gardé que sans wilaya (pour trouver l'alias manquant), tronqué, sans numéros de téléphone. */
export function nettoyer(brut: unknown): Stat | null {
  if (!brut || typeof brut !== "object") return null;
  const b = brut as Record<string, unknown>;
  if (b.type !== "question" || typeof b.sans_wilaya !== "boolean" || (b.lang !== "ar" && b.lang !== "fr")) return null;
  const stat: Stat = { type: "question", sans_wilaya: b.sans_wilaya, lang: b.lang };
  if (b.sans_wilaya && typeof b.q === "string") {
    const q = b.q.replace(/\d[\d\s.-]{5,}\d/g, "[num]").trim().slice(0, 80);
    if (q) stat.q = q;
  }
  return stat;
}

/** Côté navigateur : un beacon, sans attendre la réponse, sans bloquer l'assistant. */
export function envoyerStat(stat: Stat) {
  try {
    const corps = new Blob([JSON.stringify(stat)], { type: "application/json" });
    if (!navigator.sendBeacon?.("/api/stat", corps)) fetch("/api/stat", { method: "POST", body: corps, keepalive: true }).catch(() => {});
  } catch {
    /* jamais bloquant */
  }
}
