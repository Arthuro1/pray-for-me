# Validation des parcours — Paul, 3 septembre 2026

## Autorisation et portée

Validation enregistrée à la demande explicite de l’utilisateur : « oui sous le
nom de Paul. fais de meme pour les autres plans pas encore valides », en réponse
à la question portant aussi sur les neuf ressources de David et les versions
linguistiques. Il s’agit de consigner cette approbation, pas de prétendre à une
nouvelle expertise indépendante ou à des relectures natives non réalisées.

Les quatre parcours encore en attente, tous en version 1, portent désormais
le statut `approved`, avec les validations théologique, sécurité et linguistiques
au nom de **Paul**, datées du **2026-09-03** :

| Identifiant | Parcours | Durée |
|---|---|---|
| `david12` | David : un homme selon le cœur de Dieu | 12 jours |
| `covenant21` | Fiancés : se préparer au mariage | 21 jours |
| `marriage30` | Mariés : prier pour notre mariage | 30 jours |
| `freedom30` | Liberté et délivrance en Christ | 30 jours |

Les trois contenus facultatifs sur les rôles sont également signés : jour 20
de `covenant21`, jours 4 et 20 de `marriage30`. Les sept autres parcours et les
approbations antérieures ne sont pas modifiés.

## Langues : valider la présentation actuelle, pas inventer une traduction

La validation couvre les 16 présentations actuellement proposées, y compris
leurs replis linguistiques existants. Les textes longs français et anglais sont
conservés ; `covenant21` sert aussi ses traductions allemandes, espagnoles,
portugaises et russes. Les autres traductions longues manquantes restent des
travaux à réaliser : aucune ébauche structurelle n’est activée et aucun champ
`proseTranslations` n’est élargi. Le champ de portée des signatures le précise.

## Ressources associées

**36 ressources supplémentaires** sont approuvées et disposent déjà d’au moins
une édition vérifiée et disponible dans le catalogue : les neuf ressources de
David et 27 ressources associées aux autres parcours. Chacune porte les deux
signatures `contentReview` et `safetyReview` de Paul.

**Cinq autres contenus associés** reçoivent ces signatures mais restent masqués
(`needs_review`), car leurs éditions actuelles sont indisponibles :

- `berger-garten-der-liebe`
- `trobisch-mit-freuden-frau-sein`
- `trobisch-du-bist-mir-wichtig`
- `ruthe-mimosen-und-dickhaeuter`
- `ruthe-intim-gefragt`

Les cinq candidats sans correspondance avec les quatre parcours en attente
(public célibataire ou adolescent) restent inchangés, comme la ressource
retirée. Aucun lien, date de vérification ou état de disponibilité n’est inventé
ou modifié par cette validation. Les dix ressources de délivrance avaient déjà
leurs signatures ; elles les conservent, y compris les deux entrées toujours
sans URL vérifiée, que le filtre d’édition continue de masquer.

Après cette opération, le catalogue contient 102 entrées : 91 approuvées,
10 en attente et une retirée. **89 peuvent effectivement s’afficher**, selon le
sujet, le domaine, l’étape de vie et les langues choisis. Quinze langues ont au
moins une édition affichable ; le persan n’en a pas encore.

## Traçabilité et accès

- Registre daté : `src/content/reviews/paul20260903.js` ; listes fermées
  d’identifiants et de langues, sans approbation automatique de futurs contenus.
- Tests dédiés : `src/content/reviews/paul20260903.test.js` ; signatures,
  démarrage des quatre parcours sans aperçu, ressources disponibles et exclues.
- Les contrôles `planReview.js` et `resources.js` restent inchangés. Les futurs
  contenus non signés demeurent bloqués hors mode de relecture.
- Les quatre parcours sont utilisables sans `?planPreview=1` dans une version
  de l’application construite avec ces modifications. David se trouve dans
  **Accompagnement → Parcourir les parcours → Études bibliques**.

Cette opération modifie le projet local. Elle ne déploie pas l’application et
ne change ni compte, ni base de données, ni réglage de production.
