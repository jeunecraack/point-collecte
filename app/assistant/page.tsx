import type { Metadata } from "next";
import { fichesParWilaya } from "@/lib/fiches";
import { t } from "@/lib/i18n";
import Assistant from "./assistant";

export const revalidate = 60;
export const metadata: Metadata = { title: t("ar").assistant, description: t("ar").introAssistant, robots: { index: false } };

export default async function Page() {
  // Chargées une fois côté serveur, passées en props. Aucun appel API ensuite.
  const { par } = await fichesParWilaya();
  return <Assistant lang="ar" par={par} />;
}
