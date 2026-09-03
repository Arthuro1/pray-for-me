# Parcours de discernement — intégration

Le parcours `discernment28`, version 1, contient 28 journées réparties en quatre
semaines. Il figure dans la catégorie Relations, avec le public `single`.
Il accompagne les personnes recevant plusieurs propositions, intéressées par
plusieurs personnes, déjà en relation ou sans personne précise en vue.

## Contenu et langues

Les 16 langues de l’application disposent du contenu complet : français,
anglais, allemand, portugais, chinois simplifié, espagnol, hindi, japonais,
swahili, amharique, indonésien, tagalog, coréen, russe, arabe et persan.
Cela représente 448 versions de journées, avec les titres, l’introduction,
les quatre mouvements et la conclusion traduits.

Chaque journée comprend la lecture dans son contexte, la méditation, une
prière complète, un temps d’écoute, trois questions de carnet, une démarche
concrète et une lecture complémentaire. Le jour 25 permet de passer les
questions ou de ne pas conserver de notes ; le jour 28 ajoute le bilan et
quatre suites possibles, sans obligation de choisir un conjoint.

Le manuscrit français se trouve dans `DISCERNMENT_28_DAYS_FR.md`. Les textes
d’accompagnement sont distincts de l’Écriture : les références partagées
passent par le lecteur biblique existant, sans texte biblique généré.
Les ressources proposées par l’application proviennent du catalogue approuvé.
Les nouvelles pistes de la recherche restent à examiner avant ajout au catalogue.

## Statut éditorial

**Le parcours est intégré en mode de relecture ; il n’est pas approuvé pour la
publication ordinaire.** La règle de `PRAYER_PLANS.md` et `src/lib/planReview.js`
demande des validations humaines nominatives de la théologie, de la protection
des personnes et de chaque langue. Les champs de validation restent `pending`.
Les approbations historiques ne couvrent pas ce nouveau contenu.

En développement, le parcours est visible dans le catalogue. Sur une version
contenant cette intégration, `?planPreview=1` active la relecture dans ce
navigateur ; `?planPreview=0` la désactive. Les badges de brouillon restent
visibles. Aucun déploiement n’est réalisé par cette intégration.

Les traductions ont été produites avec assistance IA, puis corrigées localement.
Les versions anglaise, portugaise et espagnole ont été reprises entièrement ;
l’allemand, le chinois et le hindi ont reçu des reprises partielles ; l’amharique
a reçu une reprise approfondie. Le swahili a été réécrit intégralement à partir
du français. Les 28 journées tagalog ont ensuite été réécrites entièrement,
ainsi que leur introduction et leur conclusion. L’introduction, les repères
bibliques, la conclusion et les libellés persans ont été remplacés : une partie
de ces textes avait été livrée en arabe malgré le code de langue persan.
L’introduction et la conclusion japonaises ont été reprises, avec des corrections
ciblées sur la confidentialité, la liberté de refuser, le consentement et la
protection des personnes. Des corrections de sens ont également été appliquées
aux journées persanes et arabes. Le plafond mensuel configuré du
service de traduction a interrompu les autres reprises automatiques ; les
appels ont été arrêtés. Les 16 versions existent intégralement, mais **ces
corrections et les tests ne remplacent pas une relecture linguistique complète**.

## Intégration technique

- `src/content/plans/discerningBeforeCommitment.js` décrit le parcours, les
  sujets de ressources et le statut de relecture. Les références communes se
  trouvent dans `src/content/plans/discernment/references.json`.
- `src/content/plans/discernment/` contient le français, l’anglais et les titres
  quotidiens dans toutes les langues. Les 14 autres versions de la prose sont
  chargées à la demande depuis `translations/discernment28/`.
- `DiscernmentDayGuide.jsx` affiche les sections dans la journée de prière
  existante. Le bilan et les compléments utilisent des volets dépliables ;
  l’affichage accepte les langues écrites de droite à gauche.
- Le démarrage utilise `startGuidedPlan` et crée une seule prière quotidienne
  récurrente, limitée à 28 occurrences, avec l’identifiant et la version du plan.
- Le bouton du carnet utilise l’action de note existante. Aucun formulaire de
  candidats, classement de personnes ou nouvelle collecte de réponses n’est ajouté.

## Outils de rédaction

`scripts/build-discernment-source.mjs` extrait le manuscrit français.
`scripts/translate-discernment.mjs` est un outil éditorial hors application :
il lit la clé configurée sans l’imprimer, traduit par lots, vérifie la structure
et s’arrête en cas de plafond d’utilisation. Il accepte `--lang=`, `--batches=`,
`--model=`, `--workers=` et `--replace`. Le cache est placé dans le répertoire
temporaire du système et identifié par l’empreinte du texte français.

`scripts/assemble-discernment.mjs` assemble ce cache en fichiers de contenu et
clés d’interface. Les JSON versionnés constituent le livrable. Toute nouvelle
génération doit être relue : `--replace` peut remplacer les corrections locales
du cache, et un échec de génération ne certifie pas que les anciens lots sont
de nouvelles traductions. Aucun de ces outils ne signe une approbation.

## Vue de relecture sans compte

Exécuter `node scripts/build-discernment-review.mjs`, puis ouvrir
`design-qa/discernment-review.html` dans un navigateur. Ce fichier autonome
contient les 16 langues, les introductions, les 28 journées et les conclusions.
Il permet de comparer une traduction au français, de naviguer entre les journées
et d’afficher tout le parcours pour l’imprimer. L’arabe et le persan sont affichés
de droite à gauche. L’interface de cet outil éditorial reste en français.

La vue est produite à partir des JSON et des dictionnaires utilisés par
l’application ; elle n’utilise pas le cache temporaire de traduction. Les
références sont issues du même fichier que le parcours. Le fichier fonctionne
sans réseau, sans connexion à un compte et sans collecte de notes personnelles.
Il ne permet pas de signer une validation. Son empreinte de contenu permet
d’identifier la copie relue ; il faut le régénérer après une correction.
Le répertoire `design-qa` est déjà exclu de Git : le générateur et son modèle
HTML sont conservés dans `scripts/`.

## Vérification

Les tests couvrent les 28 jours, les quatre mouvements, toutes les références,
les 16 langues sans contenu manquant, les questions et le bilan, la fusion des
traductions, les mélanges accidentels d’alphabets, les paragraphes dupliqués,
les boutons du carnet et le maintien du verrou éditorial.
Un contrôle supplémentaire vérifie la présence de caractères propres à
l’orthographe persane dans les textes longs : le seul alphabet Unicode ne
permettait pas de distinguer une traduction persane d’un texte arabe.

Les tests navigateur couvrent l’arabe et le persan sur une largeur de 360 pixels,
ainsi que le démarrage du parcours en une prière de 28 jours. La vérification
visuelle de l’application locale a confirmé le chargement sans erreur de page.
Le parcours authentifié complet n’a pas été parcouru avec un compte réel.
La vue autonome a aussi été vérifiée dans Chromium : sélection des 16 langues,
30 parties par langue dont 28 journées, comparaison avec le français et absence
de débordement horizontal à 360 pixels. L’arabe et le persan restent en lecture
de droite à gauche ; aucune erreur JavaScript n’a été signalée.

Résultats locaux : 388 tests unitaires et de composants réussis dans les suites
concernées, 3 tests navigateur réussis, contrôle des 16 dictionnaires réussi
(1 314 clés chacun, aucune clé manquante), lint strict, vérification des types
et compilation de production réussis. Vite signale un lot JavaScript dépassant
500 ko ; cette remarque n’empêche pas la construction. Ces contrôles valident le fonctionnement et la structure du contenu,
pas l’approbation théologique ni la qualité de chaque formulation traduite.
