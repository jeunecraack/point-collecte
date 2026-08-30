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

**2. Aucune certification, aucune responsabilité.** *(décision du
propriétaire, 2026-08-30.)* Le site recense ce que les bénévoles saisissent
et le dit : « informations recensées par des bénévoles, à titre indicatif,
sans garantie ni responsabilité — appelez avant de vous déplacer », au pied
de chaque page. Aucun badge, aucune mention « vérifié », « certifié » ou
« agréé ». Une date est une date de mise à jour, pas une garantie. La
source est affichée quand elle existe.

**3. Dégradation, jamais effondrement.** Une ligne invalide est ignorée,
les autres passent. Un Google Sheet injoignable ou vidé provoque un repli
sur le CSV du dépôt. Le site n'est jamais pire que le dernier état connu
comme bon.

**4. Le silence bat l'approximation.** Wilaya sans point vérifié → on le
dit, et on renvoie vers la Protection civile et le comité de wilaya du
Croissant-Rouge. On ne comble jamais un trou par une supposition.

**5. La fraîcheur est visible et contraignante.** Une fiche datée affiche
sa date ; au-delà de 10 jours elle est masquée, pas grisée. *(assoupli le
2026-08-30 :)* une fiche **sans** date est servie avec la mention « date
de vérification non renseignée » et n'expire pas — c'est aux bénévoles de
retirer la ligne quand le point ferme.

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
| `agree` | non | lu (fusion des doublons), **jamais affiché** — pas de certification |
| `tel2`, `tel3` | non | numéros supplémentaires (`Num2`, `Num3`) |
| `maps` | non | lien Google Maps uniquement, sinon ignoré |
| `maj` | non | `AAAA-MM-JJ` strict si renseignée ; vide → fiche « non datée », jamais masquée |
| `source` | non | qui a vérifié, affichée si présente |

Les en-têtes des bénévoles (`Wilaya`, `Association`, `Num1`…) sont remappés
vers ce modèle à la lecture, voir `DONNEES.md`.

Deux emplacements possibles, et la combinaison des deux est le mode
recommandé : Google Sheet publié en CSV comme source vive, CSV commité
dans le dépôt comme filet.

## Architecture

```
/                        accueil (arabe), wilayas couvertes, numéros d'urgence
/[code]                  58 pages statiques en arabe, indexables — le parcours principal
/fr, /fr/[code]          les mêmes en français ; bascule par lien, hreflang croisés
/assistant, /fr/assistant  interface conversationnelle, matching déterministe
/signaler, /fr/signaler  formulaire de contribution
/admin                   lignes rejetées, doublons, bouton de revalidation (français)
/api/revalidate          POST protégé par secret
```

Arabe d'abord : l'URL sans préfixe est en arabe (RTL). Pas de détection de
langue ; l'URL fait foi. Mode clair par défaut, sombre sur demande (bouton,
mémorisé dans le navigateur). Deux lignes du Sheet décrivant le même point
(même nom et commune, ou même numéro) sont fusionnées en une fiche.

`revalidate: 60` sur les pages de données. Une correction dans le Sheet
apparaît en moins d'une minute, sans déploiement.

## Critères d'acceptation

Testables, à automatiser.

- `bun test` passe, dont les 22 assertions de `lib/match.test.ts`.
- Un CSV contenant 4 lignes valides et 4 lignes cassées sert 4 fiches et
  liste 4 rejets. Le site ne renvoie pas d'erreur.
- `findWilaya("15")` → 15 : un nombre seul suffit ; l'assistant retient la
  wilaya d'un message à l'autre et propose l'étape suivante en boutons.
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
détectée (indique les alias manquants — beacon `/api/stat`, logs `[stat]`),
lignes rejetées par semaine (indique les frictions de saisie).

## Hors périmètre v1

Notifications, carte, filtrage par besoin, application mobile,
historique des versions du dataset.
