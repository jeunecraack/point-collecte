# Points de collecte — incendies Algérie

Où déposer ses dons, maintenant, dans sa wilaya, avec une information
vérifiée et datée. Le produit est décrit dans [`PRODUCT.md`](PRODUCT.md)
(six invariants non négociables), le design dans [`DESIGN.md`](DESIGN.md),
la couche de données dans [`DONNEES.md`](DONNEES.md).

## Installation

```bash
bun install
cp .env.example .env.local   # toutes les variables sont optionnelles au démarrage
bun run dev                  # http://localhost:3000, lit data/points.csv
bun test                     # 30 tests, dont les 22 assertions de lib/match.test.ts
bun run build && bun run start
```

Bun sert d'outillage local. En production, le build et l'exécution restent
sous **Node** (`next build` / `next start`), jamais sous le runtime Bun de
Vercel.

## Variables d'environnement

| Variable | Rôle | Si absente |
|---|---|---|
| `SHEET_CSV_URL` | Google Sheet en CSV, source vive | défaut dans `next.config.ts` (Sheet de production) ; `SHEET_CSV_URL=` vide → `data/points.csv` |
| `REVALIDATE_SECRET` | secret attendu par `POST /api/revalidate` | route désactivée (401) |
| `ADMIN_SECRET` | mot de passe de `/admin` | page désactivée |
| `NEXT_PUBLIC_SITE_URL` | URL publique du site, pour l'image OG des aperçus WhatsApp | aperçus sans image |
| `SIGNALEMENT_WEBHOOK_URL` | reçoit les signalements en JSON (Apps Script, Make, Slack…) | les signalements vont dans les logs serveur, préfixe `[signalement]` |

## Routes

```
/                 accueil, numéros d'urgence, wilayas couvertes      pages/, ISR 60 s, zéro JS
/[code]           58 pages wilaya, indexables — le parcours principal pages/, ISR 60 s, zéro JS
/assistant        matching déterministe, aucun appel API              app/, données passées en props
/signaler         formulaire → webhook ou logs, jamais le dataset     app/, Server Action
/admin            lignes rejetées, origine, bouton de rafraîchissement app/, cookie ADMIN_SECRET
/api/revalidate   POST { "secret": … } → régénère /, /assistant, 58 wilayas
```

Pourquoi deux routeurs : les pages de lecture sont dans `pages/` avec
`unstable_runtimeJS: false`, ce qui les sert **sans un octet de
JavaScript** (≈ 6 Ko transférés pour une page wilaya, contre ≈ 185 Ko avec
le runtime App Router). L'interactif reste dans `app/`.
`revalidatePath` n'atteint pas les pages ISR de `pages/`, d'où
`res.revalidate` dans `pages/api/revalidate.ts`.

## Données

Un seul CSV, en-têtes en minuscules :

```
code, nom, type, commune, adresse, tel, horaires, besoins, agree, maj, source
```

`agree` : « oui » (ou n'importe quoi sauf vide, `non`, `no`, `0`) affiche le
badge vert « Agréé par l'État » sur la fiche. `code` 1–58, `nom` ≥ 3 caractères, `maj` en `AAAA-MM-JJ`, `source` ≥ 4
caractères (qui a vérifié). Une ligne invalide est ignorée et apparaît
dans `/admin` avec son numéro de ligne. Une fiche de plus de 9 jours
n'est pas rendue du tout.

`data/points.csv` ne contient que des placeholders (`PLACEHOLDER A
REMPLACER`, téléphones à zéros) : 4 lignes valides et 4 lignes cassées,
attendues par les tests. **Ne jamais y mettre une donnée non vérifiée par
téléphone.**

### Mise en place du Google Sheet

1. Créer une feuille nommée `points`, première ligne = les 10 en-têtes
   ci-dessus, en minuscules.
2. Format → Nombre → **Texte simple** sur les colonnes `tel` et `maj`
   (sinon Sheets mange le zéro initial et reformate les dates).
3. Données → Validation sur `code` : entier entre 1 et 58.
4. Protéger la ligne d'en-têtes.
5. Partager → Accès général → **Tous les utilisateurs disposant du lien**,
   rôle **Lecteur**. Sans ça, Google renvoie 401 au serveur et le site
   reste sur le CSV du dépôt.
6. URL à mettre dans `SHEET_CSV_URL` :
   `https://docs.google.com/spreadsheets/d/<ID>/export?format=csv`
   (premier onglet ; ajouter `&gid=<id>` pour un autre onglet).

Sheet injoignable, invalide ou vide → repli automatique sur
`data/points.csv`, avec un `console.error`. Le site n'est jamais pire que
le dernier état connu comme bon.

### Rafraîchir sans attendre

Les pages se régénèrent au plus tard 60 s après une modification. Pour
forcer :

```bash
curl -X POST https://<domaine>/api/revalidate \
  -H 'content-type: application/json' \
  -d '{"secret":"<REVALIDATE_SECRET>"}'
```

ou le bouton de `/admin`.

## Signalements

Le formulaire `/signaler` n'écrit jamais dans le dataset. Il envoie un
JSON à `SIGNALEMENT_WEBHOOK_URL` (ou le loggue). Un bénévole rappelle la
personne indiquée, confirme adresse et horaires, puis saisit la ligne
dans le Sheet. Sans cet appel, rien n'est publié.

## Déploiement Vercel

1. Importer le dépôt. Vercel détecte Next.js et `bun.lock` (installation
   avec Bun, build `next build` sous Node — ne pas ajouter `--bun`, ne pas
   mettre `bunVersion` dans un `vercel.json`).
2. Renseigner les variables d'environnement ci-dessus.
3. Déployer. Les 58 pages wilaya sont générées au build puis régénérées
   par ISR.

Aucun appel réseau vers un domaine tiers depuis le navigateur : pas de
police web, pas d'analytics. Seule image : l'emblème (14 Ko).

## Tests

```bash
bun test          # matching (22 assertions), parsing CSV (4 fiches / 4 rejets), fraîcheur
bun run lint      # tsc --noEmit (next lint n'existe plus dans Next 16)
```
