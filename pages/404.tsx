import Head from "next/head";
import type { PageConfig } from "next";
import { PageIntrouvable } from "@/lib/ui";

export const config: PageConfig = { unstable_runtimeJS: false };

export default function Introuvable() {
  return (
    <>
      <Head>
        <title>404 — نقاط الجمع / Points de collecte</title>
        <meta name="robots" content="noindex" />
      </Head>
      <PageIntrouvable />
    </>
  );
}
