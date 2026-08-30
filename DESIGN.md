# Design

Un outil de terrain qu'on ouvre sur un réseau saturé, au bord d'une route,
pour savoir où déposer trois sacs de couvertures. Il doit se lire comme un
panneau, pas comme une landing page.

## Ancrage

Le **code wilaya à deux chiffres** — celui des plaques d'immatriculation.
Tout le monde connaît le sien. C'est la signature visuelle : `06` en mono,
énorme, en tête de chaque page wilaya. La route est littéralement `/06`.

Les fiches ne sont pas des cartes : ce sont des **entrées d'un registre de
vérification**, séparées par des filets. Chaque entrée commence par sa
pastille « vérifié le … » parce que c'est la seule chose qui distingue ce
site d'une capture d'écran WhatsApp.

## Interdits

- Dégradés, couleurs fluo, ombres portées décoratives, glassmorphism.
- Polices web, bibliothèques d'icônes, bibliothèques de composants.
- Images, à une exception : l'emblème (`public/emblem.png`, 14 Ko, détouré,
  affiché à 80 px sur l'accueil et 42 px ailleurs). `og.jpg` n'est chargé
  que par les aperçus WhatsApp/Google, jamais par la page.
- Cartes arrondies à bordure grise avec titre + sous-titre + bouton.
- Animation d'apparition. Le contenu est là au premier octet.
- Émoji dans l'interface (rendu variable, sens variable).

## Le drapeau comme système

Vert = vérifié, blanc = papier, rouge = urgence et rien d'autre. Pas de
croissant ni d'étoile : on prend les couleurs, pas l'emblème d'État.

## Tokens (`app/globals.css`, `@theme`)

| Token | Clair | Sombre | Rôle |
|---|---|---|---|
| `paper` | `#FFFFFF` | `#0F1913` | fond de page |
| `surface` | `#F4F7F5` | `#16241C` | surfaces secondaires, survol |
| `ink` | `#14201A` | `#EAF2EC` | texte |
| `muted` | `#5B6660` | `#9DB0A4` | texte secondaire, libellés (AA ≥ 5,5:1) |
| `rule` | `#CBD5CE` | `#2B3D32` | filets |
| `band` | `#006233` | `#006233` | la bande verte — fixe, texte blanc |
| `vert` | `#006233` | `#6FCF97` | liens, boutons, numéros, badge |
| `vert-deep` | `#014A27` | `#9BE0B7` | survol des boutons |
| `vert-pale` | `#E3F1E8` | `#16412A` | anneau de focus, survol des contours |
| `signal` | `#D21034` | `#B30E2C` | bandeau d'urgence — le seul rouge |
| `signal-text` | `#D21034` | `#FF5C72` | numéros d'urgence dans l'assistant |
| `fresh` / `fresh-bg` | `#014A27` / `#E3F1E8` | `#6FCF97` / `#16412A` | vérifié il y a ≤ 2 jours |
| `warm` / `warm-bg` | `#8A5A00` / `#FBEBC2` | `#F2C14E` / `#3D2A00` | vérifié il y a 3 à 9 jours |

Au-delà de 9 jours il n'y a pas de couleur : la fiche n'existe plus.
Le mode sombre suit `prefers-color-scheme`, sans bouton.

## Signature : deux bandes

Blanc (marque) → **vert** (code wilaya énorme en mono, nom, arabe) →
**rouge** (14 · 16 · 17 · 1055). Sur les pages secondaires la bande verte
est réduite à un filet de 6 px sous la marque.

## Typographie

Pile système, zéro octet.

- **Données** (codes, téléphones, dates, horaires) : `ui-monospace`,
  chiffres tabulaires. Une donnée se reconnaît à sa fonte avant même
  d'être lue.
- **Titres** : sans système, graisse 800, `letter-spacing: -0.02em`.
- **Corps** : sans système, 16 px / 1.5. Jamais moins de 16 px dans un
  champ de saisie (iOS zoome sinon).

Arabe : `dir="rtl"` sur tout bloc contenant `[؀-ۿ]`. La pile
système embarque des fontes arabes correctes sur toutes les plateformes.

## Structure d'une page wilaya

```
[emblème] Points de collecte              TOUTES LES WILAYAS
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ vert
06            Béjaïa
              بجاية
2 points vérifiés · dernière vérification le 30 août
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ rouge
14 Protection civile · 16 SAMU · 17 Police · 1055 Gendarmerie
──────────────────────────────────────────────
● Vérifié le 30 août — aujourd'hui  ✓ AGRÉÉ PAR L'ÉTAT (plein vert)
Nom du point
Commune
Adresse en gros, lisible à bout de bras
Horaires    ………
Téléphone   0000000000  →  <a href="tel:">
Besoins     ………
Source      qui a vérifié
──────────────────────────────────────────────
● Vérifié le 26 août — il y a 4 j            (ambre)
…
```

## Assistant

Même rendu que **Conversation / Message / PromptInput** d'AI Elements
(Vercel), reproduit en Tailwind pur : fil de messages, bulle utilisateur
alignée à droite sur fond `ink`, réponse à gauche sans bulle, zone de
saisie fixée en bas avec bouton d'envoi carré. Sans les paquets : AI
Elements tire shadcn, radix, lucide et `@ai-sdk/react`, ce qui viole
« aucune bibliothèque de composants », « pas d'icônes », « aucun appel
API » et le budget de 100 Ko.

## Accessibilité (plancher, pas objectif)

Contraste AA sur chaque paire. `:focus-visible` à 2 px `ink`, décalé.
`prefers-reduced-motion` : aucune transition. Cibles tactiles ≥ 44 px.
Un seul `<h1>` par page, adresses dans le HTML servi, sans JavaScript.
