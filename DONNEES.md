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
code, nom, type, commune, adresse, tel, horaires, besoins, maj, source
```

Puis Fichier → Partager → Publier sur le web → format CSV.

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
