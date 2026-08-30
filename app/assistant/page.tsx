import type { Metadata } from "next";
import { fichesParWilaya } from "@/lib/fiches";
import Assistant from "./assistant";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Assistant — points de collecte de dons",
  description: "Posez votre question : l'assistant reconnaît votre wilaya et votre besoin, sans IA.",
  robots: { index: false },
};

export default async function Page() {
  // Chargées une fois côté serveur, passées en props. Aucun appel API ensuite.
  const { par } = await fichesParWilaya();
  return <Assistant par={par} />;
}
