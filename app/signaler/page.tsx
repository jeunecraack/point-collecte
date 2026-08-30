import type { Metadata } from "next";
import { t } from "@/lib/i18n";
import { Formulaire } from "./formulaire";

export const metadata: Metadata = { title: t("ar").titreSignaler, description: t("ar").descSignaler };

export default async function Signaler({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  return <Formulaire lang="ar" sp={await searchParams} />;
}
