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

## Tokens (`app/globals.css`, `@theme`)

| Token | Valeur | Rôle |
|---|---|---|
| `paper` | `#F1F2F0` | fond de page, gris-vert froid — pas le crème |
| `ink` | `#141412` | texte |
| `muted` | `#5C5F5A` | texte secondaire, AA sur paper (5,5:1) |
| `rule` | `#C9CBC5` | filets |
| `signal` | `#C8102E` | urgence uniquement. Jamais décoratif. |
| `fresh` / `fresh-bg` | `#1F6E3D` / `#DCEFE2` | vérifié il y a ≤ 2 jours |
| `warm` / `warm-bg` | `#7A4E00` / `#FBEBC2` | vérifié il y a 3 à 9 jours |

Au-delà de 9 jours il n'y a pas de couleur : la fiche n'existe plus.

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
← Toutes les wilayas
06            Béjaïa
              بجاية
2 points vérifiés · dernière vérification le 30 août
──────────────────────────────────────────────
URGENCE   14 Protection civile · 16 SAMU · 17 Police · 1055 Gendarmerie
──────────────────────────────────────────────
● Vérifié le 30 août — aujourd'hui           (pastille, mono)
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
