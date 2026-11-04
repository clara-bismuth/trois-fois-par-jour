// ============================================================
// Trois fois par jour · version 4
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

// Une couleur pastel par moment de la journée : rose le matin, jaune à midi, pervenche le soir.
// Sur l'écran verrouillé, iOS impose sa propre teinte.
const COULEURS = {
  encre: new Color("#161616"),
  fond: {
    mot: Color.dynamic(new Color("#F7C8DF"), new Color("#E9B6CF")),
    date: Color.dynamic(new Color("#F5E3A0"), new Color("#E6D38E")),
    artiste: Color.dynamic(new Color("#BAC7FD"), new Color("#A9B6EE")),
  },
}

const POLICE_TITRE = "Charter-Bold"
const POLICE_TITRE_FINE = "Charter-Roman"

const DEPOT = "https://github.com/clara-bismuth/trois-fois-par-jour"

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
const CHEMIN_FAVORIS = fm.joinPath(dossier, "favoris.json")

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

function lireFavoris() {
  try {
    if (fm.fileExists(CHEMIN_FAVORIS)) return JSON.parse(fm.readString(CHEMIN_FAVORIS))
  } catch (e) {}
  return []
}

function ecrireFavoris(liste) {
  try { fm.writeString(CHEMIN_FAVORIS, JSON.stringify(liste)) } catch (e) { console.log(`Favoris non enregistrés : ${e}`) }
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
  libelle.font = Font.mediumSystemFont(12)
  libelle.textColor = COULEURS.encre
  libelle.textOpacity = 0.7
  w.addSpacer(6)
  const titre = w.addText(f.titre)
  titre.font = new Font(POLICE_TITRE_FINE, grand ? 30 : 26)
  titre.textColor = COULEURS.encre
  titre.lineLimit = 1
  titre.minimumScaleFactor = 0.5
  if (f.meta) {
    const meta = w.addText(f.meta)
    meta.font = Font.systemFont(12)
    meta.textColor = COULEURS.encre
    meta.textOpacity = 0.7
    meta.lineLimit = 1
    meta.minimumScaleFactor = 0.7
  }
  w.addSpacer(8)
  const principal = w.addText(f.principal)
  principal.font = Font.systemFont(grand ? 14 : 13)
  principal.textColor = COULEURS.encre
  principal.lineLimit = grand ? 2 : 4
  principal.minimumScaleFactor = 0.8
  if (grand && f.detail) {
    w.addSpacer(4)
    const detail = w.addText(f.detail)
    detail.font = Font.italicSystemFont(13)
    detail.textColor = COULEURS.encre
    detail.textOpacity = 0.75
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
  --fond: #F6F6F3; --encre: #161616; --doux: #66665F; --filet: rgba(22, 22, 22, .12); --vide: #E4E3DD;
  --rose: #F7C8DF; --jaune: #F5E3A0; --pervenche: #BAC7FD; --sauge: #C5D9A4; --ciel: #CFE1F6; --peche: #F7CC9F;
  --sur-pastel: #161616; --barre: #161616; --barre-texte: #F6F6F3;
  --titre: "Charter", "New York", "Iowan Old Style", serif;
  --sans: -apple-system, "SF Pro Text", "Helvetica Neue", sans-serif;
}
@media (prefers-color-scheme: dark) {
  :root {
    --fond: #151514; --encre: #F2F1EC; --doux: #A8A79F; --filet: rgba(242, 241, 236, .14); --vide: #2B2B28;
    --rose: #E9B6CF; --jaune: #E6D38E; --pervenche: #A9B6EE; --sauge: #B3C892; --ciel: #BACDE4; --peche: #E6B98B;
    --barre: #2A2A27;
  }
}
* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body { margin: 0; background: var(--fond); color: var(--encre); font: 17px/1.55 var(--sans);
       -webkit-font-smoothing: antialiased; }
button { font: inherit; color: inherit; background: none; border: 0; padding: 0; cursor: pointer; text-align: inherit; }
a { color: inherit; }
:focus-visible { outline: 2px solid currentColor; outline-offset: 3px; }
svg { display: block; }

.page { max-width: 640px; margin: 0 auto; padding: calc(24px + env(safe-area-inset-top)) 20px calc(120px + env(safe-area-inset-bottom)); }

/* En-tête des onglets */
.marque { display: flex; justify-content: space-between; align-items: center; font: 600 14px/1 var(--sans); color: var(--doux); }
.serie { font: 500 13px/1 var(--sans); color: var(--sur-pastel); background: var(--sauge); padding: 6px 10px; border-radius: 6px; }
.grand-titre { font: 400 clamp(34px, 9.5vw, 42px)/1.08 var(--titre); margin: 14px 0 26px; letter-spacing: -.01em; }

/* Tuiles du jour */
.tuiles { display: grid; gap: 12px; }
.tuile { position: relative; display: block; width: 100%; background: var(--teinte); color: var(--sur-pastel);
         border-radius: 26px; padding: 20px 20px 22px; min-height: 150px; overflow: hidden; }
.tuile-tete { display: flex; justify-content: space-between; font: 500 14px/1.2 var(--sans); margin-bottom: 14px; }
.tuile-tete .h { opacity: .7; }
.tuile h2 { font: 400 clamp(30px, 8.6vw, 36px)/1.05 var(--titre); margin: 0; max-width: 78%; overflow-wrap: break-word; }
.tuile p { margin: 8px 0 0; font-size: 15px; line-height: 1.45; max-width: 80%;
           display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.tuile .mini { position: absolute; right: 14px; bottom: 14px; width: 74px; opacity: .95; }
.tuile.fermee { min-height: 0; padding-bottom: 20px; }
.tuile.fermee h2 { font-size: 26px; }
.tuile.fermee .verrou { display: flex; align-items: center; gap: 8px; margin-top: 10px; font-size: 15px; }

.m-mot { --teinte: var(--rose); --surligne: var(--jaune); }
.m-date { --teinte: var(--jaune); --surligne: var(--rose); }
.m-artiste { --teinte: var(--pervenche); --surligne: var(--jaune); }

/* Fiche plein écran */
.fiche { background: var(--teinte); color: var(--sur-pastel); min-height: 100vh; }
.fiche .page { padding-top: calc(16px + env(safe-area-inset-top)); }
.fiche-haut { display: flex; justify-content: space-between; align-items: center; }
.rond { width: 44px; height: 44px; border-radius: 50%; border: 1.5px dashed rgba(22, 22, 22, .45);
        display: flex; align-items: center; justify-content: center; }
.illus { width: 168px; margin: 8px auto 18px; }
.fiche h1 { font: 400 clamp(40px, 12vw, 58px)/1.02 var(--titre); margin: 0; letter-spacing: -.015em; overflow-wrap: break-word; }
.sous-titre { font: 400 22px/1.3 var(--titre); margin: 10px 0 0; }
.nature { display: inline-block; margin-top: 12px; font-size: 14px; background: var(--surligne); padding: 2px 8px; border-radius: 4px; }
.actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 24px 0 0; }
.action { display: flex; align-items: center; gap: 10px; padding: 13px 14px; border-radius: 12px;
          border: 1px solid rgba(22, 22, 22, .16); background: rgba(255, 255, 255, .28); font: 600 15px/1 var(--sans); }
.action[aria-pressed="true"] { background: rgba(255, 255, 255, .6); }
.chiffres { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 26px 0 0; }
.chiffres strong { display: block; font: 400 32px/1.1 var(--titre); }
.chiffres span { font-size: 14px; }
.lead { font-size: 19px; line-height: 1.55; margin: 26px 0 0; }
.citation { font: italic 19px/1.5 var(--titre); margin: 16px 0 0; }
.corps { margin: 16px 0 0; }
.visuel { margin: 26px 0 0; }
.visuel img { display: block; width: 100%; max-height: 380px; object-fit: cover; border-radius: 18px; }
.legende-img { font-size: 12px; opacity: .7; margin-top: 6px; }
.visuel:empty, .galerie:empty { display: none; }
.galerie { display: flex; gap: 10px; overflow-x: auto; margin: 26px -20px 0; padding: 0 20px 4px;
           scroll-snap-type: x mandatory; scrollbar-width: none; }
.galerie::-webkit-scrollbar { display: none; }
.galerie figure { margin: 0; flex: 0 0 76%; scroll-snap-align: start; }
.galerie img { display: block; width: 100%; height: 240px; object-fit: cover; border-radius: 18px; background: rgba(255, 255, 255, .3); }
.galerie figcaption { font-size: 12px; opacity: .75; margin-top: 6px; }
.commencer { margin: 24px 0 0; padding: 16px; border-radius: 16px; background: rgba(255, 255, 255, .32); }
.commencer span { display: block; font-size: 13px; opacity: .7; }
.commencer strong { font: 400 20px/1.3 var(--titre); }

h3 { font: 400 26px/1.2 var(--titre); margin: 38px 0 10px; }
.ecoute { padding: 16px 0; border-top: 1px solid rgba(22, 22, 22, .14); }
.ecoute:first-of-type { border-top: 0; padding-top: 4px; }
.ecoute-titre { font: 400 21px/1.3 var(--titre); text-decoration: none; }
.ecoute-texte { font-size: 14px; line-height: 1.5; opacity: .78; margin: 4px 0 8px; }
.lien { font-weight: 600; font-size: 15px; text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 3px; }
.liens .lien { display: block; padding: 7px 0; }
.surligne { background: var(--surligne); padding: 1px 6px; border-radius: 4px; margin: 0 6px 8px 0; display: inline-block; font-size: 15px; }

.volets { margin-top: 32px; border-bottom: 1px solid rgba(22, 22, 22, .14); }
details { border-top: 1px solid rgba(22, 22, 22, .14); }
summary { list-style: none; display: flex; justify-content: space-between; align-items: center; padding: 17px 0;
          font: 600 16px/1.3 var(--sans); cursor: pointer; }
summary::-webkit-details-marker { display: none; }
summary i { position: relative; width: 14px; height: 14px; flex: none; }
summary i::before, summary i::after { content: ""; position: absolute; left: 0; top: 6.5px; width: 14px; height: 1.5px;
                                      background: currentColor; transition: transform .25s ease; }
summary i::after { transform: rotate(90deg); }
details[open] summary i::after { transform: rotate(0deg); }
.volet { padding: 0 0 20px; }
.volet p { margin: 0 0 12px; }
.volet ul { margin: 0; padding-left: 18px; }
.volet li { margin: 0 0 8px; }
.source { font-size: 12px; opacity: .7; }
.attente { opacity: .7; font-style: italic; }

/* Carnet */
.mois { display: flex; justify-content: space-between; align-items: center; }
.mois h2 { font: 400 30px/1.1 var(--titre); margin: 0; }
.fleche { width: 44px; height: 44px; border-radius: 50%; border: 1px solid var(--filet); display: flex; align-items: center; justify-content: center; }
.fleche:disabled { opacity: .25; cursor: default; }
.semaine, .grille { display: grid; grid-template-columns: repeat(7, 1fr); text-align: center; }
.semaine { font: 500 12px/1 var(--sans); color: var(--doux); margin: 22px 0 8px; }
.case { height: 52px; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 15px; }
.hors, .futur { color: var(--doux); opacity: .4; }
.case { min-width: 0; }
.num { display: block; width: 36px; height: 36px; line-height: 36px; border-radius: 50%; text-align: center; }
.auj .num { box-shadow: inset 0 0 0 1.5px var(--encre); }
.choisi .num { background: var(--encre); color: var(--fond); box-shadow: none; }
.points { display: flex; gap: 3px; margin-top: 3px; height: 5px; }
.points b { width: 5px; height: 5px; border-radius: 50%; }
.p-mot { background: #D9799F; } .p-date { background: #D2A92E; } .p-artiste { background: #6E7FDA; }
.cles { display: flex; gap: 16px; font-size: 13px; color: var(--doux); margin: 14px 0 0; }
.cles span { display: inline-flex; align-items: center; gap: 6px; }
.cles b { width: 7px; height: 7px; border-radius: 50%; }
.titre-section { font: 400 28px/1.15 var(--titre); margin: 34px 0 14px; }
.rangee { display: flex; align-items: center; gap: 14px; width: 100%; background: var(--teinte); color: var(--sur-pastel);
          border-radius: 18px; padding: 14px 16px; margin-bottom: 10px; }
.rangee .mini { width: 46px; flex: none; }
.rangee .txt { min-width: 0; }
.rangee small { display: block; font-size: 13px; opacity: .7; }
.rangee strong { display: block; font: 400 21px/1.2 var(--titre); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.vide-texte { color: var(--doux); margin: 16px 0 0; }

/* Progrès */
.anneau { position: relative; width: 250px; height: 250px; margin: 6px auto 0; }
.anneau .centre { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
.anneau strong { font: 400 72px/1 var(--titre); }
.anneau span { font-size: 14px; color: var(--doux); margin-top: 6px; max-width: 140px; }
.semaine-lue { display: grid; grid-template-columns: repeat(7, 1fr); text-align: center; font-size: 12px; color: var(--doux); width: 250px; margin: 8px auto 0; }
.stats { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 30px; }
.stat { border-radius: 22px; padding: 18px; background: var(--teinte); color: var(--sur-pastel); }
.stat strong { display: block; font: 400 40px/1 var(--titre); }
.stat span { font-size: 14px; }
.s-sauge { --teinte: var(--sauge); } .s-ciel { --teinte: var(--ciel); } .s-peche { --teinte: var(--peche); }
.explication { color: var(--doux); font-size: 14px; margin: 18px 0 0; }

/* Barre de navigation */
.barre { position: fixed; left: 16px; right: 16px; bottom: calc(12px + env(safe-area-inset-bottom)); max-width: 460px; margin: 0 auto;
         background: var(--barre); color: var(--barre-texte); border-radius: 30px; padding: 8px; display: grid;
         grid-template-columns: repeat(4, 1fr); gap: 4px; z-index: 10; }
.barre button { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 8px 0 7px; border-radius: 22px;
                font: 500 11px/1 var(--sans); color: var(--barre-texte); }
.barre button[aria-current] { background: var(--rose); color: #161616; }
.barre svg { width: 22px; height: 22px; }

@media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
`


// ---------- PAGE DE L'APP : COMPORTEMENT ----------

const SCRIPT_PAGE = String.raw`
(function () {
  var D = JSON.parse(document.getElementById('donnees').textContent);
  var NB = String.fromCharCode(160);
  var TYPES = ['mot', 'date', 'artiste'];
  var NOMS = { mot: 'Le mot du matin', date: 'La date de midi', artiste: 'L’artiste du soir' };
  var COURTS = { mot: 'Mot', date: 'Date', artiste: 'Artiste' };
  var ANNONCES = { mot: 'Un mot à apprivoiser', date: 'Une date à retenir', artiste: 'Une œuvre à découvrir' };
  var CATEGORIES = { 'n. f.': 'nom féminin', 'n. m.': 'nom masculin', 'n. f. pl.': 'nom féminin pluriel',
    'n. m. pl.': 'nom masculin pluriel', 'adj.': 'adjectif', 'adv.': 'adverbe', 'v.': 'verbe', 'v. pron.': 'verbe pronominal' };
  var MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  var SEMAINE = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  var INITIALES = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
  var etat = { onglet: 'jour', fiche: null, mois: null, choisi: null };
  var wiki = {}, demandes = {};
  var favoris = D.favoris || [];

  // ---------- Outils ----------
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function capitale(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function dateDe(k) { var p = k.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function cleDe(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function titreJour(k) { var d = dateDe(k); return SEMAINE[d.getDay()] + ' ' + d.getDate() + (d.getDate() === 1 ? 'er' : '') + ' ' + MOIS[d.getMonth()]; }
  function heure(t) { var h = D.horaires[t]; return h[0] + NB + 'h' + (h[1] ? NB + pad(h[1]) : ''); }
  function nombre(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, NB); }
  function reste(t) {
    var h = D.horaires[t], cible = new Date(); cible.setHours(h[0], h[1], 0, 0);
    var m = Math.round((cible - new Date()) / 60000);
    if (m <= 0) return '';
    var hh = Math.floor(m / 60), mm = m % 60;
    return 'dans ' + (hh ? hh + NB + 'h' + (mm ? NB + pad(mm) : '') : mm + NB + 'min');
  }
  function identite(t, e) { return t === 'mot' ? e.mot : t === 'date' ? e.annee + '|' + e.evenement : e.nom; }
  function titreDe(t, e) { return t === 'mot' ? e.mot : t === 'date' ? e.annee : e.nom; }
  function resumeDe(t, e) { return t === 'mot' ? e.definition : t === 'date' ? e.evenement : [e.discipline, e.epoque].filter(Boolean).join(', '); }
  function lien(url, texte, classe) { return '<a class="' + (classe || 'lien') + '" href="' + esc(url) + '">' + esc(texte) + '</a>'; }
  function wikiUrl(q) { return 'https://fr.wikipedia.org/w/index.php?search=' + encodeURIComponent(q); }
  function archives(site, q) { return 'https://duckduckgo.com/?q=' + encodeURIComponent('site:' + site + ' ' + q); }
  function liste(items) { return items && items.length ? '<ul>' + items.map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('') + '</ul>' : ''; }
  function volet(titre, contenu) {
    if (!contenu) return '';
    return '<details><summary><span>' + esc(titre) + '</span><i aria-hidden="true"></i></summary><div class="volet">' + contenu + '</div></details>';
  }
  function pont(action, donnee) { window.location.href = 'tfpj://' + action + '?' + encodeURIComponent(JSON.stringify(donnee)); }
  function entreeDe(t, k) {
    var j = D.jours[k];
    if (j && j[t]) return j[t];
    for (var i = 0; i < favoris.length; i++) if (favoris[i].type === t && favoris[i].jour === k) return favoris[i].entree;
    return null;
  }
  function estFavori(t, e) {
    var id = identite(t, e);
    return favoris.some(function (f) { return f.type === t && f.id === id; });
  }

  // ---------- Dessins au trait ----------
  var TRAIT = ' fill="none" stroke="#161616" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"';
  var ILLUS = {
    mot: '<svg viewBox="0 0 160 130"' + TRAIT + ' aria-hidden="true">' +
      '<path d="M28 24c32-7 74-8 102-2 9 2 13 8 13 17v31c0 9-5 15-14 16-14 2-30 2-44 2l-23 19 4-19c-12-1-24-2-35-4-8-2-11-8-11-15V40c0-9 3-14 8-16z"/>' +
      '<text x="80" y="70" text-anchor="middle" font-family="Charter, Georgia, serif" font-size="36" font-style="italic" fill="#161616" stroke="none">Aa</text>' +
      '<path d="M146 12l5-7M152 22l8-2M139 8l-1-6"/></svg>',
    date: '<svg viewBox="0 0 160 130"' + TRAIT + ' aria-hidden="true">' +
      '<path d="M50 14c18-2 42-2 60 0M50 116c18 2 42 2 60 0"/>' +
      '<path d="M57 16c-1 24 20 32 23 48 3-16 24-24 23-48"/>' +
      '<path d="M57 114c-1-24 20-32 23-48 3 16 24 24 23 48"/>' +
      '<path d="M66 106c5-9 23-9 28 0"/><path d="M80 70v26" stroke-dasharray="2 6"/>' +
      '<path d="M66 32c5 5 23 5 28 0"/><path d="M122 36l9-5M126 52l10 1M30 44l-10-3M34 60l-9 4"/></svg>',
    artiste: '<svg viewBox="0 0 160 130"' + TRAIT + ' aria-hidden="true">' +
      '<path d="M76 20c-34 1-58 22-58 47 0 22 18 39 41 39 11 0 13-8 9-15-4-7 0-14 9-14h14c19 0 31-10 31-25 0-19-19-33-46-32z"/>' +
      '<circle cx="52" cy="50" r="7"/><circle cx="76" cy="38" r="7"/><circle cx="101" cy="44" r="7"/><circle cx="44" cy="75" r="7"/>' +
      '<path d="M116 110l26-40"/><path d="M137 66c3-7 11-9 14-4 3 4-1 11-8 12"/><path d="M112 117c-3 4-9 4-11 1"/></svg>'
  };
  var ICONES = {
    jour: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/></svg>',
    carnet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/><circle cx="8.5" cy="14.5" r=".6" fill="currentColor"/><circle cx="12" cy="14.5" r=".6" fill="currentColor"/></svg>',
    favoris: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z"/></svg>',
    progres: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M12 3.5a8.5 8.5 0 1 1-8.1 5.9"/><path d="M12 8a4 4 0 1 1-3.8 2.8"/></svg>',
    retour: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
    coeur: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z"/></svg>',
    coeurPlein: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z"/></svg>',
    partager: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5v11M8 7.5l4-4 4 4"/><path d="M7 11H5.5v9.5h13V11H17"/></svg>',
    cadenas: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/></svg>',
    gauche: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
    droite: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>'
  };

  // ---------- Série et statistiques ----------
  function serie() {
    var n = 0, d = dateDe(D.aujourdhui);
    while (true) {
      var j = D.jours[cleDe(d)];
      if (!j || !j.lu) break;
      n++; d.setDate(d.getDate() - 1);
    }
    return n;
  }

  // ---------- Écoute ----------
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
    var html = emissionsPour(type, e).map(function (c) {
      if (typeof c === 'object') {
        return '<div class="ecoute">' + lien(c.url, c.titre, 'ecoute-titre') + (c.texte ? '<p class="ecoute-texte">' + esc(c.texte) + '</p>' : '') + '</div>';
      }
      var em = D.emissions[c];
      if (!em) return '';
      return '<div class="ecoute">' + lien(em.url, em.titre, 'ecoute-titre') +
        '<p class="ecoute-texte">' + esc(em.chaine + '. ' + em.texte) + '</p>' +
        lien(archives(em.site, sujet), 'Chercher « ' + sujet + ' » dans les archives') + '</div>';
    }).join('');
    return html ? '<h3>À écouter</h3>' + html : '';
  }

  // ---------- Vue : aujourd'hui ----------
  function tuile(t, k, e) {
    if (!e) {
      var r = reste(t);
      return '<div class="tuile fermee m-' + t + '"><div class="tuile-tete"><span>' + NOMS[t] + '</span><span class="h">' + heure(t) + '</span></div>' +
        '<h2>' + ANNONCES[t] + '</h2><div class="verrou">' + ICONES.cadenas + '<span>Rendez-vous à ' + heure(t) + (r ? ', ' + r : '') + '</span></div></div>';
    }
    return '<button class="tuile m-' + t + '" data-ouvrir="' + t + '|' + k + '">' +
      '<div class="tuile-tete"><span>' + NOMS[t] + '</span><span class="h">' + heure(t) + '</span></div>' +
      '<h2>' + esc(titreDe(t, e)) + '</h2><p>' + esc(resumeDe(t, e)) + '</p>' +
      '<div class="mini">' + ILLUS[t] + '</div></button>';
  }
  function vueJour() {
    var j = D.jours[D.aujourdhui] || {};
    var s = serie();
    return '<div class="page"><div class="marque"><span>Trois fois par jour</span>' +
      (s > 1 ? '<span class="serie">Série de ' + s + ' jours</span>' : '') + '</div>' +
      '<h1 class="grand-titre">' + capitale(titreJour(D.aujourdhui)) + '</h1>' +
      '<div class="tuiles">' + TYPES.map(function (t) { return tuile(t, D.aujourdhui, j[t]); }).join('') + '</div>' +
      (!j.mot ? '<p class="vide-texte">La journée commence à ' + heure('mot') + '. Celle d’hier vous attend dans le carnet.</p>' : '') +
      '</div>';
  }

  // ---------- Vue : fiche ----------
  function ilYa(annee) {
    var txt = String(annee), n = parseInt(txt.replace(/[^0-9]/g, ''), 10);
    if (!n) return null;
    var auj = new Date().getFullYear();
    var ecart = /av\./.test(txt) ? auj + n - 1 : auj - n;
    if (ecart < 1) return null;
    return { valeur: (/vers/.test(txt) ? 'env.' + NB : '') + nombre(ecart) + NB + 'ans', libelle: 'se sont écoulés depuis' };
  }
  function actions(t, e) {
    var fav = estFavori(t, e);
    return '<div class="actions"><button class="action" data-favori aria-pressed="' + fav + '">' + (fav ? ICONES.coeurPlein : ICONES.coeur) +
      '<span>' + (fav ? 'Gardé' : 'Garder') + '</span></button>' +
      '<button class="action" data-partager>' + ICONES.partager + '<span>Partager</span></button></div>';
  }
  function zone(k, t, partie, attente) {
    return '<div data-wiki="' + t + '|' + k + '" data-part="' + partie + '">' + (attente ? '<p class="attente">Chargement du résumé…</p>' : '') + '</div>';
  }
  function ficheMot(e, k) {
    var lemme = e.lemme || String(e.mot).toLowerCase();
    var nature = CATEGORIES[e.categorie] || e.categorie || '';
    return '<h1>' + esc(e.mot) + '</h1>' + (nature ? '<span class="nature">' + esc(nature) + '</span>' : '') + actions('mot', e) +
      '<p class="lead">' + esc(e.definition) + '</p>' +
      (e.exemple ? '<p class="citation">« ' + esc(e.exemple) + ' »</p>' : '') +
      (e.synonymes && e.synonymes.length ? '<h3>Synonymes</h3><p>' + e.synonymes.map(function (s) { return '<span class="surligne">' + esc(s) + '</span>'; }).join('') + '</p>' : '') +
      '<div class="volets">' +
        volet('En situation', liste(e.situations)) +
        volet('La nuance', e.piege ? '<p>' + esc(e.piege) + '</p>' : '') +
        volet('Pour aller plus loin', '<p class="liens">' +
          lien('https://www.cnrtl.fr/definition/' + encodeURIComponent(lemme), 'Définition et étymologie au CNRTL') +
          lien('https://www.cnrtl.fr/synonymie/' + encodeURIComponent(lemme), 'Tous les synonymes au CNRTL') + '</p>') +
      '</div>';
  }
  function ficheDate(e, k) {
    var sujet = e.wikipedia || e.evenement, ecart = ilYa(e.annee);
    return '<h1>' + esc(e.annee) + '</h1><p class="sous-titre">' + esc(e.evenement) + '</p>' + actions('date', e) +
      (ecart ? '<div class="chiffres"><div><strong>' + ecart.valeur + '</strong><span>' + ecart.libelle + '</span></div></div>' : '') +
      '<p class="lead">' + esc(e.contexte) + '</p>' +
      '<div class="visuel" data-wiki="date|' + k + '" data-part="image"></div>' +
      (e.recit ? '<p class="corps">' + esc(e.recit) + '</p>' : '') +
      blocEcoute('date', e, sujet) +
      '<div class="volets">' +
        volet('Le résumé de Wikipédia', zone(k, 'date', 'extrait', true)) +
        volet('Pour aller plus loin', '<p class="liens">' + lien(wikiUrl(sujet), 'L’article complet sur Wikipédia') +
          lien('https://www.youtube.com/results?search_query=' + encodeURIComponent(sujet + ' histoire'), 'Des vidéos sur YouTube') + '</p>') +
      '</div>';
  }
  function ficheArtiste(e, k) {
    var meta = [e.discipline, e.pays, e.epoque].filter(Boolean).join(', ');
    var mv = e.mouvement || {};
    return '<h1>' + esc(e.nom) + '</h1>' + (meta ? '<span class="nature">' + esc(meta) + '</span>' : '') + actions('artiste', e) +
      '<p class="lead">' + esc(e.presentation) + '</p>' +
      '<div class="galerie" data-wiki="artiste|' + k + '" data-part="galerie"></div>' +
      (e.oeuvre ? '<div class="commencer"><span>Pour commencer</span><strong>' + esc(e.oeuvre) + '</strong></div>' : '') +
      (e.bio ? '<h3>Sa vie</h3><p class="corps">' + esc(e.bio) + '</p>' : '') +
      blocEcoute('artiste', e, e.nom) +
      '<div class="volets">' +
        volet('Œuvres clés', liste(e.oeuvres_cles || (e.oeuvre ? [e.oeuvre] : []))) +
        (mv.nom ? volet('Le courant : ' + mv.nom, '<p>' + esc(mv.texte) + '</p><p class="liens">' + lien(wikiUrl(mv.nom), 'Le courant sur Wikipédia') + '</p>') : '') +
        volet('Le résumé de Wikipédia', zone(k, 'artiste', 'extrait', true)) +
        volet('Pour aller plus loin', '<p class="liens">' + lien(wikiUrl(e.wikipedia || e.nom), 'L’article complet sur Wikipédia') +
          lien('https://artsandculture.google.com/search?q=' + encodeURIComponent(e.nom), 'Ses œuvres sur Google Arts & Culture') +
          lien('https://www.youtube.com/results?search_query=' + encodeURIComponent(e.nom), 'Des vidéos sur YouTube') + '</p>') +
      '</div>';
  }
  function vueFiche() {
    var f = etat.fiche, e = entreeDe(f.type, f.cle);
    if (!e) { etat.fiche = null; return vueOnglet(); }
    var contenu = f.type === 'mot' ? ficheMot(e, f.cle) : f.type === 'date' ? ficheDate(e, f.cle) : ficheArtiste(e, f.cle);
    return '<article class="fiche m-' + f.type + '"><div class="page">' +
      '<div class="fiche-haut"><button class="rond" data-fermer aria-label="Revenir">' + ICONES.retour + '</button>' +
      '<span>' + (f.cle === D.aujourdhui ? NOMS[f.type] : capitale(titreJour(f.cle))) + '</span><span style="width:44px"></span></div>' +
      '<div class="illus">' + ILLUS[f.type] + '</div>' + contenu + '</div></article>';
  }

  // ---------- Vue : carnet ----------
  function rangee(t, k, e, sousTitre) {
    return '<button class="rangee m-' + t + '" data-ouvrir="' + t + '|' + k + '"><div class="mini">' + ILLUS[t] + '</div>' +
      '<div class="txt"><small>' + esc(sousTitre) + '</small><strong>' + esc(titreDe(t, e)) + '</strong></div></button>';
  }
  function vueCarnet() {
    var cles = Object.keys(D.jours).sort();
    var aujOuvert = D.jours[D.aujourdhui] && D.jours[D.aujourdhui].mot;
    if (!etat.choisi) etat.choisi = aujOuvert || cles.length < 2 ? D.aujourdhui : cles[cles.length - 2];
    if (!etat.mois) etat.mois = etat.choisi.slice(0, 7);
    var an = +etat.mois.slice(0, 4), mo = +etat.mois.slice(5, 7) - 1;
    var decalage = (new Date(an, mo, 1).getDay() + 6) % 7, nb = new Date(an, mo + 1, 0).getDate(), cases = '';
    for (var i = 0; i < decalage; i++) cases += '<span class="case"></span>';
    for (var d = 1; d <= nb; d++) {
      var k = an + '-' + pad(mo + 1) + '-' + pad(d), j = D.jours[k];
      if (!j || !(j.mot || j.date || j.artiste)) { cases += '<span class="case ' + (k > D.aujourdhui ? 'futur' : 'hors') + '">' + d + '</span>'; continue; }
      cases += '<button class="case jour' + (k === etat.choisi ? ' choisi' : '') + (k === D.aujourdhui ? ' auj' : '') + '" data-jour="' + k +
        '" aria-label="' + esc(titreJour(k)) + '"><span class="num">' + d + '</span><span class="points">' +
        TYPES.map(function (t) { return '<b' + (j[t] ? ' class="p-' + t + '"' : '') + '></b>'; }).join('') + '</span></button>';
    }
    var min = D.debut.slice(0, 7), max = D.aujourdhui.slice(0, 7), jour = D.jours[etat.choisi] || {};
    var lignes = TYPES.filter(function (t) { return jour[t]; }).map(function (t) { return rangee(t, etat.choisi, jour[t], NOMS[t]); }).join('');
    return '<div class="page"><div class="marque"><span>Carnet</span></div>' +
      '<div class="mois" style="margin-top:14px">' +
        '<button class="fleche" data-mois="-1" aria-label="Mois précédent"' + (etat.mois <= min ? ' disabled' : '') + '>' + ICONES.gauche + '</button>' +
        '<h2>' + capitale(MOIS[mo]) + ' ' + an + '</h2>' +
        '<button class="fleche" data-mois="1" aria-label="Mois suivant"' + (etat.mois >= max ? ' disabled' : '') + '>' + ICONES.droite + '</button></div>' +
      '<div class="semaine">' + ['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(function (x) { return '<span>' + x + '</span>'; }).join('') + '</div>' +
      '<div class="grille">' + cases + '</div>' +
      '<p class="cles"><span><b class="p-mot"></b>Mot</span><span><b class="p-date"></b>Date</span><span><b class="p-artiste"></b>Artiste</span></p>' +
      '<h2 class="titre-section">' + capitale(titreJour(etat.choisi)) + '</h2>' +
      (lignes || '<p class="vide-texte">Rien n’a encore été révélé ce jour-là.</p>') +
      (cles.length <= 1 ? '<p class="vide-texte">Votre carnet se remplit jour après jour. Dès demain, vous y retrouverez ce que vous avez appris aujourd’hui.</p>' : '') +
      '</div>';
  }

  // ---------- Vue : favoris ----------
  function vueFavoris() {
    var html = favoris.slice().reverse().map(function (f) { return rangee(f.type, f.jour, f.entree, COURTS[f.type] + ', ' + titreJour(f.jour)); }).join('');
    return '<div class="page"><div class="marque"><span>Favoris</span></div>' +
      '<h1 class="grand-titre">Ce que vous gardez</h1>' +
      (html || '<p class="vide-texte">Touchez « Garder » sur une fiche pour la retrouver ici, même quand le carnet aura tourné la page.</p>') + '</div>';
  }

  // ---------- Vue : progrès ----------
  function arc(cx, cy, r, a1, a2) {
    var p1 = [cx + r * Math.cos(a1), cy + r * Math.sin(a1)], p2 = [cx + r * Math.cos(a2), cy + r * Math.sin(a2)];
    return 'M' + p1[0].toFixed(1) + ' ' + p1[1].toFixed(1) + ' A' + r + ' ' + r + ' 0 0 1 ' + p2[0].toFixed(1) + ' ' + p2[1].toFixed(1);
  }
  function vueProgres() {
    var s = serie(), teintes = ['--rose', '--jaune', '--pervenche', '--sauge', '--ciel', '--peche', '--rose'];
    var auj = dateDe(D.aujourdhui), jours7 = [];
    for (var i = 6; i >= 0; i--) { var d = new Date(auj); d.setDate(d.getDate() - i); jours7.push(d); }
    var pas = Math.PI * 2 / 7, ecart = 0.2, arcs = '';
    jours7.forEach(function (d, i) {
      var j = D.jours[cleDe(d)], lu = j && j.lu;
      var a1 = -Math.PI / 2 + i * pas + ecart / 2, a2 = a1 + pas - ecart;
      arcs += '<path d="' + arc(125, 125, 104, a1, a2) + '" fill="none" stroke-width="22" stroke-linecap="round" style="stroke: var(' + (lu ? teintes[i] : '--vide') + ')"/>';
    });
    var cles = Object.keys(D.jours), compte = { mot: 0, date: 0, artiste: 0 }, lus = 0;
    cles.forEach(function (k) { TYPES.forEach(function (t) { if (D.jours[k][t]) compte[t]++; }); if (D.jours[k].lu) lus++; });
    return '<div class="page"><div class="marque"><span>Progrès</span></div>' +
      '<div class="anneau"><svg viewBox="0 0 250 250">' + arcs + '</svg><div class="centre"><strong>' + s + '</strong><span>' +
        (s > 1 ? 'jours de lecture d’affilée' : 'jour de lecture') + '</span></div></div>' +
      '<div class="semaine-lue">' + jours7.map(function (d) { return '<span>' + INITIALES[d.getDay()] + '</span>'; }).join('') + '</div>' +
      '<div class="stats">' +
        '<div class="stat m-mot"><strong>' + compte.mot + '</strong><span>mots découverts</span></div>' +
        '<div class="stat m-date"><strong>' + compte.date + '</strong><span>dates découvertes</span></div>' +
        '<div class="stat m-artiste"><strong>' + compte.artiste + '</strong><span>artistes découverts</span></div>' +
        '<div class="stat s-sauge"><strong>' + favoris.length + '</strong><span>favoris</span></div></div>' +
      '<p class="explication">Une journée compte dans la série quand vous ouvrez la fiche. Les sept arcs représentent les sept derniers jours, du plus ancien au plus récent. ' +
        lus + ' jour' + (lus > 1 ? 's' : '') + ' de lecture depuis le ' + titreJour(D.debut) + '.</p></div>';
  }

  // ---------- Rendu ----------
  function vueOnglet() { return etat.onglet === 'carnet' ? vueCarnet() : etat.onglet === 'favoris' ? vueFavoris() : etat.onglet === 'progres' ? vueProgres() : vueJour(); }
  function barre() {
    var onglets = [['jour', 'Aujourd’hui'], ['carnet', 'Carnet'], ['favoris', 'Favoris'], ['progres', 'Progrès']];
    return '<nav class="barre" aria-label="Navigation">' + onglets.map(function (o) {
      return '<button data-onglet="' + o[0] + '"' + (etat.onglet === o[0] && !etat.fiche ? ' aria-current="page"' : '') + '>' + ICONES[o[0]] + '<span>' + o[1] + '</span></button>';
    }).join('') + '</nav>';
  }
  function rendre() {
    document.getElementById('app').innerHTML = (etat.fiche ? vueFiche() : vueOnglet()) + barre();
    if (etat.fiche) demander(etat.fiche.type, etat.fiche.cle);
  }

  // ---------- Wikipédia (via Scriptable) ----------
  function demander(t, k) {
    var cle = t + '|' + k;
    if (t === 'mot') return;
    if (demandes[cle]) { remplir(); return; }
    var e = entreeDe(t, k);
    if (!e) return;
    demandes[cle] = true;
    setTimeout(function () { if (!wiki[cle]) { wiki[cle] = { vide: true }; remplir(); } }, 15000);
    pont('wiki', { cle: cle, items: [{ id: t, q: t === 'date' ? (e.wikipedia || e.evenement) : (e.wikipedia || e.nom), galerie: t === 'artiste' }] });
  }
  window.recevoirWiki = function (r) {
    var res = r.resultats || {};
    wiki[r.cle] = res[r.cle.split('|')[0]] || { vide: true };
    remplir();
  };
  function remplir() {
    var zones = document.querySelectorAll('[data-wiki]');
    for (var i = 0; i < zones.length; i++) {
      var z = zones[i], w = wiki[z.getAttribute('data-wiki')];
      if (!w) continue;
      var partie = z.getAttribute('data-part');
      if (partie === 'image') {
        z.innerHTML = w.image ? '<img src="' + esc(w.image) + '" alt=""><p class="legende-img">Image : Wikipédia</p>' : '';
      } else if (partie === 'galerie') {
        z.innerHTML = w.galerie && w.galerie.length ? w.galerie.map(function (g) {
          return '<figure><img src="' + esc(g.src) + '" alt="' + esc(g.legende) + '" loading="lazy">' + (g.legende ? '<figcaption>' + esc(g.legende) + '</figcaption>' : '') + '</figure>';
        }).join('') : '';
      } else {
        z.innerHTML = w.extrait
          ? '<p>' + esc(w.extrait) + '</p><p class="source">Source : Wikipédia, article « ' + esc(w.titre) + ' »</p>'
          : '<p class="attente">Le résumé n’est pas disponible pour le moment. Vérifiez la connexion, puis rouvrez la fiche.</p>';
      }
    }
  }

  // ---------- Partage et favoris ----------
  function texteAPartager(t, e) {
    var signature = '\n\nAppris avec Trois fois par jour : ' + D.depot;
    if (t === 'mot') return e.mot + ' (' + (CATEGORIES[e.categorie] || e.categorie || '') + ') : ' + e.definition + (e.exemple ? '\n« ' + e.exemple + ' »' : '') + signature;
    if (t === 'date') return e.annee + ', ' + e.evenement + '. ' + e.contexte + signature;
    return e.nom + ' (' + [e.discipline, e.epoque].filter(Boolean).join(', ') + '). ' + e.presentation + (e.oeuvre ? '\nÀ découvrir : ' + e.oeuvre : '') + signature;
  }
  function basculerFavori() {
    var f = etat.fiche, e = entreeDe(f.type, f.cle), id = identite(f.type, e), actif = !estFavori(f.type, e);
    favoris = favoris.filter(function (x) { return !(x.type === f.type && x.id === id); });
    if (actif) favoris.push({ type: f.type, id: id, jour: f.cle, entree: e });
    pont('favoris', { liste: favoris });
    var y = window.scrollY; rendre(); window.scrollTo(0, y);
  }

  // ---------- Interactions ----------
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-onglet],[data-ouvrir],[data-fermer],[data-jour],[data-mois],[data-favori],[data-partager]');
    if (!b) return;
    if (b.hasAttribute('data-onglet')) {
      etat.onglet = b.getAttribute('data-onglet'); etat.fiche = null; rendre(); window.scrollTo(0, 0);
    } else if (b.hasAttribute('data-ouvrir')) {
      var p = b.getAttribute('data-ouvrir').split('|');
      etat.fiche = { type: p[0], cle: p[1] }; rendre(); window.scrollTo(0, 0);
    } else if (b.hasAttribute('data-fermer')) {
      etat.fiche = null; rendre(); window.scrollTo(0, 0);
    } else if (b.hasAttribute('data-jour')) {
      etat.choisi = b.getAttribute('data-jour'); rendre();
    } else if (b.hasAttribute('data-mois')) {
      var a = +etat.mois.slice(0, 4), m = +etat.mois.slice(5, 7) - 1 + (+b.getAttribute('data-mois'));
      etat.mois = cleDe(new Date(a, m, 1)).slice(0, 7); rendre();
    } else if (b.hasAttribute('data-favori')) {
      basculerFavori();
    } else if (b.hasAttribute('data-partager')) {
      var f = etat.fiche; pont('partager', { texte: texteAPartager(f.type, entreeDe(f.type, f.cle)) });
    }
  });

  // Un tap sur le widget ouvre directement la fiche qui vient d'être révélée
  if (D.actuel) etat.fiche = { type: D.actuel, cle: D.aujourdhui };
  rendre();
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
    favoris: lireFavoris(),
    depot: DEPOT,
  }

  const vue = new WebView()

  // La page demande à Scriptable ce qu'elle ne peut pas faire seule :
  // charger Wikipédia, enregistrer les favoris, ouvrir le partage.
  async function pont(url) {
    try {
      const action = url.slice("tfpj://".length, url.indexOf("?"))
      const demande = JSON.parse(decodeURIComponent(url.slice(url.indexOf("?") + 1)))
      if (action === "wiki") {
        const resultats = {}
        await Promise.all(demande.items.map(async it => { resultats[it.id] = await wikipedia(it.q, it.galerie) }))
        await vue.evaluateJavaScript(`window.recevoirWiki(${JSON.stringify({ cle: demande.cle, resultats })})`, false)
      } else if (action === "favoris") {
        ecrireFavoris(demande.liste || [])
      } else if (action === "partager") {
        await ShareSheet.present([demande.texte])
      }
    } catch (e) {
      console.log(`Action interrompue : ${e}`)
    }
  }

  // Les liens s'ouvrent dans Safari ; le reste passe par le pont
  vue.shouldAllowRequest = requete => {
    const url = requete.url || ""
    if (url.startsWith("tfpj://")) { pont(url); return false }
    if (url.startsWith("http")) { Safari.open(url); return false }
    return true
  }

  await vue.loadHTML(pageHTML(donnees))
  await vue.present(true)
}

Script.complete()
