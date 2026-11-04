# Trois fois par jour

Un widget pour iPhone qui vous apprend trois choses chaque jour, directement sur l'écran verrouillé.

À **7h**, un mot à connaître : un mot rare, ou un mot courant que l'on emploie souvent de travers.
À **12h**, une date clé de l'histoire.
À **18h**, un artiste à découvrir.

Touchez le widget pour ouvrir la fiche du jour : mises en situation, synonymes et nuances du mot ; récit historique de la date ; biographie, œuvres et courant de l'artiste. Chaque fiche propose des émissions de France Culture choisies pour le sujet, ainsi que des liens vers Wikipédia, le CNRTL et Google Arts & Culture.

L'app s'organise en quatre onglets :

- **Aujourd'hui** : les trois contenus du jour, chacun sur sa couleur. Ce qui n'est pas encore révélé reste caché, avec l'heure du rendez-vous.
- **Carnet** : un calendrier qui garde, jour après jour, tout ce que vous avez appris. Les jours à venir restent fermés.
- **Favoris** : les fiches que vous avez choisi de garder.
- **Progrès** : votre série de jours de lecture, les sept derniers jours et le nombre de mots, dates et artistes découverts.

Chaque fiche peut être gardée en favori ou partagée en un geste.

Le widget fonctionne avec [Scriptable](https://apps.apple.com/app/scriptable/id1405459188), une app gratuite. Il n'y a rien à acheter, aucun compte à créer et aucune donnée collectée.

<!-- Ajoutez ici vos captures d'écran, par exemple :
![Écran verrouillé](captures/ecran-verrouille.png)
-->

## Installation

Comptez cinq minutes.

**1. Installez Scriptable** depuis l'App Store.

**2. Importez le script.** Ouvrez le fichier [`trois-fois-par-jour.js`](trois-fois-par-jour.js) depuis votre iPhone, touchez le bouton « Raw », sélectionnez tout le texte et copiez-le. Dans Scriptable, touchez « + » en haut à droite, collez le texte, puis renommez le script « Trois fois par jour » en touchant son titre. Touchez « Done ».

**3. Ajoutez le widget sur l'écran verrouillé.** Verrouillez l'iPhone, appuyez longuement sur l'écran, puis touchez « Personnaliser » et « Écran verrouillé ». Touchez la zone des widgets, choisissez Scriptable, puis le format rectangulaire.

**4. Associez le script au widget.** Touchez le widget Scriptable que vous venez d'ajouter. Dans « Script », choisissez « Trois fois par jour ». Dans « When Interacting », choisissez « Run Script ». C'est terminé.

## Bon à savoir

**Les horaires sont approximatifs.** Le widget demande à iOS de se mettre à jour à 7h, 12h et 18h, mais c'est le système qui décide du moment exact. Un décalage de quelques minutes est normal.

**Sur l'écran verrouillé, le widget est monochrome et sa taille est fixée par iOS.** Les couleurs et les textes plus longs apparaissent sur l'écran d'accueil et en mode StandBy (iPhone en charge, posé à l'horizontale).

**Envie d'un seul thème ?** Dans les réglages du widget, tapez `mot`, `date` ou `artiste` dans le champ « Parameter ». Vous pouvez ainsi placer plusieurs widgets côte à côte.

**Hors connexion**, le widget utilise la dernière version du contenu enregistrée sur le téléphone. La fiche complète a besoin d'internet pour les extraits et images de Wikipédia.

## Le contenu

Les mots, les dates et les artistes se trouvent dans les fichiers `mots.json`, `dates.json` et `artistes.json`. Le script les télécharge depuis ce dépôt : chaque correction ou ajout arrive automatiquement chez tout le monde, sans réinstallation. Seule une nouvelle version du script demande de le recopier.

Tous les utilisateurs voient le même contenu le même jour. Une fois toutes les entrées passées, la rotation recommence au début. Le contenu est enrichi progressivement, avec l'objectif de 365 entrées par catégorie.

Les extraits et les images de la fiche viennent de Wikipédia en français, qui n'utilise que des images sous licence libre. Les émissions recommandées (Le Cours de l'histoire, Concordance des temps, Toute une vie, Les Regardeurs) renvoient vers leur page officielle sur Radio France, avec une recherche dans leurs archives. Un épisode précis peut être ajouté à une entrée avec le champ `ecouter`.

Le carnet et les favoris sont enregistrés uniquement sur votre téléphone. Il commence le jour de la première ouverture de cette version.

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

Le code est sous licence [MIT](LICENSE). Les contenus des fichiers JSON sont sous licence [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.fr) : vous pouvez les réutiliser librement en citant ce projet. Les extraits et images de Wikipédia restent soumis à leurs propres licences.
