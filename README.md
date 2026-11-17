# Trois fois par jour

Un widget pour iPhone qui vous apprend trois choses chaque jour, directement sur l'écran verrouillé.

À **7h**, un mot à connaître : un mot rare, ou un mot courant que l'on emploie souvent de travers.
À **12h**, une date clé de l'histoire.
À **18h**, un artiste à découvrir.

Touchez le widget pour ouvrir directement la fiche qu'il affiche : mises en situation, synonymes et nuances du mot ; récit historique de la date ; biographie, œuvres et courant de l'artiste. Chaque fiche propose un épisode de Radio France choisi pour le sujet et un article de référence (Wikipédia, ou le CNRTL pour les mots).

L'app s'organise en quatre onglets, accessibles depuis la barre en bas de l'écran :

- **Aujourd'hui** : le contenu qui vient d'être révélé, à la une, puis le reste de la journée. Ce qui n'est pas encore révélé reste caché, avec le temps restant avant le rendez-vous.
- **Carnet** : un calendrier qui garde, jour après jour, tout ce que vous avez appris ; les fiches que vous avez choisi de garder ; et votre collection de folles histoires. Les jours à venir restent fermés.
- **Quiz** : chaque dimanche, dix questions sur la semaine écoulée. Une révision libre est possible à tout moment.
- **Progrès** : votre grade, vos points, votre semaine et vos folles histoires.

Une fiche lue rapporte un point, une bonne réponse au quiz de la semaine aussi. Les points font passer d'apprenti à compagnon (50 points), puis à maître (150 points).

### Les folles histoires

Cinquante histoires vraies, embellies ou légendaires, dénichées sur Wikipédia et racontées en quelques minutes : une guerre déclenchée pour un seau, un chat maire d'un village d'Alaska, l'homme qui vendit la tour Eiffel… La première est offerte. Les suivantes se débloquent une par une : à chaque quiz de la semaine terminé, et en bonus à chaque nouveau grade.

Chaque histoire indique clairement son degré de vérité (histoire vraie, embellie, version disputée, en partie un mythe ou légende) et renvoie vers l'article de Wikipédia qui l'a inspirée.

La charte s'inspire discrètement du Bauhaus : une forme et une couleur par moment (triangle jaune pour le mot, carré rouge pour la date, cercle bleu pour l'artiste, carré vert pour le quiz, quart de cercle noir pour les histoires) et la police Futura, déjà installée sur l'iPhone.

Le widget fonctionne avec [Scriptable](https://apps.apple.com/app/scriptable/id1405459188), une app gratuite. Il n'y a rien à acheter, aucun compte à créer et aucune donnée collectée.

<!-- Ajoutez ici vos captures d'écran, par exemple :
![Écran verrouillé](captures/ecran-verrouille.png)
-->

## Installation

Comptez cinq minutes.

**1. Installez Scriptable** depuis l'App Store.

**2. Importez le script.** Ouvrez le fichier [`trois-fois-par-jour.js`](trois-fois-par-jour.js) depuis votre iPhone, touchez le bouton « Raw », sélectionnez tout le texte et copiez-le. Dans Scriptable, touchez « + » en haut à droite, collez le texte, puis renommez le script « Trois fois par jour » en touchant son titre. Touchez « Done ».

**3. Ajoutez le widget sur l'écran verrouillé.** Verrouillez l'iPhone, appuyez longuement sur l'écran, puis touchez « Personnaliser » et « Écran verrouillé ». Touchez la zone des widgets, choisissez Scriptable, puis le format rectangulaire. Pour l'afficher en haut de l'écran, sous l'heure, faites glisser la rangée de widgets vers le haut ; si elle refuse de monter, désactivez « Effet de profondeur » dans le même menu.

**4. Associez le script au widget.** Touchez le widget Scriptable que vous venez d'ajouter. Dans « Script », choisissez « Trois fois par jour ». Dans « When Interacting », choisissez « Run Script ». C'est terminé.

## Bon à savoir

**Les horaires sont approximatifs.** Le widget demande à iOS de se mettre à jour à 7h, 12h et 18h, mais c'est le système qui décide du moment exact. Un décalage de quelques minutes est normal.

**Sur l'écran verrouillé, le widget est monochrome, et sa taille comme son emplacement sont fixés par iOS.** Le texte est aligné à gauche dans le widget ; la position de la rangée (en haut sous l'heure ou en bas) se règle dans « Personnaliser ». Le format « en ligne », à côté de la date, affiche une version courte : « Mot : Captieux ». Les couleurs et les textes plus longs apparaissent sur l'écran d'accueil et en mode StandBy (iPhone en charge, posé à l'horizontale).

**Envie d'un seul thème ?** Dans les réglages du widget, tapez `mot`, `date` ou `artiste` dans le champ « Parameter ». Vous pouvez ainsi placer plusieurs widgets côte à côte.

**Hors connexion**, le widget utilise la dernière version du contenu enregistrée sur le téléphone. La fiche complète a besoin d'internet pour les extraits et images de Wikipédia.

## Le contenu

Les mots, les dates et les artistes se trouvent dans les fichiers `mots.json`, `dates.json` et `artistes.json`, les folles histoires dans `histoires.json`. Le script les télécharge depuis ce dépôt : chaque correction ou ajout arrive automatiquement chez tout le monde, sans réinstallation. Seule une nouvelle version du script demande de le recopier.

Tous les utilisateurs voient le même contenu le même jour. Une fois toutes les entrées passées, la rotation recommence au début. Le contenu est enrichi progressivement, avec l'objectif de 365 entrées par catégorie.

Les extraits et les images de la fiche viennent de Wikipédia en français, qui n'utilise que des images sous licence libre. Les épisodes à écouter sont indiqués dans le champ `ecouter` de chaque entrée, avec leur adresse sur radiofrance.fr. Quand aucun épisode pertinent n'existe, la fiche propose seulement l'article de référence.

Les folles histoires sont rédigées pour ce projet à partir d'articles de Wikipédia en français, dont le lien figure sous chaque récit. Elles sont débloquées dans l'ordre du fichier.

Le carnet, les favoris, les points, les résultats du quiz et vos histoires débloquées sont enregistrés uniquement sur votre téléphone.

Les dates et les définitions sont relues, mais une erreur reste toujours possible. Si vous en repérez une, merci de la signaler.

## Contribuer

Pour proposer un mot, une date ou un artiste, ou pour signaler une erreur, ouvrez une [issue](../../issues) en précisant :

- pour un mot : le mot, sa définition et un exemple d'emploi ;
- pour une date : l'année, l'événement et une source fiable ;
- pour un artiste : son nom, sa discipline et une œuvre par laquelle commencer ;
- pour un épisode à écouter : l'entrée concernée et l'adresse de l'épisode sur radiofrance.fr ;
- pour une folle histoire : l'article de Wikipédia qui la raconte, et ce qui relève du fait ou de la légende.

La sélection des artistes vise la parité et la diversité des époques, des disciplines et des origines.

## Personnaliser

En haut du script, vous pouvez modifier les horaires (`HORAIRES`), les couleurs des widgets (`COULEURS`), la police (`POLICE`) le barème des grades (`NIVEAUX`) et le nombre de folles histoires offertes au départ (`HISTOIRES_OFFERTES`). Pour utiliser votre propre contenu, copiez ce dépôt et remplacez l'adresse `URL_DONNEES` par celle de votre copie.

## Licences

Le code est sous licence [MIT](LICENSE). Les contenus des fichiers JSON, y compris les récits des folles histoires, rédigés pour ce projet, sont sous licence [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.fr) : vous pouvez les réutiliser librement en citant ce projet. Les extraits et images de Wikipédia restent soumis à leurs propres licences.
