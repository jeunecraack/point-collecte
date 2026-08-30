# Couche de données — Sheet vif + CSV de secours

## Câblage

`.env.local` :

```
SHEET_CSV_URL=https://docs.google.com/spreadsheets/d/<ID>/gviz/tq?tqx=out:csv&sheet=points
```

Laisse la variable vide et l'app lit `data/points.csv`. C'est le mode
dégradé, et c'est aussi le mode de développement local.

## Le Google Sheet

Colonnes exactes, en première ligne, en minuscules :

```
code, nom, type, commune, adresse, tel, agree, maj, source
```

Les en-têtes des bénévoles sont acceptés tels quels et remappés :

| Dans le Sheet | Modèle |
|---|---|
| `Wilaya` (nom, majuscules ou arabe, ou numéro) | `code` |
| `Association` / `Lieu` | `nom` |
| `Num1`, `Num2`, `Num3` / `Téléphone` | `tel`, `tel2`, `tel3` |
| `Localisation Maps` / `Maps` / `Lien` | `maps` (liens Google Maps seulement) |
| `Agree` / `Agréé` (OUI / NON) | `agree` |
| `Date` / `Date de vérification` | `maj` |
| `Vérifié par` / `Vérificateur` | `source` |

Une cellule `Wilaya` vide hérite de la ligne au-dessus (cellules
fusionnées). `/` ou `-` valent « vide ». Sans `Association`, la colonne `Adresse` sert de
nom du lieu (pharmacie, mosquée…). Sans les deux, la ligne est rejetée.

`maj` (date de vérification, `AAAA-MM-JJ`) et `source` (qui a appelé)
sont **facultatives** depuis le 2026-08-30 : sans date, la fiche est
marquée « non renseignée » et n'expire jamais — retirez la ligne du Sheet
quand un point ferme. Avec une date, la fiche disparaît après 10 jours.

Puis Partager → Accès général → « Tous les utilisateurs disposant du
lien », Lecteur.

### Quatre réglages à faire avant d'ouvrir aux bénévoles

1. **Colonne `tel` en texte brut.** Format → Nombre → Texte simple.
   Sinon Sheets lit `0555123456` comme un nombre et mange le zéro.
   Le code le remet, mais mieux vaut ne pas dépendre de ça.
2. **Colonne `maj` en texte, pas en date.** Sheets exporte les dates
   selon la locale de la feuille. Impose `AAAA-MM-JJ` en texte.
3. **Validation de données sur `code`** : entier entre 1 et 58.
4. **Protège la ligne d'en-têtes.** Un bénévole qui renomme `tel` en
   `téléphone` fait disparaître tous les numéros silencieusement.

## Ce que le code garantit

- Une ligne invalide est **ignorée**, pas fatale. Les autres passent.
- Zéro ligne valide dans le Sheet → repli automatique sur `data/points.csv`.
- Sheet injoignable ou HTTP 500 → même repli.
- Les rejets sont dans `rapport.rejets`, affichés sur `/admin`.

Invariant : **le site n'est jamais pire que le dernier état connu comme bon.**
