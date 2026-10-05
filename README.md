# Trois fois par jour

Un widget pour iPhone qui vous apprend trois choses chaque jour, directement sur l'écran verrouillé.

À **7h**, un mot à connaître : un mot rare, ou un mot courant que l'on emploie souvent de travers.
À **12h**, une date clé de l'histoire.
À **18h**, un artiste à découvrir, avec une œuvre par laquelle commencer.

Le widget fonctionne avec [Scriptable](https://apps.apple.com/app/scriptable/id1405459188), une app gratuite. Il n'y a rien à acheter, aucun compte à créer et aucune donnée collectée.

<!-- Ajoutez ici vos captures d'écran, par exemple :
![Écran verrouillé](captures/ecran-verrouille.png)
-->

## Installation

Comptez cinq minutes.

**1. Installez Scriptable** depuis l'App Store.

**2. Importez le script.** Ouvrez le fichier [`trois-fois-par-jour.js`](trois-fois-par-jour.js) depuis votre iPhone, touchez le bouton « Raw », sélectionnez tout le texte et copiez-le. Dans Scriptable, touchez « + » en haut à droite, collez le texte, puis renommez le script « Trois fois par jour » en touchant son titre. Touchez « Done ».

**3. Ajoutez le widget sur l'écran verrouillé.** Verrouillez l'iPhone, appuyez longuement sur l'écran, puis touchez « Personnaliser » et « Écran verrouillé ». Touchez la zone des widgets sous l'heure, choisissez Scriptable, puis le format rectangulaire.

**4. Associez le script au widget.** Touchez le widget Scriptable que vous venez d'ajouter. Dans « Script », choisissez « Trois fois par jour ». Dans « When Interacting », choisissez « Run Script ». C'est terminé.

Le premier affichage peut prendre quelques secondes, le temps de télécharger le contenu.

## Bon à savoir

**Les horaires sont approximatifs.** Le widget demande à iOS de se mettre à jour à 7h, 12h et 18h, mais c'est le système qui décide du moment exact. Un décalage de quelques minutes est normal.

**Sur l'écran verrouillé, le widget est monochrome.** C'est un choix d'Apple : iOS teinte tous les widgets selon votre fond d'écran. Les couleurs apparaissent sur l'écran d'accueil et en mode StandBy (iPhone en charge, posé à l'horizontale), où le widget affiche aussi l'exemple ou le contexte complet.

**Touchez le widget** pour voir les trois contenus du jour en entier.

**Envie d'un seul thème ?** Dans les réglages du widget, tapez `mot`, `date` ou `artiste` dans le champ « Parameter ». Le widget n'affichera plus que cette catégorie. Vous pouvez ainsi placer trois widgets côte à côte.

**Hors connexion**, le widget utilise la dernière version du contenu enregistrée sur le téléphone.

## Le contenu

Les mots, les dates et les artistes se trouvent dans le dossier [`data`](data). Le script les télécharge depuis ce dépôt : chaque correction ou ajout arrive donc automatiquement chez tout le monde, sans réinstallation.

Tous les utilisateurs voient le même contenu le même jour. Une fois toutes les entrées passées, la rotation recommence au début.

Les dates et les définitions sont relues, mais une erreur reste toujours possible. Si vous en repérez une, merci de la signaler.

## Contribuer

Pour proposer un mot, une date ou un artiste, ou pour signaler une erreur, ouvrez une [issue](../../issues) en précisant :

- pour un mot : le mot, sa définition et un exemple d'emploi ;
- pour une date : l'année, l'événement et une source fiable ;
- pour un artiste : son nom, sa discipline et une œuvre par laquelle commencer.

La sélection des artistes vise la parité et la diversité des époques, des disciplines et des origines.

## Personnaliser

En haut du script, vous pouvez modifier les horaires (`HORAIRES`), les couleurs (`COULEURS`) et la police des titres (`POLICE_TITRE`). Pour utiliser votre propre contenu, copiez ce dépôt et remplacez l'adresse `URL_DONNEES` par celle de votre copie.

## Licences

Le code est sous licence [MIT](LICENSE). Les contenus du dossier `data` sont sous licence [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.fr) : vous pouvez les réutiliser librement en citant ce projet.
