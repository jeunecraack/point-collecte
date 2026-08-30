import { Head, Html, Main, NextScript } from "next/document";
import { SCRIPT_THEME_TETE } from "@/lib/theme";
import { siteUrl } from "@/lib/secret";

// Arabe d'abord : la racine est RTL ; les pages /fr posent dir="ltr" lang="fr" sur leur conteneur.
export default function Document() {
  return (
    <Html lang="ar" dir="rtl">
      <Head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_THEME_TETE }} />
        {/* Vercel Web Analytics : servi par notre propre domaine, sans cookie ; balise manuelle car ces pages n'ont pas de runtime React. Absent en local. */}
        {process.env.VERCEL && <script defer src="/_vercel/insights/script.js" />}
        <link rel="icon" href="/favicon.ico" sizes="48x48" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={`${siteUrl()}/og.jpg`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
