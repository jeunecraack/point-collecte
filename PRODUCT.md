# Points de collecte — incendies Algérie

## Le problème

Pendant un épisode d'incendies, l'information sur les points de collecte de
dons circule par captures d'écran WhatsApp et publications Facebook. Elle
est dupliquée, périmée, parfois inventée. Résultat concret : des gens
chargent leur voiture et roulent 80 km vers un lieu qui ne collecte plus,
pendant que leur véhicule aurait servi ailleurs.

Le produit répond à une seule question : **où puis-je déposer mes dons,
maintenant, dans ma wilaya, avec une information vérifiée et datée ?**

## Non-objectifs

À écrire noir sur blanc, parce que chacun de ces points sera proposé et
doit être refusé :

- **Pas un chatbot IA.** Aucun LLM dans le chemin de réponse. Voir
  l'invariant n°1.
- **Pas une plateforme de paiement.** On oriente vers des organismes
  officiels, on ne collecte pas d'argent et on n'héberge pas de cagnotte.
- **Pas un site d'actualité.** On ne publie pas de bilans, de nombre de
  victimes, ni de cartes de feux actifs. D'autres le font mieux.
- **Pas un annuaire exhaustif.** Mieux vaut 12 points vérifiés que
  200 points recopiés.
- **Pas de compte utilisateur.** Aucune authentification côté public,
  aucune donnée personnelle collectée.

## Utilisateurs

| Qui | Ce qu'il veut | Par où il arrive |
|---|---|---|
| Donateur | Une adresse et un horaire fiables près de chez lui | Recherche Google « points collecte dons <wilaya> » |
| Bénévole | Où se présenter, ce qui manque aujourd'hui | Lien partagé sur WhatsApp |
| Coordinateur d'un point | Faire publier ou corriger sa fiche | Formulaire, puis appel de vérification |
| Modérateur | Voir les lignes rejetées, forcer un rafraîchissement | Page `/admin` |

Le parcours dominant est le premier. **La majorité du trafic viendra d'une
recherche Google, pas du chat.** C'est pourquoi les pages par wilaya sont
statiques et indexables, et pourquoi l'assistant conversationnel n'est
qu'une route parmi d'autres.

## Invariants

Non négociables. Toute évolution qui en casse un est refusée.

**1. Espace de sortie fermé.** Chaque réponse est soit un texte rédigé à
l'avance dans le code, soit une fiche issue du dataset. Il n'existe aucun
chemin par lequel le système peut produire une adresse, un numéro ou un
horaire qui ne figure pas dans les données. Aucune génération de texte.

**2. Provenance obligatoire.** Une fiche sans colonne `source` renseignée
n'est pas servie. Le schéma le rejette à la lecture. La règle humaine
correspondante : un point n'est publiable qu'après un appel où quelqu'un
a décroché et confirmé l'adresse et les horaires.

**3. Dégradation, jamais effondrement.** Une ligne invalide est ignorée,
les autres passent. Un Google Sheet injoignable ou vidé provoque un repli
sur le CSV du dépôt. Le site n'est jamais pire que le dernier état connu
comme bon.

**4. Le silence bat l'approximation.** Wilaya sans point vérifié → on le
dit, et on renvoie vers la Protection civile et le comité de wilaya du
Croissant-Rouge. On ne comble jamais un trou par une supposition.

**5. La fraîcheur est visible et contraignante.** Chaque fiche affiche sa
date de vérification. Au-delà de 10 jours elle est masquée, pas grisée :
une fiche périmée inspire confiance à tort, ce qui est pire qu'une absence.

**6. Urgence avant tout le reste.** L'intention « urgence » est évaluée
avant l'extraction de wilaya. Quelqu'un qui écrit « il y a le feu chez
moi » reçoit le 14, pas une liste de points de collecte.

## Modèle de données

Une seule table, un CSV. Colonnes exactes, en-têtes en minuscules :

| Colonne | Obligatoire | Règle |
|---|---|---|
| `code` | oui | 1 à 58, normalisé sur 2 chiffres |
| `nom` | oui | ≥ 3 caractères |
| `type` | non | défaut « Point de collecte » |
| `commune` | non | |
| `adresse` | non | peut contenir des virgules, le CSV est cité |
| `tel` | non | zéro initial restauré si Sheets l'a mangé |
| `horaires` | non | |
| `besoins` | non | valeurs séparées par des virgules |
| `maj` | oui | `AAAA-MM-JJ` strict |
| `source` | oui | ≥ 4 caractères — qui a vérifié |

Deux emplacements possibles, et la combinaison des deux est le mode
recommandé : Google Sheet publié en CSV comme source vive, CSV commité
dans le dépôt comme filet.

## Architecture

```
/                        accueil, wilayas couvertes, numéros d'urgence
/[code]                  58 pages statiques, indexables — le parcours principal
/assistant               interface conversationnelle, matching déterministe
/signaler                formulaire de contribution
/admin                   lignes rejetées, bouton de revalidation
/api/revalidate          POST protégé par secret
```

`revalidate: 60` sur les pages de données. Une correction dans le Sheet
apparaît en moins d'une minute, sans déploiement.

## Critères d'acceptation

Testables, à automatiser.

- `bun test` passe, dont les 22 assertions de `lib/match.test.ts`.
- Un CSV contenant 4 lignes valides et 4 lignes cassées sert 4 fiches et
  liste 4 rejets. Le site ne renvoie pas d'erreur.
- `SHEET_CSV_URL` pointant vers une URL morte → les fiches du dépôt sont
  servies, un `console.error` est émis.
- Un Sheet syntaxiquement valide mais vide → repli sur le dépôt.
- `/06` répond en HTML contenant l'adresse en clair, sans JavaScript.
- Une fiche datée de 11 jours n'apparaît nulle part dans le rendu.
- Lighthouse mobile : performance ≥ 90, accessibilité ≥ 95.
- Poids de la page wilaya < 100 Ko transférés.
- Aucun appel réseau vers un domaine tiers depuis le navigateur.

## Indicateurs

Un seul chiffre compte vraiment : **la part des fiches vérifiées il y a
moins de 48 h.** Sous 70 %, le produit ment poliment et il faut relancer
les vérificateurs avant d'ajouter la moindre fonctionnalité.

Secondaires : nombre de wilayas couvertes, taux de questions sans wilaya
détectée (indique les alias manquants), lignes rejetées par semaine
(indique les frictions de saisie).

## Hors périmètre v1

Notifications, carte, filtrage par besoin, application mobile,
multilinguisme complet de l'interface, historique des versions du dataset.
