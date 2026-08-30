import type { Metadata } from "next";
import { fichesParWilaya } from "@/lib/fiches";
import { t } from "@/lib/i18n";
import Assistant from "../../assistant/assistant";

export const revalidate = 60;
export const metadata: Metadata = { title: t("fr").assistant, description: t("fr").descAssistant, robots: { index: false } };

export default async function Page() {
  const { par } = await fichesParWilaya();
  return <Assistant lang="fr" par={par} />;
}
