// ============================================================
// Trois fois par jour · version 3
// Un mot à 7h, une date à 12h, un artiste à 18h.
// Widget Scriptable pour l'écran verrouillé et l'écran d'accueil de l'iPhone.
// Code sous licence MIT. Contenus sous licence CC BY 4.0.
// https://github.com/clara-bismuth/trois-fois-par-jour
// ============================================================


// ---------- RÉGLAGES ----------

// Adresse des fichiers de contenu (à la racine du dépôt GitHub).
// Pour une copie du projet, remplacez clara-bismuth par votre propre pseudo GitHub.
const URL_DONNEES = "https://raw.githubusercontent.com/clara-bismuth/trois-fois-par-jour/main/"

// Horaires de révélation : [heure, minute]
const HORAIRES = {
  mot: [7, 0],
  date: [12, 0],
  artiste: [18, 0],
}

// Point de départ de la rotation. Ne pas modifier une fois le projet publié.
const DEBUT = new Date(2026, 0, 1)

// Une lumière par moment de la journée : aube, ciel de midi, crépuscule.
// Sur l'écran verrouillé, iOS impose sa propre teinte.
const COULEURS = {
  encre: Color.dynamic(new Color("#23283B"), new Color("#ECEAF2")),
  doux: Color.dynamic(new Color("#6F7383"), new Color("#A3A6B4")),
  fond: {
    mot: Color.dynamic(new Color("#F6E7E4"), new Color("#2A2026")),
    date: Color.dynamic(new Color("#E4ECF2"), new Color("#1C2632")),
    artiste: Color.dynamic(new Color("#ECE7F3"), new Color("#231F33")),
  },
  accent: {
    mot: Color.dynamic(new Color("#8E5560"), new Color("#E3AEB8")),
    date: Color.dynamic(new Color("#3F6079"), new Color("#A9C6DE")),
    artiste: Color.dynamic(new Color("#625385"), new Color("#C3B6E6")),
  },
}

const POLICE_TITRE = "Didot-Bold"

// Émissions recommandées. Seules des émissions dont l'adresse a été vérifiée figurent ici.
const EMISSIONS = {
  "cours-histoire": {
    titre: "Le Cours de l’histoire",
    chaine: "France Culture",
    texte: "Une heure d’histoire avec des historiennes et des historiens, du lundi au vendredi, par Xavier Mauduit.",
    url: "https://www.radiofrance.fr/franceculture/podcasts/le-cours-de-l-histoire",
    site: "radiofrance.fr/franceculture/podcasts/le-cours-de-l-histoire",
  },
  "concordance": {
    titre: "Concordance des temps",
    chaine: "France Culture",
    texte: "Chaque samedi, Jean-Noël Jeanneney éclaire l’actualité par les précédents de l’histoire.",
    url: "https://www.radiofrance.fr/franceculture/podcasts/concordance-des-temps",
    site: "radiofrance.fr/franceculture/podcasts/concordance-des-temps",
  },
  "toute-une-vie": {
    titre: "Toute une vie",
    chaine: "France Culture",
    texte: "Chaque samedi, le portrait documentaire d’une femme ou d’un homme d’exception.",
    url: "https://www.radiofrance.fr/franceculture/podcasts/toute-une-vie",
    site: "radiofrance.fr/franceculture/podcasts/toute-une-vie",
  },
  "regardeurs": {
    titre: "Les Regardeurs",
    chaine: "France Culture",
    texte: "Une œuvre d’art par épisode, regardée et racontée par plusieurs voix.",
    url: "https://www.radiofrance.fr/franceculture/podcasts/les-regardeurs",
    site: "radiofrance.fr/franceculture/podcasts/les-regardeurs",
  },
}

const ENTETES_WIKI = {
  "Api-User-Agent": "TroisFoisParJour/3.0 (https://github.com/clara-bismuth/trois-fois-par-jour)",
}

const TYPES = ["mot", "date", "artiste"]


// ---------- CONTENU DE SECOURS ----------

const SECOURS = {
  mot: [{
    mot: "Acception", categorie: "n. f.",
    definition: "Sens particulier dans lequel un mot est employé. À ne pas confondre avec acceptation.",
    exemple: "Dans son acception juridique, ce terme est bien plus restrictif.",
  }],
  date: [{
    annee: "1789", evenement: "Prise de la Bastille",
    contexte: "Le 14 juillet, le peuple parisien s'empare de la forteresse, symbole de l'arbitraire royal.",
  }],
  artiste: [{
    nom: "Hilma af Klint", discipline: "Peinture", pays: "Suède", epoque: "1862-1944",
    oeuvre: "Les Dix Plus Grands (1907)",
    presentation: "Pionnière de l'abstraction, elle peint des toiles non figuratives avant Kandinsky.",
  }],
}


// ---------- FICHIERS ----------

const FICHIERS = { mot: "mots.json", date: "dates.json", artiste: "artistes.json" }

const fm = FileManager.local()
const dossier = fm.joinPath(fm.documentsDirectory(), "trois-fois-par-jour")
if (!fm.fileExists(dossier)) fm.createDirectory(dossier, true)
const CHEMIN_HISTORIQUE = fm.joinPath(dossier, "historique.json")

async function charger(type) {
  const chemin = fm.joinPath(dossier, FICHIERS[type])
  try {
    const requete = new Request(URL_DONNEES + FICHIERS[type])
    requete.timeoutInterval = 8
    const donnees = await requete.loadJSON()
    if (Array.isArray(donnees) && donnees.length > 0) {
      fm.writeString(chemin, JSON.stringify(donnees))
      return donnees
    }
    console.log(`Réponse inattendue pour ${type} : vérifiez l'adresse URL_DONNEES`)
  } catch (e) {
    console.log(`Téléchargement impossible pour ${type} : ${e}`)
  }
  if (fm.fileExists(chemin)) {
    try { return JSON.parse(fm.readString(chemin)) } catch (e) {}
  }
  return SECOURS[type]
}


// ---------- CALENDRIER ----------

function enMinutes(h) { return h[0] * 60 + h[1] }
function minutesActuelles(d) { return d.getHours() * 60 + d.getMinutes() }
function veille(d) { const v = new Date(d); v.setDate(v.getDate() - 1); return v }
function revele(type, maintenant) { return minutesActuelles(maintenant) >= enMinutes(HORAIRES[type]) }

function cle(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}
function dateDeCle(k) {
  const [a, m, j] = k.split("-").map(Number)
  return new Date(a, m - 1, j)
}

function numeroDuJour(jour) {
  const a = Date.UTC(jour.getFullYear(), jour.getMonth(), jour.getDate())
  const b = Date.UTC(DEBUT.getFullYear(), DEBUT.getMonth(), DEBUT.getDate())
  return Math.round((a - b) / 86400000)
}

function choisir(liste, jour) {
  const n = liste.length
  return liste[((numeroDuJour(jour) % n) + n) % n]
}

function momentActuel(maintenant) {
  if (revele("artiste", maintenant)) return { type: "artiste", jour: maintenant }
  if (revele("date", maintenant)) return { type: "date", jour: maintenant }
  if (revele("mot", maintenant)) return { type: "mot", jour: maintenant }
  return { type: "artiste", jour: veille(maintenant) }
}

function momentFixe(type, maintenant) {
  return revele(type, maintenant) ? { type, jour: maintenant } : { type, jour: veille(maintenant) }
}

function prochainChangement(maintenant) {
  const candidats = TYPES.map(t => {
    const d = new Date(maintenant)
    d.setHours(HORAIRES[t][0], HORAIRES[t][1], 0, 0)
    return d
  })
  const demain = new Date(maintenant)
  demain.setDate(demain.getDate() + 1)
  demain.setHours(HORAIRES.mot[0], HORAIRES.mot[1], 0, 0)
  candidats.push(demain)
  return candidats.filter(d => d > maintenant).sort((a, b) => a - b)[0]
}


// ---------- CARNET (historique local, jamais envoyé ailleurs) ----------

function lireHistorique() {
  try {
    if (fm.fileExists(CHEMIN_HISTORIQUE)) return JSON.parse(fm.readString(CHEMIN_HISTORIQUE))
  } catch (e) {
    console.log("Carnet illisible, il repart de zéro")
  }
  return { debut: null, jours: {} }
}

function ecrireHistorique(h) {
  try { fm.writeString(CHEMIN_HISTORIQUE, JSON.stringify(h)) } catch (e) { console.log(`Carnet non enregistré : ${e}`) }
}

// Garde la trace de ce qui a été montré, pour que le carnet reste juste
// même quand de nouvelles entrées s'ajoutent aux fichiers.
function noter(h, jour, type, entree) {
  const k = cle(jour)
  if (!h.debut || k < h.debut) h.debut = k
  h.jours[k] = h.jours[k] || {}
  if (!h.jours[k][type]) h.jours[k][type] = entree
}

const IDENTITE = {
  mot: e => e.mot,
  date: e => `${e.annee}|${e.evenement}`,
  artiste: e => e.nom,
}

// Reprend la version à jour d'une entrée (corrections, ajouts), sinon la copie gardée
function actualiser(type, gardee, liste) {
  if (!gardee) return null
  const id = IDENTITE[type](gardee)
  return liste.find(e => IDENTITE[type](e) === id) || gardee
}


// ---------- WIDGETS ----------

function fiche(type, e) {
  if (type === "mot") {
    return { libelle: "Mot du jour", titre: e.mot, meta: e.categorie || "", principal: e.definition, court: e.definition, detail: e.exemple ? `« ${e.exemple} »` : "" }
  }
  if (type === "date") {
    return { libelle: "Date du jour", titre: e.annee, meta: "", principal: e.evenement, court: e.evenement, detail: e.contexte || "" }
  }
  return {
    libelle: "Artiste du jour", titre: e.nom,
    meta: [e.discipline, e.pays, e.epoque].filter(Boolean).join(", "),
    principal: e.oeuvre ? `À découvrir : ${e.oeuvre}` : "",
    court: [e.discipline, e.epoque].filter(Boolean).join(", "),
    detail: e.presentation || "",
  }
}

function policeTitre(taille) { return new Font(POLICE_TITRE, taille) }

function widgetRectangulaire(f) {
  const w = new ListWidget()
  w.setPadding(0, 0, 0, 0)
  const libelle = w.addText(f.libelle)
  libelle.font = Font.mediumSystemFont(11)
  libelle.textOpacity = 0.75
  w.addSpacer(1)
  const titre = w.addText(f.titre)
  titre.font = policeTitre(20)
  titre.lineLimit = 1
  titre.minimumScaleFactor = 0.6
  const texte = w.addText(f.court)
  texte.font = Font.mediumSystemFont(13)
  texte.lineLimit = 2
  texte.minimumScaleFactor = 0.75
  return w
}

function widgetLigne(f) {
  const w = new ListWidget()
  const t = w.addText(`${f.titre}, ${f.court}`)
  t.font = Font.systemFont(12)
  return w
}

function widgetRond(f) {
  const w = new ListWidget()
  w.addAccessoryWidgetBackground = true
  const t = w.addText(f.titre)
  t.font = policeTitre(12)
  t.centerAlignText()
  t.lineLimit = 2
  t.minimumScaleFactor = 0.5
  return w
}

function widgetCouleur(f, type, grand) {
  const w = new ListWidget()
  w.backgroundColor = COULEURS.fond[type]
  w.setPadding(16, 16, 16, 16)
  const libelle = w.addText(f.libelle)
  libelle.font = new Font("AvenirNext-Medium", 12)
  libelle.textColor = COULEURS.accent[type]
  w.addSpacer(6)
  const titre = w.addText(f.titre)
  titre.font = policeTitre(grand ? 28 : 24)
  titre.textColor = COULEURS.encre
  titre.lineLimit = 1
  titre.minimumScaleFactor = 0.5
  if (f.meta) {
    const meta = w.addText(f.meta)
    meta.font = new Font("IowanOldStyle-Italic", 12)
    meta.textColor = COULEURS.doux
    meta.lineLimit = 1
    meta.minimumScaleFactor = 0.7
  }
  w.addSpacer(8)
  const principal = w.addText(f.principal)
  principal.font = new Font("IowanOldStyle-Roman", grand ? 14 : 13)
  principal.textColor = COULEURS.encre
  principal.lineLimit = grand ? 2 : 4
  principal.minimumScaleFactor = 0.8
  if (grand && f.detail) {
    w.addSpacer(4)
    const detail = w.addText(f.detail)
    detail.font = new Font("IowanOldStyle-Italic", 13)
    detail.textColor = COULEURS.doux
    detail.lineLimit = 3
    detail.minimumScaleFactor = 0.8
  }
  w.addSpacer()
  return w
}


// ---------- WIKIPÉDIA ----------

async function lireJSON(url) {
  const r = new Request(url)
  r.headers = ENTETES_WIKI
  r.timeoutInterval = 8
  return await r.loadJSON()
}

// Wikipédia en français n'utilise que des images sous licence libre.
async function wikipedia(recherche, avecGalerie) {
  if (!recherche) return null
  try {
    const s = await lireJSON(`https://fr.wikipedia.org/w/api.php?action=query&list=search&srlimit=1&format=json&srsearch=${encodeURIComponent(recherche)}`)
    const titre = s && s.query && s.query.search && s.query.search[0] && s.query.search[0].title
    if (!titre) return null
    const t = encodeURIComponent(titre.replace(/ /g, "_"))
    const resume = await lireJSON(`https://fr.wikipedia.org/api/rest_v1/page/summary/${t}`)
    let galerie = []
    if (avecGalerie) {
      try {
        const media = await lireJSON(`https://fr.wikipedia.org/api/rest_v1/page/media-list/${t}`)
        galerie = (media.items || [])
          .filter(i => i.type === "image" && i.srcset && i.srcset.length && !/\.svg/i.test(i.title || ""))
          .slice(0, 6)
          .map(i => {
            const src = i.srcset[i.srcset.length - 1].src
            return { src: src.startsWith("//") ? "https:" + src : src, legende: (i.caption && i.caption.text) || "" }
          })
      } catch (e) {}
    }
    return {
      titre,
      extrait: resume.extract || "",
      // L'original s'il reste léger, sinon la vignette de Wikipédia
      image: (resume.originalimage && resume.originalimage.width <= 1600 && resume.originalimage.source) || (resume.thumbnail && resume.thumbnail.source) || "",
      galerie,
    }
  } catch (e) {
    console.log(`Wikipédia indisponible : ${e}`)
    return null
  }
}


// ---------- PAGE DE L'APP : STYLES ----------

const STYLES = `
:root {
  --fond: #FFFFFF; --encre: #23283B; --doux: #6F7383; --filet: rgba(35, 40, 59, .13);
  --aube: #F6E7E4; --aube-encre: #8E5560;
  --ciel: #E4ECF2; --ciel-encre: #3F6079;
  --lilas: #ECE7F3; --lilas-encre: #625385;
  --affiche: "Didot", "Bodoni 72", serif;
  --texte: "Iowan Old Style", "Palatino", serif;
  --interface: "Avenir Next", "Avenir", -apple-system, sans-serif;
}
@media (prefers-color-scheme: dark) {
  :root {
    --fond: #121521; --encre: #ECEAF2; --doux: #A3A6B4; --filet: rgba(236, 234, 242, .15);
    --aube: #2A2026; --aube-encre: #E3AEB8;
    --ciel: #1C2632; --ciel-encre: #A9C6DE;
    --lilas: #231F33; --lilas-encre: #C3B6E6;
  }
}
* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body { margin: 0; background: var(--fond); color: var(--encre); font: 18px/1.62 var(--texte);
       -webkit-font-smoothing: antialiased; padding-bottom: env(safe-area-inset-bottom); }
button { font: inherit; color: inherit; background: none; border: 0; padding: 0; cursor: pointer; }
a { color: inherit; }
:focus-visible { outline: 2px solid var(--encre); outline-offset: 3px; }

.tete { max-width: 640px; margin: 0 auto; padding: calc(30px + env(safe-area-inset-top)) 24px 0; }
.tete h1 { font: 400 32px/1.05 var(--affiche); margin: 0; }
.date-jour { font-style: italic; color: var(--doux); margin: 6px 0 24px; }
nav { display: flex; gap: 30px; border-bottom: 1px solid var(--filet); }
nav button { font: 500 15px/1 var(--interface); color: var(--doux); padding: 12px 0 13px; margin-bottom: -1px;
             border-bottom: 1px solid transparent; }
nav button[aria-current] { color: var(--encre); border-bottom-color: var(--encre); }
main { padding-top: 32px; }

.chap { background: var(--teinte); }
.chap-mot { --teinte: var(--aube); --accent: var(--aube-encre); }
.chap-date { --teinte: var(--ciel); --accent: var(--ciel-encre); }
.chap-artiste { --teinte: var(--lilas); --accent: var(--lilas-encre); }
.chap-int { max-width: 640px; margin: 0 auto; padding: 40px 24px 44px; }
.chap-tete { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 20px; color: var(--accent); }
.moment { font: italic 17px/1.2 var(--texte); }
.heure { font: 500 13px/1 var(--interface); letter-spacing: .02em; }

.titre { font-family: var(--affiche); font-weight: 400; margin: 0; line-height: 1.02; overflow-wrap: break-word; }
.titre-mot { font-size: clamp(38px, 11.5vw, 56px); }
.titre-annee { font-size: clamp(52px, 18vw, 96px); line-height: .95; }
.titre-artiste { font-size: clamp(34px, 10vw, 50px); }
.nature { font: italic 16px/1.4 var(--texte); color: var(--doux); margin: 10px 0 0; }
.evenement { font: 500 21px/1.35 var(--texte); margin: 14px 0 0; }
.chapeau { font-size: 20px; line-height: 1.55; margin: 22px 0 0; }
.citation { font-style: italic; color: var(--doux); margin: 16px 0 0; padding-left: 18px; }
.recit { margin: 18px 0 0; }

.illustration { margin: 28px -24px 0; }
.illustration img { display: block; width: 100%; max-height: 380px; object-fit: cover; }
.illustration figcaption, .galerie figcaption { font: 12px/1.4 var(--interface); color: var(--doux); padding: 8px 24px 0; }
.illustration:empty, .galerie:empty { display: none; }
.galerie { display: flex; gap: 12px; overflow-x: auto; margin: 28px -24px 0; padding: 0 24px 4px;
           scroll-snap-type: x mandatory; scrollbar-width: none; }
.galerie::-webkit-scrollbar { display: none; }
.galerie figure { margin: 0; flex: 0 0 78%; scroll-snap-align: start; }
.galerie img { display: block; width: 100%; height: 250px; object-fit: cover; background: var(--filet); }
.galerie figcaption { padding: 8px 0 0; }
.pour-commencer { margin: 24px 0 0; font-style: italic; }
.pour-commencer span { display: block; font: 500 13px/1.4 var(--interface); font-style: normal; color: var(--accent); margin-bottom: 2px; }

.bloc { margin-top: 34px; }
.bloc h3 { font: 500 15px/1.3 var(--interface); margin: 0 0 4px; }
.ecoute { padding: 16px 0; border-top: 1px solid var(--filet); }
.ecoute:first-of-type { border-top: 0; }
.ecoute-titre { font: 500 19px/1.3 var(--texte); text-decoration: none; }
.ecoute-texte { font: 14px/1.5 var(--interface); color: var(--doux); margin: 4px 0 8px; }
.lien { font: 500 14px/1.4 var(--interface); color: var(--accent); text-decoration: underline;
        text-decoration-thickness: 1px; text-underline-offset: 3px; }
.liens { margin: 0; }
.liens .lien { display: block; padding: 6px 0; }

.volets { margin-top: 34px; border-bottom: 1px solid var(--filet); }
details { border-top: 1px solid var(--filet); }
summary { list-style: none; display: flex; justify-content: space-between; align-items: center;
          padding: 17px 0; cursor: pointer; font: 500 15px/1.3 var(--interface); }
summary::-webkit-details-marker { display: none; }
summary i { position: relative; width: 12px; height: 12px; flex: none; }
summary i::before, summary i::after { content: ""; position: absolute; left: 0; top: 5.5px; width: 12px; height: 1px;
                                      background: var(--encre); transition: transform .25s ease; }
summary i::after { transform: rotate(90deg); }
details[open] summary i::after { transform: rotate(0deg); }
.volet { padding: 0 0 22px; }
.volet p { margin: 0 0 12px; }
.volet ul { margin: 0; padding-left: 18px; }
.volet li { margin: 0 0 8px; }
.source { font: 12px/1.4 var(--interface); color: var(--doux); }
.attente { color: var(--doux); font-style: italic; }

.verrou .annonce { font: 400 clamp(30px, 8.5vw, 40px)/1.12 var(--affiche); margin: 0; }
.verrou .rendezvous { margin: 14px 0 0; }
.verrou .reste { font: 13px/1.4 var(--interface); color: var(--doux); margin: 4px 0 0; }
.note { max-width: 640px; margin: 0 auto 28px; padding: 0 24px; color: var(--doux); font-style: italic; }

.carnet { max-width: 640px; margin: 0 auto; padding: 0 24px 36px; }
.mois { display: flex; align-items: center; justify-content: space-between; }
.mois h2 { font: 400 30px/1.1 var(--affiche); margin: 0; }
.fleche { font: 300 30px/1 var(--interface); width: 44px; height: 44px; color: var(--encre); }
.fleche:disabled { opacity: .2; cursor: default; }
.semaine, .grille { display: grid; grid-template-columns: repeat(7, 1fr); text-align: center; }
.semaine { font: 500 12px/1 var(--interface); color: var(--doux); margin: 20px 0 8px; }
.case { aspect-ratio: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
        font: 15px/1 var(--interface); }
.hors, .futur { color: var(--doux); opacity: .35; }
.jour span { display: block; width: 34px; height: 34px; line-height: 34px; border-radius: 50%; }
.auj span { box-shadow: inset 0 0 0 1px var(--encre); }
.choisi span { background: var(--encre); color: var(--fond); box-shadow: none; }
.jour em, .legende em { display: flex; gap: 3px; margin-top: 4px; }
.jour em b, .legende b { width: 5px; height: 5px; border-radius: 50%; display: inline-block; background: transparent; }
b.p-mot { background: var(--aube-encre); }
b.p-date { background: var(--ciel-encre); }
b.p-artiste { background: var(--lilas-encre); }
.legende { display: flex; flex-wrap: wrap; gap: 4px 16px; font: 13px/1.4 var(--interface); color: var(--doux); margin: 16px 0 0; }
.legende span { display: inline-flex; align-items: center; gap: 6px; }
.titre-jour { font: 400 28px/1.15 var(--affiche); max-width: 640px; margin: 8px auto 20px; padding: 0 24px; }
.vide { font-style: italic; color: var(--doux); margin: 20px 0 0; }

@media (prefers-reduced-motion: reduce) { * { transition: none !important; scroll-behavior: auto !important; } }
`


// ---------- PAGE DE L'APP : COMPORTEMENT ----------

const SCRIPT_PAGE = String.raw`
(function () {
  var D = JSON.parse(document.getElementById('donnees').textContent);
  var NB = String.fromCharCode(160);
  var TYPES = ['mot', 'date', 'artiste'];
  var NOMS = { mot: 'Le mot du matin', date: 'La date de midi', artiste: 'L’artiste du soir' };
  var ANNONCES = { mot: 'Un mot à apprivoiser', date: 'Une date à retenir', artiste: 'Une œuvre à découvrir' };
  var CATEGORIES = { 'n. f.': 'nom féminin', 'n. m.': 'nom masculin', 'n. f. pl.': 'nom féminin pluriel',
    'n. m. pl.': 'nom masculin pluriel', 'adj.': 'adjectif', 'adv.': 'adverbe', 'v.': 'verbe', 'v. pron.': 'verbe pronominal' };
  var MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  var SEMAINE = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  var etat = { vue: 'jour', mois: null, choisi: null };
  var wiki = {};
  var demandes = {};

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function capitale(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function dateDe(k) { var p = k.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function cleDe(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function titreJour(k) { var d = dateDe(k); return SEMAINE[d.getDay()] + ' ' + d.getDate() + (d.getDate() === 1 ? 'er' : '') + ' ' + MOIS[d.getMonth()]; }
  function heure(t) { var h = D.horaires[t]; return h[0] + NB + 'h' + (h[1] ? NB + pad(h[1]) : ''); }
  function reste(t) {
    var h = D.horaires[t], cible = new Date(); cible.setHours(h[0], h[1], 0, 0);
    var m = Math.round((cible - new Date()) / 60000);
    if (m <= 0) return '';
    var hh = Math.floor(m / 60), mm = m % 60;
    return 'dans ' + (hh ? hh + NB + 'h' + (mm ? NB + pad(mm) : '') : mm + NB + 'min');
  }
  function lien(url, texte, classe) { return '<a class="' + (classe || 'lien') + '" href="' + esc(url) + '">' + esc(texte) + '</a>'; }
  function wikiUrl(q) { return 'https://fr.wikipedia.org/w/index.php?search=' + encodeURIComponent(q); }
  function archives(site, q) { return 'https://duckduckgo.com/?q=' + encodeURIComponent('site:' + site + ' ' + q); }
  function liste(items) {
    return items && items.length ? '<ul>' + items.map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('') + '</ul>' : '';
  }
  function volet(titre, contenu) {
    if (!contenu) return '';
    return '<details><summary><span>' + esc(titre) + '</span><i aria-hidden="true"></i></summary><div class="volet">' + contenu + '</div></details>';
  }
  function zoneWiki(k, partie, attente) {
    return '<div data-wiki="' + k + '" data-part="' + partie + '">' + (attente ? '<p class="attente">Chargement du résumé…</p>' : '') + '</div>';
  }

  // Émissions : celles choisies dans le fichier de contenu, sinon une sélection par thème
  function emissionsPour(type, e) {
    if (e.ecouter && e.ecouter.length) return e.ecouter;
    if (type === 'date') return ['cours-histoire', 'concordance'];
    if (type === 'artiste') {
      var d = (e.discipline || '').toLowerCase();
      return /peinture|sculpture|estampe|arts plastiques/.test(d) ? ['regardeurs', 'toute-une-vie'] : ['toute-une-vie'];
    }
    return [];
  }

  function blocEcoute(type, e, sujet) {
    var choix = emissionsPour(type, e);
    var html = choix.map(function (c) {
      if (typeof c === 'object') {
        return '<div class="ecoute">' + lien(c.url, c.titre, 'ecoute-titre') +
          (c.texte ? '<p class="ecoute-texte">' + esc(c.texte) + '</p>' : '') + '</div>';
      }
      var em = D.emissions[c];
      if (!em) return '';
      return '<div class="ecoute">' + lien(em.url, em.titre, 'ecoute-titre') +
        '<p class="ecoute-texte">' + esc(em.chaine + '. ' + em.texte) + '</p>' +
        lien(archives(em.site, sujet), 'Chercher « ' + sujet + ' » dans les archives') + '</div>';
    }).join('');
    return html ? '<section class="bloc"><h3>À écouter</h3>' + html + '</section>' : '';
  }

  function chapMot(e) {
    var lemme = e.lemme || String(e.mot).toLowerCase();
    var nature = CATEGORIES[e.categorie] || e.categorie || '';
    return '<h2 class="titre titre-mot">' + esc(e.mot) + '</h2>' +
      (nature ? '<p class="nature">' + esc(nature) + '</p>' : '') +
      '<p class="chapeau">' + esc(e.definition) + '</p>' +
      (e.exemple ? '<p class="citation">« ' + esc(e.exemple) + ' »</p>' : '') +
      '<div class="volets">' +
        volet('En situation', liste(e.situations)) +
        volet('Synonymes', e.synonymes && e.synonymes.length ? '<p>' + esc(e.synonymes.join(', ')) + '</p>' : '') +
        volet('La nuance', e.piege ? '<p>' + esc(e.piege) + '</p>' : '') +
        volet('Pour aller plus loin', '<p class="liens">' +
          lien('https://www.cnrtl.fr/definition/' + encodeURIComponent(lemme), 'Définition et étymologie au CNRTL') +
          lien('https://www.cnrtl.fr/synonymie/' + encodeURIComponent(lemme), 'Tous les synonymes au CNRTL') + '</p>') +
      '</div>';
  }

  function chapDate(e, k) {
    var sujet = e.wikipedia || e.evenement;
    return '<h2 class="titre titre-annee">' + esc(e.annee) + '</h2>' +
      '<p class="evenement">' + esc(e.evenement) + '</p>' +
      '<p class="chapeau">' + esc(e.contexte) + '</p>' +
      '<figure class="illustration" data-wiki="' + k + '" data-part="date-image"></figure>' +
      (e.recit ? '<p class="recit">' + esc(e.recit) + '</p>' : '') +
      blocEcoute('date', e, sujet) +
      '<div class="volets">' +
        volet('Le résumé de Wikipédia', zoneWiki(k, 'date-extrait', true)) +
        volet('Pour aller plus loin', '<p class="liens">' +
          lien(wikiUrl(sujet), 'L’article complet sur Wikipédia') +
          lien('https://www.youtube.com/results?search_query=' + encodeURIComponent(sujet + ' histoire'), 'Des vidéos sur YouTube') + '</p>') +
      '</div>';
  }

  function chapArtiste(e, k) {
    var meta = [e.discipline, e.pays, e.epoque].filter(Boolean).join(', ');
    var mv = e.mouvement || {};
    var oeuvres = e.oeuvres_cles || (e.oeuvre ? [e.oeuvre] : []);
    return '<h2 class="titre titre-artiste">' + esc(e.nom) + '</h2>' +
      (meta ? '<p class="nature">' + esc(meta) + '</p>' : '') +
      '<p class="chapeau">' + esc(e.presentation) + '</p>' +
      '<div class="galerie" data-wiki="' + k + '" data-part="artiste-galerie"></div>' +
      (e.oeuvre ? '<p class="pour-commencer"><span>Pour commencer</span>' + esc(e.oeuvre) + '</p>' : '') +
      blocEcoute('artiste', e, e.nom) +
      '<div class="volets">' +
        volet('Sa vie', e.bio ? '<p>' + esc(e.bio) + '</p>' : '') +
        volet('Œuvres clés', liste(oeuvres)) +
        (mv.nom ? volet('Le courant : ' + mv.nom, '<p>' + esc(mv.texte) + '</p><p class="liens">' + lien(wikiUrl(mv.nom), 'Le courant sur Wikipédia') + '</p>') : '') +
        volet('Le résumé de Wikipédia', zoneWiki(k, 'artiste-extrait', true)) +
        volet('Pour aller plus loin', '<p class="liens">' +
          lien(wikiUrl(e.wikipedia || e.nom), 'L’article complet sur Wikipédia') +
          lien('https://artsandculture.google.com/search?q=' + encodeURIComponent(e.nom), 'Ses œuvres sur Google Arts & Culture') +
          lien('https://www.youtube.com/results?search_query=' + encodeURIComponent(e.nom), 'Des vidéos sur YouTube') + '</p>') +
      '</div>';
  }

  function chapVerrou(t) {
    var r = reste(t);
    return '<div class="verrou"><p class="annonce">' + ANNONCES[t] + '</p>' +
      '<p class="rendezvous">Rendez-vous à ' + heure(t) + '.</p>' +
      (r ? '<p class="reste">' + r + '</p>' : '') + '</div>';
  }

  function chapitre(t, k, e) {
    var contenu = !e ? chapVerrou(t) : t === 'mot' ? chapMot(e) : t === 'date' ? chapDate(e, k) : chapArtiste(e, k);
    return '<section class="chap chap-' + t + '" id="chap-' + t + '"><div class="chap-int">' +
      '<header class="chap-tete"><span class="moment">' + NOMS[t] + '</span><span class="heure">' + heure(t) + '</span></header>' +
      contenu + '</div></section>';
  }

  function vueJour() {
    var j = D.jours[D.aujourdhui] || {};
    var note = !j.mot ? '<p class="note">La journée commence à ' + heure('mot') + '. Celle d’hier vous attend dans le carnet.</p>' : '';
    return note + TYPES.map(function (t) { return chapitre(t, D.aujourdhui, j[t]); }).join('');
  }

  function vueCarnet() {
    var cles = Object.keys(D.jours).sort();
    var hier = cles.length > 1 ? cles[cles.length - 2] : D.aujourdhui;
    if (!etat.choisi) etat.choisi = D.jours[D.aujourdhui] && D.jours[D.aujourdhui].mot ? D.aujourdhui : hier;
    if (!etat.mois) etat.mois = etat.choisi.slice(0, 7);
    var an = +etat.mois.slice(0, 4), mo = +etat.mois.slice(5, 7) - 1;
    var decalage = (new Date(an, mo, 1).getDay() + 6) % 7;
    var nb = new Date(an, mo + 1, 0).getDate();
    var cases = '';
    for (var i = 0; i < decalage; i++) cases += '<span class="case"></span>';
    for (var d = 1; d <= nb; d++) {
      var k = an + '-' + pad(mo + 1) + '-' + pad(d);
      var j = D.jours[k];
      if (!j || !(j.mot || j.date || j.artiste)) {
        cases += '<span class="case ' + (k > D.aujourdhui ? 'futur' : 'hors') + '">' + d + '</span>';
        continue;
      }
      var points = TYPES.map(function (t) { return '<b' + (j[t] ? ' class="p-' + t + '"' : '') + '></b>'; }).join('');
      cases += '<button class="case jour' + (k === etat.choisi ? ' choisi' : '') + (k === D.aujourdhui ? ' auj' : '') +
        '" data-jour="' + k + '" aria-label="' + esc(titreJour(k)) + '"><span>' + d + '</span><em>' + points + '</em></button>';
    }
    var min = D.debut.slice(0, 7), max = D.aujourdhui.slice(0, 7);
    var entete = '<div class="mois">' +
      '<button class="fleche" data-mois="-1" aria-label="Mois précédent"' + (etat.mois <= min ? ' disabled' : '') + '>‹</button>' +
      '<h2>' + capitale(MOIS[mo]) + ' ' + an + '</h2>' +
      '<button class="fleche" data-mois="1" aria-label="Mois suivant"' + (etat.mois >= max ? ' disabled' : '') + '>›</button></div>';
    var semaine = '<div class="semaine">' + ['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(function (x) { return '<span>' + x + '</span>'; }).join('') + '</div>';
    var legende = '<p class="legende"><span><b class="p-mot"></b>Mot</span><span><b class="p-date"></b>Date</span><span><b class="p-artiste"></b>Artiste</span></p>';
    var vide = cles.length <= 1 ? '<p class="vide">Votre carnet se remplit jour après jour. Dès demain, vous y retrouverez ce que vous avez appris aujourd’hui.</p>' : '';
    var jour = D.jours[etat.choisi] || {};
    var detail = '<h2 class="titre-jour" id="titre-jour">' + capitale(titreJour(etat.choisi)) + '</h2>' +
      TYPES.map(function (t) {
        if (jour[t]) return chapitre(t, etat.choisi, jour[t]);
        return etat.choisi === D.aujourdhui ? chapitre(t, etat.choisi, null) : '';
      }).join('');
    return '<div class="carnet">' + entete + semaine + '<div class="grille">' + cases + '</div>' + legende + vide + '</div>' + detail;
  }

  function rendre() {
    var tete = '<header class="tete"><h1>Trois fois par jour</h1>' +
      '<p class="date-jour">' + capitale(titreJour(D.aujourdhui)) + '</p>' +
      '<nav><button data-vue="jour"' + (etat.vue === 'jour' ? ' aria-current="page"' : '') + '>Aujourd’hui</button>' +
      '<button data-vue="carnet"' + (etat.vue === 'carnet' ? ' aria-current="page"' : '') + '>Carnet</button></nav></header>';
    document.getElementById('app').innerHTML = tete + '<main>' + (etat.vue === 'jour' ? vueJour() : vueCarnet()) + '</main>';
    demander(etat.vue === 'jour' ? D.aujourdhui : etat.choisi);
  }

  // Les extraits et images de Wikipédia sont demandés à Scriptable, qui les télécharge
  function demander(k) {
    if (demandes[k]) { remplir(); return; }
    var j = D.jours[k] || {}, items = [];
    if (j.date) items.push({ id: 'date', q: j.date.wikipedia || j.date.evenement, galerie: false });
    if (j.artiste) items.push({ id: 'artiste', q: j.artiste.wikipedia || j.artiste.nom, galerie: true });
    if (!items.length) return;
    demandes[k] = true;
    setTimeout(function () { if (!wiki[k]) { wiki[k] = {}; remplir(); } }, 15000);
    window.location.href = 'tfpj://wiki?' + encodeURIComponent(JSON.stringify({ cle: k, items: items }));
  }

  window.recevoirWiki = function (r) { wiki[r.cle] = r.resultats || {}; remplir(); };

  function remplir() {
    var zones = document.querySelectorAll('[data-wiki]');
    for (var i = 0; i < zones.length; i++) {
      var z = zones[i], res = wiki[z.getAttribute('data-wiki')];
      if (!res) continue;
      var partie = z.getAttribute('data-part');
      var cible = res[partie.split('-')[0]];
      if (partie === 'date-image') {
        z.innerHTML = cible && cible.image ? '<img src="' + esc(cible.image) + '" alt=""><figcaption>Image : Wikipédia</figcaption>' : '';
      } else if (partie === 'artiste-galerie') {
        z.innerHTML = cible && cible.galerie && cible.galerie.length ? cible.galerie.map(function (g) {
          return '<figure><img src="' + esc(g.src) + '" alt="' + esc(g.legende) + '" loading="lazy">' +
            (g.legende ? '<figcaption>' + esc(g.legende) + '</figcaption>' : '') + '</figure>';
        }).join('') : '';
      } else {
        z.innerHTML = cible && cible.extrait
          ? '<p>' + esc(cible.extrait) + '</p><p class="source">Source : Wikipédia, article « ' + esc(cible.titre) + ' »</p>'
          : '<p class="attente">Le résumé n’est pas disponible pour le moment. Vérifiez la connexion, puis rouvrez la fiche.</p>';
      }
    }
  }

  document.addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-vue],[data-jour],[data-mois]');
    if (!b) return;
    if (b.hasAttribute('data-vue')) {
      etat.vue = b.getAttribute('data-vue');
      rendre();
      window.scrollTo(0, 0);
    } else if (b.hasAttribute('data-jour')) {
      etat.choisi = b.getAttribute('data-jour');
      rendre();
      var t = document.getElementById('titre-jour');
      if (t) window.scrollTo(0, t.offsetTop - 12);
    } else {
      var a = +etat.mois.slice(0, 4), m = +etat.mois.slice(5, 7) - 1 + (+b.getAttribute('data-mois'));
      etat.mois = cleDe(new Date(a, m, 1)).slice(0, 7);
      rendre();
    }
  });

  rendre();
  // À l'ouverture, on arrive directement sur ce qui vient d'être révélé
  if (D.actuel && D.actuel !== 'mot') {
    var c = document.getElementById('chap-' + D.actuel);
    if (c) window.scrollTo(0, c.offsetTop);
  }
})();
`

function pageHTML(donnees) {
  const json = JSON.stringify(donnees).replace(/</g, "\\u003c")
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<style>${STYLES}</style></head>
<body><div id="app"></div>
<script type="application/json" id="donnees">${json}</script>
<script>${SCRIPT_PAGE}</script>
</body></html>`
}


// ---------- LANCEMENT ----------

const maintenant = new Date()
const parametre = (args.widgetParameter || "").trim().toLowerCase()
const typeFixe = TYPES.includes(parametre) ? parametre : null

if (config.runsInWidget) {
  const moment = typeFixe ? momentFixe(typeFixe, maintenant) : momentActuel(maintenant)
  const liste = await charger(moment.type)
  const entree = choisir(liste, moment.jour)
  const f = fiche(moment.type, entree)

  const h = lireHistorique()
  noter(h, moment.jour, moment.type, entree)
  ecrireHistorique(h)

  let w
  switch (config.widgetFamily) {
    case "accessoryRectangular": w = widgetRectangulaire(f); break
    case "accessoryInline": w = widgetLigne(f); break
    case "accessoryCircular": w = widgetRond(f); break
    case "medium":
    case "large":
    case "extraLarge": w = widgetCouleur(f, moment.type, true); break
    default: w = widgetCouleur(f, moment.type, false)
  }
  w.refreshAfterDate = prochainChangement(maintenant)
  Script.setWidget(w)
} else {
  const [mots, dates, artistes] = await Promise.all([charger("mot"), charger("date"), charger("artiste")])
  const listes = { mot: mots, date: dates, artiste: artistes }
  const cleAujourdhui = cle(maintenant)

  // Le carnet note ce qui est révélé, et rien de ce qui ne l'est pas encore
  const h = lireHistorique()
  for (const t of TYPES) {
    if (revele(t, maintenant)) noter(h, maintenant, t, choisir(listes[t], maintenant))
  }
  if (!revele("mot", maintenant)) {
    const hier = veille(maintenant)
    for (const t of TYPES) noter(h, hier, t, choisir(listes[t], hier))
  }
  if (!h.debut) h.debut = cleAujourdhui
  h.jours[cleAujourdhui] = h.jours[cleAujourdhui] || {}
  h.jours[cleAujourdhui].lu = true
  ecrireHistorique(h)

  // Chaque jour depuis la première utilisation, jusqu'à aujourd'hui inclus
  const jours = {}
  const curseur = dateDeCle(h.debut)
  while (cle(curseur) <= cleAujourdhui) {
    const k = cle(curseur)
    const passe = k < cleAujourdhui
    const garde = h.jours[k] || {}
    const j = {}
    for (const t of TYPES) {
      if (passe || revele(t, maintenant)) {
        j[t] = actualiser(t, garde[t], listes[t]) || choisir(listes[t], curseur)
      }
    }
    if (garde.lu) j.lu = true
    jours[k] = j
    curseur.setDate(curseur.getDate() + 1)
  }

  const donnees = {
    horaires: HORAIRES,
    aujourdhui: cleAujourdhui,
    debut: h.debut,
    actuel: revele("mot", maintenant) ? momentActuel(maintenant).type : null,
    jours,
    emissions: EMISSIONS,
  }

  const vue = new WebView()

  async function repondreWiki(url) {
    try {
      const demande = JSON.parse(decodeURIComponent(url.slice(url.indexOf("?") + 1)))
      const resultats = {}
      await Promise.all(demande.items.map(async it => { resultats[it.id] = await wikipedia(it.q, it.galerie) }))
      await vue.evaluateJavaScript(`window.recevoirWiki(${JSON.stringify({ cle: demande.cle, resultats })})`, false)
    } catch (e) {
      console.log(`Liaison avec Wikipédia interrompue : ${e}`)
    }
  }

  // Les liens s'ouvrent dans Safari ; les demandes Wikipédia passent par Scriptable
  vue.shouldAllowRequest = requete => {
    const url = requete.url || ""
    if (url.startsWith("tfpj://")) { repondreWiki(url); return false }
    if (url.startsWith("http")) { Safari.open(url); return false }
    return true
  }

  await vue.loadHTML(pageHTML(donnees))
  await vue.present(true)
}

Script.complete()
