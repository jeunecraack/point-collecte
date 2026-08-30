import type { Metadata } from "next";
import { t } from "@/lib/i18n";
import { Formulaire } from "../../signaler/formulaire";

export const metadata: Metadata = { title: t("fr").titreSignaler, description: t("fr").descSignaler };

export default async function Signaler({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  return <Formulaire lang="fr" sp={await searchParams} />;
}
