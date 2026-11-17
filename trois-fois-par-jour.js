// ============================================================
// Trois fois par jour · version 5
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

const DEPOT = "https://github.com/clara-bismuth/trois-fois-par-jour"

// Charte inspirée du Bauhaus : papier gris clair, une couleur primaire par moment.
// Sur l'écran verrouillé, iOS impose sa propre teinte.
const COULEURS = {
  encre: Color.dynamic(new Color("#1A1A1A"), new Color("#EDEDE8")),
  papier: Color.dynamic(new Color("#E9E9E5"), new Color("#161615")),
  doux: Color.dynamic(new Color("#55554F"), new Color("#A3A39B")),
  moment: {
    mot: new Color("#F7D117"),
    date: new Color("#D7261E"),
    artiste: new Color("#2F74C0"),
  },
}

// Futura, dessinée en 1927, est installée sur tous les iPhone.
const POLICE = "Futura-Medium"

// Jauge : un point par fiche lue, un point par bonne réponse au quiz de la semaine.
// Grades inspirés des ateliers du Bauhaus.
const NIVEAUX = [
  { nom: "Apprenti", seuil: 0 },
  { nom: "Compagnon", seuil: 50 },
  { nom: "Maître", seuil: 150 },
]

// Le quiz de la semaine ouvre le dimanche, avec le mot du matin.
const QUESTIONS_SEMAINE = 10
const QUESTIONS_REVISION = 5

const ENTETES_WIKI = {
  "Api-User-Agent": "TroisFoisParJour/5.0 (https://github.com/clara-bismuth/trois-fois-par-jour)",
}

const TYPES = ["mot", "date", "artiste"]


// ---------- CONTENU DE SECOURS ----------
// Affiché seulement si GitHub est inaccessible lors de la toute première utilisation.

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
function decaler(d, n) { const v = new Date(d); v.setDate(v.getDate() + n); return v }
function veille(d) { return decaler(d, -1) }
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
  const demain = decaler(maintenant, 1)
  demain.setHours(HORAIRES.mot[0], HORAIRES.mot[1], 0, 0)
  candidats.push(demain)
  return candidats.filter(d => d > maintenant).sort((a, b) => a - b)[0]
}

// Dimanche du quiz en cours : le dernier dimanche passé, à partir du mot du matin.
// Le quiz porte sur les six jours qui le précèdent et reste ouvert jusqu'au dimanche suivant.
function dimancheDuQuiz(maintenant) {
  const d = new Date(maintenant)
  d.setHours(0, 0, 0, 0)
  const ecart = d.getDay()
  let dimanche = decaler(d, -ecart)
  if (ecart === 0 && !revele("mot", maintenant)) dimanche = decaler(dimanche, -7)
  return dimanche
}


// ---------- CARNET, FAVORIS ET QUIZ (enregistrés sur le téléphone, jamais envoyés ailleurs) ----------

function lireHistorique() {
  try {
    if (fm.fileExists(CHEMIN_HISTORIQUE)) {
      const h = JSON.parse(fm.readString(CHEMIN_HISTORIQUE))
      h.jours = h.jours || {}
      h.quiz = h.quiz || {}
      return h
    }
  } catch (e) {
    console.log("Carnet illisible, il repart de zéro")
  }
  return { debut: null, jours: {}, quiz: {} }
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

function police(taille) { return new Font(POLICE, taille) }

// Écran verrouillé, format rectangulaire
function widgetRectangulaire(f) {
  const w = new ListWidget()
  w.setPadding(0, 0, 0, 0)
  const libelle = w.addText(f.libelle.toUpperCase())
  libelle.font = police(10)
  libelle.textOpacity = 0.75
  w.addSpacer(1)
  const titre = w.addText(f.titre)
  titre.font = police(20)
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
  t.font = police(12)
  t.centerAlignText()
  t.lineLimit = 2
  t.minimumScaleFactor = 0.5
  return w
}

// Écran d'accueil et StandBy : papier gris, un filet aux trois couleurs, le moment en cours en tête
function widgetCouleur(f, type, grand) {
  const w = new ListWidget()
  w.backgroundColor = COULEURS.papier
  w.setPadding(14, 16, 14, 16)

  const filet = w.addStack()
  filet.layoutHorizontally()
  filet.size = new Size(0, 5)
  for (const t of TYPES) {
    const s = filet.addStack()
    s.backgroundColor = COULEURS.moment[t]
    s.size = new Size(t === type ? 40 : 14, 5)
    filet.addSpacer(3)
  }

  w.addSpacer(10)
  const libelle = w.addText(f.libelle)
  libelle.font = police(12)
  libelle.textColor = COULEURS.doux
  w.addSpacer(2)
  const titre = w.addText(f.titre)
  titre.font = police(grand ? 30 : 25)
  titre.textColor = COULEURS.encre
  titre.lineLimit = 1
  titre.minimumScaleFactor = 0.5
  if (f.meta) {
    const meta = w.addText(f.meta)
    meta.font = Font.systemFont(12)
    meta.textColor = COULEURS.doux
    meta.lineLimit = 1
    meta.minimumScaleFactor = 0.7
  }
  w.addSpacer(6)
  const principal = w.addText(f.principal)
  principal.font = Font.systemFont(grand ? 14 : 13)
  principal.textColor = COULEURS.encre
  principal.lineLimit = grand ? 2 : 3
  principal.minimumScaleFactor = 0.8
  if (grand && f.detail) {
    w.addSpacer(4)
    const detail = w.addText(f.detail)
    detail.font = Font.italicSystemFont(13)
    detail.textColor = COULEURS.doux
    detail.lineLimit = 2
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
      url: (resume.content_urls && resume.content_urls.mobile && resume.content_urls.mobile.page) || `https://fr.wikipedia.org/wiki/${t}`,
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
  --papier: #E9E9E5; --encre: #1A1A1A; --doux: #55554F; --gris: #CFCFC9; --carte: #F5F5F2;
  --jaune: #F7D117; --rouge: #D7261E; --bleu: #2F74C0; --vert: #157A43; --noir: #1A1A1A; --blanc: #FFFFFF;
  --police: Futura, "Jost", "Avenir Next", -apple-system, sans-serif;
  --m: 10px; --e: 8px; --nav: 62px;
  --haut: env(safe-area-inset-top, 0px); --bas: env(safe-area-inset-bottom, 0px);
}
@media (prefers-color-scheme: dark) {
  :root { --papier: #161615; --encre: #EDEDE8; --doux: #A3A39B; --gris: #3A3A36; --carte: #222220; }
}
* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body { margin: 0; background: var(--papier); color: var(--encre); font: 17px/1.5 var(--police); -webkit-font-smoothing: antialiased; }
button { font: inherit; color: inherit; background: none; border: 0; padding: 0; cursor: pointer; text-align: inherit; }
a { color: inherit; }
:focus-visible { outline: 2px solid var(--bleu); outline-offset: 3px; }
svg { display: block; }
h1, h2, h3, p { margin: 0; }

/* Le cadre : la jauge en 21 segments */
.bord { position: fixed; display: flex; z-index: 5; }
.bord-haut { left: var(--m); right: var(--m); top: calc(var(--haut) + var(--m)); height: var(--e); }
.bord-bas { left: var(--m); right: var(--m); bottom: calc(var(--bas) + var(--nav) + var(--m)); height: var(--e); flex-direction: row-reverse; }
.bord-droite, .bord-gauche { width: var(--e); top: calc(var(--haut) + var(--m) + var(--e)); bottom: calc(var(--bas) + var(--nav) + var(--m) + var(--e)); }
.bord-droite { right: var(--m); flex-direction: column; }
.bord-gauche { left: var(--m); flex-direction: column-reverse; }
.seg { flex: 1; background: var(--gris); }
.s-mot { background: var(--jaune); } .s-date { background: var(--rouge); } .s-artiste { background: var(--bleu); } .s-quiz { background: var(--vert); }
.lib { position: fixed; z-index: 5; font-size: 12px; font-weight: 500; white-space: nowrap; }
.lib-haut { top: calc(var(--haut) + var(--m) + var(--e) + 9px); left: calc(var(--m) + var(--e) + 22px); right: calc(var(--m) + var(--e) + 22px); display: flex; justify-content: space-between; }
.lib-bas { bottom: calc(var(--bas) + var(--nav) + var(--m) + var(--e) + 9px); left: calc(var(--m) + var(--e) + 22px); right: calc(var(--m) + var(--e) + 22px); overflow: hidden; text-overflow: ellipsis; }
.lib-droite { right: calc(var(--m) + var(--e) + 4px); top: calc(var(--haut) + var(--m) + var(--e) + 44px); writing-mode: vertical-rl; }
.lib-gauche { left: calc(var(--m) + var(--e) + 4px); bottom: calc(var(--bas) + var(--nav) + var(--m) + var(--e) + 44px); writing-mode: vertical-rl; transform: rotate(180deg); }
.zone { position: fixed; z-index: 1; overflow-y: auto; -webkit-overflow-scrolling: touch;
  top: calc(var(--haut) + var(--m) + var(--e) + 34px); bottom: calc(var(--bas) + var(--nav) + var(--m) + var(--e) + 32px);
  left: calc(var(--m) + var(--e) + 22px); right: calc(var(--m) + var(--e) + 22px); padding: 6px 0 20px; scrollbar-width: none; }
.zone::-webkit-scrollbar { display: none; }

/* Menu */
.nav { position: fixed; left: 0; right: 0; bottom: 0; z-index: 6; height: calc(var(--nav) + var(--bas)); padding: 0 var(--m) var(--bas);
  display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); background: var(--papier); }
.nav button { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 7px; font-size: 13px; font-weight: 500; color: var(--doux); }
.nav i { width: 24px; height: 5px; }
.nav [aria-current] { color: var(--encre); }
.nav [aria-current] i { background: var(--c); }

/* Aujourd'hui */
.titre-page { font-size: 46px; line-height: 1; font-weight: 500; letter-spacing: -0.02em; }
.sous-titre { font-size: 19px; font-weight: 500; margin: 6px 0 20px; }
.lignes { border-bottom: 1.5px solid var(--encre); }
.ligne { display: grid; grid-template-columns: 24px minmax(0, 1fr) 22px; gap: 10px; width: 100%; padding: 16px 0; border-top: 1.5px solid var(--encre); align-items: start; text-decoration: none; }
.marque { display: block; width: 14px; height: 14px; margin-top: 3px; }
.m-mot { background: var(--jaune); } .m-date { background: var(--rouge); } .m-artiste { background: var(--bleu); } .m-quiz { background: var(--vert); }
.contour { background: transparent; box-shadow: inset 0 0 0 2px var(--c); }
.ligne small { display: block; font-size: 12px; font-weight: 500; }
.ligne strong { display: block; font-size: 28px; line-height: 1.12; font-weight: 500; margin-top: 3px; overflow-wrap: break-word; }
.ligne .resume { display: block; font-size: 14px; line-height: 1.4; margin-top: 4px; color: var(--doux); }
.ligne .fin { align-self: center; display: flex; flex-direction: column; align-items: center; gap: 4px; }
.fermee strong { color: var(--doux); }
.encart { display: block; width: 100%; margin-top: 22px; padding: 16px; text-decoration: none; }
.encart-vert { background: var(--vert); color: var(--blanc); }
.encart-bord { border: 1.5px solid var(--encre); }
.encart small { display: block; font-size: 12px; font-weight: 500; }
.encart strong { display: block; font-size: 22px; line-height: 1.2; font-weight: 500; margin: 4px 0 6px; }
.encart span { font-size: 14px; line-height: 1.45; }
.note { font-size: 14px; color: var(--doux); margin-top: 18px; }

/* Boutons */
.btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 46px; padding: 0 18px; font-size: 15px; font-weight: 500; border: 2px solid var(--encre); }
.btn-plein { background: var(--encre); color: var(--papier); }
.btn-vert { background: var(--vert); border-color: var(--vert); color: var(--blanc); }
.btn-large { width: 100%; }
.rangee-btn { display: flex; flex-direction: column; gap: 10px; margin-top: 18px; }

/* Carnet */
.bascule { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); border: 1.5px solid var(--encre); margin-bottom: 20px; }
.bascule button { min-height: 40px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 500; }
.bascule [aria-pressed="true"] { background: var(--encre); color: var(--papier); }
.mois { display: flex; justify-content: space-between; align-items: center; }
.mois h2 { font-size: 26px; font-weight: 500; }
.fleche { width: 44px; height: 44px; border: 1.5px solid var(--encre); display: flex; align-items: center; justify-content: center; }
.fleche:disabled { opacity: 0.25; cursor: default; }
.semaine, .grille { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); text-align: center; }
.semaine { font-size: 12px; font-weight: 500; color: var(--doux); margin: 18px 0 6px; }
.case { height: 50px; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 15px; min-width: 0; }
.hors, .futur { color: var(--doux); opacity: 0.45; }
.num { display: block; width: 32px; height: 32px; line-height: 32px; text-align: center; }
.auj .num { box-shadow: inset 0 0 0 1.5px var(--encre); }
.choisi .num { background: var(--encre); color: var(--papier); box-shadow: none; }
.pts { display: flex; gap: 2px; margin-top: 3px; height: 5px; }
.pts b { width: 5px; height: 5px; background: var(--gris); }
.pts .l-mot { background: var(--jaune); } .pts .l-date { background: var(--rouge); } .pts .l-artiste { background: var(--bleu); }
.cles { display: flex; flex-wrap: wrap; gap: 6px 14px; font-size: 12px; color: var(--doux); margin-top: 12px; }
.cles span { display: inline-flex; align-items: center; gap: 6px; }
.cles b { width: 8px; height: 8px; }
.titre-section { font-size: 24px; line-height: 1.15; font-weight: 500; margin: 28px 0 10px; }
.vide { color: var(--doux); font-size: 15px; margin-top: 14px; }

/* Quiz */
.q-tete { display: flex; justify-content: space-between; font-size: 12px; font-weight: 500; }
.q-barre { display: grid; gap: 3px; margin: 8px 0 18px; }
.q-barre i { height: 6px; background: var(--gris); }
.q-barre .ok { background: var(--vert); } .q-barre .ko { background: var(--encre); }
.q-type { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 500; }
.q-type .marque { margin-top: 0; }
.q-enonce { font-size: 24px; line-height: 1.2; font-weight: 500; margin: 10px 0 10px; }
.q-citation { font-size: 18px; line-height: 1.45; margin: 0 0 16px; padding: 12px 14px; background: var(--carte); }
.option { display: grid; grid-template-columns: 32px minmax(0, 1fr); gap: 12px; align-items: center; width: 100%; padding: 10px; margin-bottom: 8px; border: 1.5px solid var(--encre); font-size: 16px; line-height: 1.35; }
.option .lettre { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: var(--encre); color: var(--papier); font-weight: 500; }
.option.bonne { background: var(--vert); border-color: var(--vert); color: var(--blanc); }
.option.bonne .lettre { background: var(--blanc); color: var(--vert); }
.option.fausse { background: var(--encre); color: var(--papier); }
.option.fausse .lettre { background: var(--papier); color: var(--encre); }
.option.terne { opacity: 0.4; }
.verdict { margin: 8px 0 14px; padding: 14px; background: var(--carte); }
.verdict strong { display: block; font-size: 17px; font-weight: 500; margin-bottom: 4px; }
.verdict p { font-size: 15px; line-height: 1.5; }
.score { font-size: 88px; line-height: 1; font-weight: 500; letter-spacing: -0.03em; }
.score small { font-size: 36px; color: var(--doux); }
.historique { margin-top: 8px; border-bottom: 1.5px solid var(--encre); }
.historique div { display: flex; justify-content: space-between; padding: 12px 0; border-top: 1.5px solid var(--encre); font-size: 15px; }

/* Progrès */
.petit { font-size: 13px; font-weight: 500; color: var(--doux); }
.grade { font-size: 52px; line-height: 1; font-weight: 500; letter-spacing: -0.02em; margin-top: 4px; }
.jauge { display: grid; grid-template-columns: repeat(21, minmax(0, 1fr)); gap: 2px; margin: 16px 0 10px; }
.jauge i { height: 16px; background: var(--gris); }
.jauge .s-mot { background: var(--jaune); } .jauge .s-date { background: var(--rouge); } .jauge .s-artiste { background: var(--bleu); } .jauge .s-quiz { background: var(--vert); }
.stats { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; margin-top: 20px; }
.stat { padding: 14px; background: var(--carte); }
.stat strong { display: block; font-size: 34px; line-height: 1; font-weight: 500; }
.stat span { font-size: 13px; }
.stat i { display: block; width: 14px; height: 14px; margin-bottom: 10px; }
.sept { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 6px; margin-top: 10px; text-align: center; font-size: 12px; color: var(--doux); }
.sept .col { display: flex; flex-direction: column; align-items: center; gap: 3px; }
.sept b { width: 16px; height: 16px; background: var(--gris); }
.sept .l-mot { background: var(--jaune); } .sept .l-date { background: var(--rouge); } .sept .l-artiste { background: var(--bleu); }
.bareme { margin-top: 8px; border-bottom: 1.5px solid var(--encre); }
.bareme div { display: flex; justify-content: space-between; gap: 12px; padding: 11px 0; border-top: 1.5px solid var(--encre); font-size: 15px; }

/* Fiche : la diagonale */
.fiche { min-height: 100vh; background: var(--papier); }
.f-mot { --h: var(--jaune); --ht: var(--noir); --tri: var(--bleu); --tagc: var(--bleu); --tagt: var(--blanc); --jouer: var(--bleu); }
.f-date { --h: var(--rouge); --ht: var(--blanc); --tri: var(--jaune); --tagc: var(--jaune); --tagt: var(--noir); --jouer: var(--bleu); }
.f-artiste { --h: var(--bleu); --ht: var(--blanc); --tri: var(--jaune); --tagc: var(--jaune); --tagt: var(--noir); --jouer: var(--rouge); }
.hero { position: relative; height: calc(300px + var(--haut)); overflow: hidden; background: var(--h); color: var(--ht); clip-path: polygon(0 0, 100% 0, 100% 80%, 0 100%); }
.hero-tri { position: absolute; right: 0; top: 0; width: 92px; height: 110px; background: var(--tri); clip-path: polygon(0 0, 100% 0, 100% 100%); }
.hero-haut { position: absolute; left: 20px; right: 100px; top: calc(18px + var(--haut)); display: flex; align-items: center; gap: 14px; font-size: 14px; font-weight: 500; }
.retour { width: 44px; height: 44px; flex: none; border: 2px solid currentColor; display: flex; align-items: center; justify-content: center; }
.hero-vers { position: absolute; left: 24px; top: calc(102px + var(--haut)); font-size: 18px; font-weight: 500; }
.hero-titre { position: absolute; left: 18px; right: 18px; top: calc(114px + var(--haut)); line-height: 1; font-weight: 500; letter-spacing: -0.03em; overflow-wrap: break-word; }
.bas-casse { text-transform: lowercase; }
.corps { padding: 4px 22px 0; display: flex; flex-direction: column; gap: 20px; }
.corps h1 { font-size: 34px; line-height: 1.12; font-weight: 500; letter-spacing: -0.01em; text-transform: lowercase; }
.tag { align-self: flex-start; padding: 4px 12px; font-size: 14px; font-weight: 500; transform: rotate(-3deg); background: var(--tagc); color: var(--tagt); }
.actions { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.action { height: 48px; display: flex; align-items: center; justify-content: center; gap: 8px; border: 2px solid var(--encre); font-size: 15px; font-weight: 500; }
.action-plein { background: var(--encre); color: var(--papier); }
.lead { font-size: 21px; line-height: 1.4; font-weight: 500; }
.texte { font-size: 17px; line-height: 1.6; }
.citation { font-size: 18px; line-height: 1.5; font-style: italic; padding: 14px 16px; background: var(--carte); }
.section { display: flex; align-items: center; gap: 12px; font-size: 20px; font-weight: 500; margin-bottom: -6px; }
.section i { width: 28px; height: 8px; background: var(--encre); transform: rotate(-35deg); flex: none; }
.mots { display: flex; flex-wrap: wrap; gap: 8px; }
.mots span { border: 1.5px solid var(--encre); padding: 5px 12px; font-size: 15px; }
.ecoute { display: grid; grid-template-columns: 56px minmax(0, 1fr); gap: 14px; align-items: center; padding: 14px; border: 2px solid var(--encre); background: var(--carte); text-decoration: none; }
.jouer { width: 56px; height: 56px; background: var(--jouer); display: flex; align-items: center; justify-content: center; }
.ecoute small, .lire small { display: block; font-size: 12px; font-weight: 500; }
.ecoute strong { display: block; font-size: 16px; line-height: 1.3; font-weight: 500; margin-top: 3px; }
.lire { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 14px 0; border-top: 2px solid var(--encre); border-bottom: 2px solid var(--encre); text-decoration: none; }
.lire strong { display: block; font-size: 17px; font-weight: 500; margin-top: 2px; }
.lire + .lire { border-top: 0; }
.visuel img { display: block; width: 100%; max-height: 360px; object-fit: cover; }
.legende-img { font-size: 12px; color: var(--doux); margin-top: 6px; }
.visuel:empty, .galerie:empty, .zone-lire:empty { display: none; }
.galerie { display: flex; gap: 10px; overflow-x: auto; margin: 0 -22px; padding: 0 22px 4px; scroll-snap-type: x mandatory; scrollbar-width: none; }
.galerie::-webkit-scrollbar { display: none; }
.galerie figure { margin: 0; flex: 0 0 78%; scroll-snap-align: start; }
.galerie img { display: block; width: 100%; height: 240px; object-fit: cover; background: var(--gris); }
.galerie figcaption { font-size: 12px; color: var(--doux); margin-top: 6px; }
.volets { border-bottom: 2px solid var(--encre); }
details { border-top: 2px solid var(--encre); }
summary { list-style: none; display: flex; justify-content: space-between; align-items: center; padding: 15px 0; font-size: 18px; font-weight: 500; cursor: pointer; }
summary::-webkit-details-marker { display: none; }
summary i { position: relative; width: 14px; height: 14px; flex: none; }
summary i::before, summary i::after { content: ""; position: absolute; left: 0; top: 6px; width: 14px; height: 2px; background: currentColor; transition: transform 0.25s ease; }
summary i::after { transform: rotate(90deg); }
details[open] summary i::after { transform: rotate(0deg); }
.volet { padding: 0 0 18px; }
.volet p { margin: 0 0 10px; font-size: 16px; line-height: 1.6; }
.volet ul { margin: 0; padding-left: 18px; }
.volet li { margin: 0 0 8px; }
.source { font-size: 12px; color: var(--doux); }
.attente { color: var(--doux); font-style: italic; }
.bandeau { margin-top: 30px; padding: 18px 22px calc(18px + var(--bas)); background: var(--encre); color: var(--papier); display: flex; justify-content: space-between; align-items: center; gap: 12px; font-size: 15px; font-weight: 500; }
.plus { display: inline-block; margin-left: 6px; padding: 2px 8px; background: var(--jaune); color: var(--noir); transform: rotate(-4deg); }

@media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
`


// ---------- PAGE DE L'APP : COMPORTEMENT ----------

const SCRIPT_PAGE = String.raw`
(function () {
  var D = JSON.parse(document.getElementById('donnees').textContent);
  var NB = String.fromCharCode(160);
  var TYPES = ['mot', 'date', 'artiste'];
  var NOMS = { mot: 'Le mot du matin', date: 'La date de midi', artiste: 'L’artiste du soir' };
  var NOMS_FICHE = { mot: 'mot du matin', date: 'date de midi', artiste: 'artiste du soir' };
  var COURTS = { mot: 'Mot', date: 'Date', artiste: 'Artiste' };
  var ANNONCES = { mot: 'Un mot à apprivoiser', date: 'Une date à retenir', artiste: 'Une œuvre à découvrir' };
  var CATEGORIES = { 'n. f.': 'nom féminin', 'n. m.': 'nom masculin', 'n. f. pl.': 'nom féminin pluriel',
    'n. m. pl.': 'nom masculin pluriel', 'adj.': 'adjectif', 'adv.': 'adverbe', 'v.': 'verbe', 'v. pron.': 'verbe pronominal' };
  var MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  var SEMAINE = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  var INITIALES = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
  var SEGMENTS = 21;
  var CYCLE = ['mot', 'date', 'artiste', 'quiz', 'mot', 'artiste', 'date'];
  var COULEUR_ONGLET = { jour: 'var(--jaune)', carnet: 'var(--rouge)', quiz: 'var(--vert)', progres: 'var(--bleu)' };
  var etat = { onglet: 'jour', fiche: null, mois: null, choisi: null, vueCarnet: 'calendrier', quiz: null };
  var wiki = {}, demandes = {};
  var favoris = D.favoris || [];
  var quizFaits = D.quiz || {};

  // ---------- Outils ----------
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function capitale(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function dateDe(k) { var p = k.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function cleDe(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function jourMois(k) { var d = dateDe(k); return d.getDate() + (d.getDate() === 1 ? 'er' : '') + ' ' + MOIS[d.getMonth()]; }
  function titreJour(k) { return SEMAINE[dateDe(k).getDay()] + ' ' + jourMois(k); }
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
  function resumeDe(t, e) { return t === 'mot' ? e.definition : t === 'date' ? e.evenement : [e.discipline, e.pays, e.epoque].filter(Boolean).join(', '); }
  function lien(url, contenu, classe) { return '<a class="' + classe + '" href="' + esc(url) + '">' + contenu + '</a>'; }
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
  function estLu(t, k) { var j = D.jours[k]; return !!(j && j.lus && j.lus[t]); }

  // ---------- Icônes ----------
  var I = {
    retour: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2"></path></svg>',
    chevron: '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M5 2l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8"></path></svg>',
    cadenas: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><rect x="5" y="11" width="14" height="10" fill="none" stroke="currentColor" stroke-width="1.8"></rect><path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="1.8"></path></svg>',
    coche: '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M2 8.5l4 4 8-9" fill="none" stroke="currentColor" stroke-width="2"></path></svg>',
    garder: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M6 3h12v18l-6-5-6 5z" fill="none" stroke="currentColor" stroke-width="1.8"></path></svg>',
    garde: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M6 3h12v18l-6-5-6 5z" fill="currentColor" stroke="currentColor" stroke-width="1.8"></path></svg>',
    partager: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 3v12M7 8l5-5 5 5M5 13v8h14v-8" fill="none" stroke="currentColor" stroke-width="1.8"></path></svg>',
    jouer: '<svg viewBox="0 0 22 22" width="22" height="22" aria-hidden="true"><polygon points="5,2 20,11 5,20" fill="#FFFFFF"></polygon></svg>',
    sortie: '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M4 12L12 4M6 4h6v6" fill="none" stroke="currentColor" stroke-width="1.8"></path></svg>',
    gauche: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="1.8"></path></svg>',
    droite: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="1.8"></path></svg>'
  };

  // ---------- Jauge ----------
  function fichesLues() {
    var n = { mot: 0, date: 0, artiste: 0, total: 0 };
    Object.keys(D.jours).forEach(function (k) {
      var l = D.jours[k].lus;
      if (l) TYPES.forEach(function (t) { if (l[t]) { n[t]++; n.total++; } });
    });
    return n;
  }
  function pointsQuiz() { var n = 0; Object.keys(quizFaits).forEach(function (k) { n += quizFaits[k].score || 0; }); return n; }
  function niveau() {
    var p = fichesLues().total + pointsQuiz(), N = D.niveaux, i = 0;
    while (i + 1 < N.length && p >= N[i + 1].seuil) i++;
    var suivant = N[i + 1];
    var part = suivant ? (p - N[i].seuil) / (suivant.seuil - N[i].seuil) : 1;
    return { nom: N[i].nom, points: p, suivant: suivant, manque: suivant ? suivant.seuil - p : 0, part: Math.max(0, Math.min(1, part)) };
  }
  function actif(k) { var j = D.jours[k]; return !!(j && (j.lu || (j.lus && (j.lus.mot || j.lus.date || j.lus.artiste)))); }
  function serie() {
    var d = dateDe(D.aujourdhui);
    if (!actif(D.aujourdhui)) d.setDate(d.getDate() - 1);
    var n = 0;
    while (actif(cleDe(d))) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  function segments(rempli) {
    var out = [];
    for (var i = 0; i < SEGMENTS; i++) out.push(i < rempli ? 's-' + CYCLE[i % CYCLE.length] : '');
    return out;
  }
  function cadre(n) {
    var s = segments(Math.round(n.part * SEGMENTS)), idx = 0, html = '';
    [['haut', 5], ['droite', 6], ['bas', 5], ['gauche', 5]].forEach(function (c) {
      var h = '';
      for (var k = 0; k < c[1]; k++) h += '<i class="seg ' + s[idx++] + '"></i>';
      html += '<div class="bord bord-' + c[0] + '" aria-hidden="true">' + h + '</div>';
    });
    return html;
  }
  function libelleNiveau(n) {
    return n.suivant ? n.nom + ' · ' + n.points + ' / ' + n.suivant.seuil : n.nom + ' · ' + n.points + ' points';
  }

  // ---------- Quiz ----------
  function alea(graine) {
    var h = 2166136261;
    for (var i = 0; i < graine.length; i++) { h ^= graine.charCodeAt(i); h = Math.imul(h, 16777619); }
    return function () {
      h += 0x6D2B79F5;
      var t = h;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function melanger(arr, r) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)); var x = a[i]; a[i] = a[j]; a[j] = x; }
    return a;
  }
  // Trois propositions : la bonne et deux autres tirées des fichiers, toutes différentes
  function propositions(bonne, autres, r) {
    var vues = {}, opts = [{ texte: bonne, bon: true }];
    vues[bonne] = true;
    for (var i = 0; i < autres.length && opts.length < 3; i++) {
      if (autres[i] && !vues[autres[i]]) { vues[autres[i]] = true; opts.push({ texte: autres[i], bon: false }); }
    }
    return melanger(opts, r);
  }
  function question(item, r, variante) {
    var t = item.type, e = item.entree;
    var autres = melanger((D.listes[t] || []).filter(function (x) { return identite(t, x) !== identite(t, e); }), r);
    var q = { type: t, jour: item.jour, entree: e };
    if (t === 'mot' && variante) {
      q.enonce = 'Quel mot signifie :';
      q.citation = e.definition;
      q.options = propositions(e.mot, autres.map(function (x) { return x.mot; }), r);
      q.explication = e.exemple ? '« ' + e.exemple + ' »' : '';
    } else if (t === 'mot') {
      q.enonce = 'Que signifie « ' + e.mot + ' » ?';
      q.options = propositions(e.definition, autres.map(function (x) { return x.definition; }), r);
      q.explication = e.exemple ? '« ' + e.exemple + ' »' : '';
    } else if (t === 'date') {
      q.enonce = 'En quelle année ?';
      q.citation = e.evenement;
      q.options = propositions(e.annee, autres.map(function (x) { return x.annee; }), r);
      q.explication = e.contexte || '';
    } else if (e.oeuvre && !variante) {
      q.enonce = 'Qui a créé cette œuvre ?';
      q.citation = e.oeuvre;
      q.options = propositions(e.nom, autres.map(function (x) { return x.nom; }), r);
      q.explication = e.nom + '. ' + (e.presentation || '');
    } else {
      q.enonce = 'De qui parle-t-on ?';
      q.citation = e.presentation;
      q.options = propositions(e.nom, autres.map(function (x) { return x.nom; }), r);
      q.explication = [e.discipline, e.pays, e.epoque].filter(Boolean).join(', ');
    }
    return q;
  }
  function entreesCarnet() {
    var items = [];
    Object.keys(D.jours).sort().reverse().slice(0, 21).forEach(function (k) {
      TYPES.forEach(function (t) { if (D.jours[k][t]) items.push({ type: t, jour: k, entree: D.jours[k][t] }); });
    });
    return items;
  }
  function lancerQuiz(mode) {
    var semaine = mode === 'semaine';
    var items = semaine ? D.quizSemaine.entrees : entreesCarnet();
    var r = alea(semaine ? 'semaine-' + D.quizSemaine.cle : 'revision-' + Date.now());
    var total = Math.min(semaine ? D.questionsSemaine : D.questionsRevision, items.length);
    var choisis = melanger(items, r).slice(0, total);
    etat.quiz = {
      mode: mode,
      compte: semaine && !quizFaits[D.quizSemaine.cle],
      questions: choisis.map(function (it, i) { return question(it, r, i % 2 === 1); }),
      i: 0, reponses: [], fini: false
    };
    etat.onglet = 'quiz';
    etat.fiche = null;
  }
  function repondre(n) {
    var q = etat.quiz, cour = q.questions[q.i];
    if (q.reponses[q.i] != null) return;
    q.reponses[q.i] = n;
    cour.juste = !!cour.options[n].bon;
  }
  function suivante() {
    var q = etat.quiz;
    if (q.i + 1 < q.questions.length) { q.i++; return; }
    q.fini = true;
    q.score = q.questions.filter(function (x) { return x.juste; }).length;
    if (q.compte) {
      quizFaits[D.quizSemaine.cle] = { score: q.score, total: q.questions.length };
      pont('quiz', { cle: D.quizSemaine.cle, score: q.score, total: q.questions.length });
    }
  }
  function etatQuizSemaine() {
    var fait = quizFaits[D.quizSemaine.cle];
    return { fait: fait, debut: D.quizSemaine.entrees.length ? D.quizSemaine.entrees[0].jour : D.quizSemaine.cle };
  }

  // ---------- Écran Aujourd'hui ----------
  function ligne(t, k, e) {
    if (!e) {
      var r = reste(t);
      return '<div class="ligne fermee" style="--c: var(--' + { mot: 'jaune', date: 'rouge', artiste: 'bleu' }[t] + ')">' +
        '<i class="marque contour"></i><span><small>' + heure(t) + ' · ' + COURTS[t] + '</small><strong>' + ANNONCES[t] + '</strong>' +
        '<span class="resume">Rendez-vous à ' + heure(t) + (r ? ', ' + r : '') + '</span></span><span class="fin">' + I.cadenas + '</span></div>';
    }
    return '<button class="ligne" data-ouvrir="' + t + '|' + k + '"><i class="marque m-' + t + '"></i>' +
      '<span><small>' + heure(t) + ' · ' + COURTS[t] + '</small><strong>' + esc(titreDe(t, e)) + '</strong>' +
      '<span class="resume">' + esc(resumeDe(t, e)) + '</span></span>' +
      '<span class="fin">' + (estLu(t, k) ? I.coche : I.chevron) + '</span></button>';
  }
  function encartQuiz() {
    var s = etatQuizSemaine();
    if (!D.quizSemaine.entrees.length) return '';
    if (s.fait) {
      return '<button class="encart encart-bord" data-onglet="quiz"><small>Quiz de la semaine</small><strong>' + s.fait.score + ' / ' + s.fait.total + '</strong>' +
        '<span>Prochain quiz ' + titreJour(D.quizSemaine.prochain) + ', à ' + heure('mot') + '.</span></button>';
    }
    return '<button class="encart encart-vert" data-quiz="semaine"><small>Quiz de la semaine</small><strong>' + D.questionsSemaine + ' questions vous attendent</strong>' +
      '<span>Sur ce que vous avez découvert du ' + jourMois(s.debut) + ' au ' + jourMois(D.quizSemaine.entrees[D.quizSemaine.entrees.length - 1].jour) + '. Une bonne réponse, un point.</span></button>';
  }
  function vueJour() {
    var j = D.jours[D.aujourdhui] || {};
    var d = dateDe(D.aujourdhui);
    return '<h1 class="titre-page">' + capitale(SEMAINE[d.getDay()]) + '</h1><p class="sous-titre">' + jourMois(D.aujourdhui) + '</p>' +
      '<div class="lignes">' + TYPES.map(function (t) { return ligne(t, D.aujourdhui, j[t]); }).join('') + '</div>' +
      (!j.mot ? '<p class="note">La journée commence à ' + heure('mot') + '. Celle d’hier vous attend dans le carnet.</p>' : '') +
      encartQuiz();
  }

  // ---------- Écran Carnet ----------
  function rangee(t, k, e, sur) {
    return '<button class="ligne" data-ouvrir="' + t + '|' + k + '"><i class="marque m-' + t + '"></i>' +
      '<span><small>' + esc(sur) + '</small><strong>' + esc(titreDe(t, e)) + '</strong><span class="resume">' + esc(resumeDe(t, e)) + '</span></span>' +
      '<span class="fin">' + I.chevron + '</span></button>';
  }
  function vueCarnet() {
    var bascule = '<div class="bascule"><button data-carnet="calendrier" aria-pressed="' + (etat.vueCarnet === 'calendrier') + '">Calendrier</button>' +
      '<button data-carnet="gardes" aria-pressed="' + (etat.vueCarnet === 'gardes') + '">Gardés (' + favoris.length + ')</button></div>';
    if (etat.vueCarnet === 'gardes') {
      var html = favoris.slice().reverse().map(function (f) { return rangee(f.type, f.jour, f.entree, COURTS[f.type] + ', ' + titreJour(f.jour)); }).join('');
      return bascule + (html ? '<div class="lignes">' + html + '</div>' : '<p class="vide">Touchez « garder » sur une fiche pour la retrouver ici.</p>');
    }
    var cles = Object.keys(D.jours).sort();
    if (!etat.choisi) etat.choisi = (D.jours[D.aujourdhui] && D.jours[D.aujourdhui].mot) || cles.length < 2 ? D.aujourdhui : cles[cles.length - 2];
    if (!etat.mois) etat.mois = etat.choisi.slice(0, 7);
    var an = +etat.mois.slice(0, 4), mo = +etat.mois.slice(5, 7) - 1;
    var decalage = (new Date(an, mo, 1).getDay() + 6) % 7, nb = new Date(an, mo + 1, 0).getDate(), cases = '';
    for (var i = 0; i < decalage; i++) cases += '<span class="case"></span>';
    for (var d = 1; d <= nb; d++) {
      var k = an + '-' + pad(mo + 1) + '-' + pad(d), j = D.jours[k];
      if (!j || !(j.mot || j.date || j.artiste)) { cases += '<span class="case ' + (k > D.aujourdhui ? 'futur' : 'hors') + '"><span class="num">' + d + '</span></span>'; continue; }
      cases += '<button class="case jour' + (k === etat.choisi ? ' choisi' : '') + (k === D.aujourdhui ? ' auj' : '') + '" data-jour="' + k +
        '" aria-label="' + esc(titreJour(k)) + '"><span class="num">' + d + '</span><span class="pts">' +
        TYPES.map(function (t) { return '<b' + (j.lus && j.lus[t] ? ' class="l-' + t + '"' : '') + '></b>'; }).join('') + '</span></button>';
    }
    var min = D.debut.slice(0, 7), max = D.aujourdhui.slice(0, 7), jour = D.jours[etat.choisi] || {};
    var lignes = TYPES.filter(function (t) { return jour[t]; }).map(function (t) { return rangee(t, etat.choisi, jour[t], heure(t) + ' · ' + COURTS[t]); }).join('');
    return bascule + '<div class="mois">' +
        '<button class="fleche" data-mois="-1" aria-label="Mois précédent"' + (etat.mois <= min ? ' disabled' : '') + '>' + I.gauche + '</button>' +
        '<h2>' + capitale(MOIS[mo]) + ' ' + an + '</h2>' +
        '<button class="fleche" data-mois="1" aria-label="Mois suivant"' + (etat.mois >= max ? ' disabled' : '') + '>' + I.droite + '</button></div>' +
      '<div class="semaine">' + ['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(function (x) { return '<span>' + x + '</span>'; }).join('') + '</div>' +
      '<div class="grille">' + cases + '</div>' +
      '<p class="cles"><span><b class="m-mot"></b>Mot lu</span><span><b class="m-date"></b>Date lue</span><span><b class="m-artiste"></b>Artiste lu</span></p>' +
      '<h2 class="titre-section">' + capitale(titreJour(etat.choisi)) + '</h2>' +
      (lignes ? '<div class="lignes">' + lignes + '</div>' : '<p class="vide">Rien n’a encore été révélé ce jour-là.</p>') +
      (cles.length <= 1 ? '<p class="vide">Votre carnet se remplit jour après jour. Dès demain, vous y retrouverez ce que vous avez appris aujourd’hui.</p>' : '');
  }

  // ---------- Écran Quiz ----------
  function vueQuestion() {
    var q = etat.quiz, cour = q.questions[q.i], rep = q.reponses[q.i], repondu = rep != null;
    var barre = '<div class="q-barre" style="grid-template-columns: repeat(' + q.questions.length + ', minmax(0, 1fr))">' +
      q.questions.map(function (x, i) { return '<i class="' + (q.reponses[i] == null ? '' : x.juste ? 'ok' : 'ko') + '"></i>'; }).join('') + '</div>';
    var opts = cour.options.map(function (o, n) {
      var cls = 'option';
      if (repondu) cls += o.bon ? ' bonne' : n === rep ? ' fausse' : ' terne';
      return '<button class="' + cls + '" data-rep="' + n + '"' + (repondu ? ' disabled' : '') + '><span class="lettre">' + 'ABC'.charAt(n) + '</span><span>' + esc(o.texte) + '</span></button>';
    }).join('');
    var bonne = cour.options.filter(function (o) { return o.bon; })[0].texte;
    var verdict = repondu ? '<div class="verdict"><strong>' + (cour.juste ? 'Exact.' : 'Pas tout à fait. Réponse : ' + esc(bonne)) + '</strong>' +
      (cour.explication ? '<p>' + esc(cour.explication) + '</p>' : '') + '</div>' +
      '<button class="btn btn-plein btn-large" data-suivante>' + (q.i + 1 < q.questions.length ? 'Question suivante' : 'Voir le résultat') + '</button>' : '';
    return '<div class="q-tete"><span>' + (q.mode === 'semaine' ? 'Quiz de la semaine' : 'Révision') + '</span><span>' + (q.i + 1) + ' / ' + q.questions.length + '</span></div>' + barre +
      '<p class="q-type"><i class="marque m-' + cour.type + '"></i>' + COURTS[cour.type] + ' du ' + jourMois(cour.jour) + '</p>' +
      '<h2 class="q-enonce">' + esc(cour.enonce) + '</h2>' + (cour.citation ? '<p class="q-citation">' + esc(cour.citation) + '</p>' : '') + opts + verdict;
  }
  function vueResultat() {
    var q = etat.quiz, n = q.questions.length;
    var message = q.score === n ? 'Sans faute.' : q.score >= n * 0.7 ? 'Très bien retenu.' : q.score >= n * 0.4 ? 'Une bonne base, le carnet vous aidera pour le reste.' : 'Les fiches de la semaine sont dans le carnet, pour une seconde lecture.';
    var ratees = q.questions.filter(function (x) { return !x.juste; });
    return '<p class="petit">' + (q.mode === 'semaine' ? 'Quiz de la semaine' : 'Révision') + '</p>' +
      '<p class="score">' + q.score + '<small> / ' + n + '</small></p>' +
      '<p class="lead" style="margin-top: 10px">' + message + '</p>' +
      (q.compte ? '<p class="note">' + q.score + ' point' + (q.score > 1 ? 's' : '') + ' ajouté' + (q.score > 1 ? 's' : '') + ' à votre jauge.</p>' : q.mode === 'semaine' ? '<p class="note">Quiz déjà compté cette semaine : cette partie ne rapporte pas de points.</p>' : '<p class="note">La révision ne rapporte pas de points.</p>') +
      (ratees.length ? '<h2 class="titre-section">À relire</h2><div class="lignes">' + ratees.map(function (x) { return rangee(x.type, x.jour, x.entree, COURTS[x.type] + ', ' + titreJour(x.jour)); }).join('') + '</div>' : '') +
      '<div class="rangee-btn"><button class="btn btn-plein" data-quitter>Terminer</button></div>';
  }
  function vueQuiz() {
    if (etat.quiz) return etat.quiz.fini ? vueResultat() : vueQuestion();
    var s = etatQuizSemaine(), items = D.quizSemaine.entrees;
    var semaine = items.length
      ? (s.fait
        ? '<div class="encart encart-bord"><small>Quiz de la semaine</small><strong>' + s.fait.score + ' / ' + s.fait.total + '</strong><span>Prochain quiz ' + titreJour(D.quizSemaine.prochain) + ', à ' + heure('mot') + '.</span></div>' +
          '<div class="rangee-btn"><button class="btn" data-quiz="semaine">Le refaire, sans points</button></div>'
        : '<div class="encart encart-vert"><small>Quiz de la semaine</small><strong>' + D.questionsSemaine + ' questions</strong><span>Sur les mots, les dates et les artistes du ' + jourMois(s.debut) + ' au ' + jourMois(items[items.length - 1].jour) + '. Ouvert jusqu’au ' + titreJour(D.quizSemaine.prochain) + '.</span></div>' +
          '<div class="rangee-btn"><button class="btn btn-vert" data-quiz="semaine">Commencer</button></div>')
      : '';
    var dispo = entreesCarnet().length;
    var revision = '<h2 class="titre-section">Révision libre</h2><p class="texte">' + Math.min(D.questionsRevision, dispo) + ' questions tirées de votre carnet, à tout moment. Elles ne rapportent pas de points.</p>' +
      '<div class="rangee-btn"><button class="btn btn-plein" data-quiz="revision"' + (dispo ? '' : ' disabled') + '>Réviser maintenant</button></div>';
    var passes = Object.keys(quizFaits).sort().reverse();
    var hist = passes.length ? '<h2 class="titre-section">Vos quiz</h2><div class="historique">' + passes.map(function (k) {
      return '<div><span>' + capitale(titreJour(k)) + '</span><span>' + quizFaits[k].score + ' / ' + quizFaits[k].total + '</span></div>';
    }).join('') + '</div>' : '';
    return '<h1 class="titre-page">Quiz</h1><p class="sous-titre">Chaque dimanche, la semaine en questions</p>' + semaine + revision + hist;
  }

  // ---------- Écran Progrès ----------
  function vueProgres() {
    var n = niveau(), l = fichesLues(), s = serie();
    var j = segments(Math.round(n.part * SEGMENTS)).map(function (c) { return '<i class="' + c + '"></i>'; }).join('');
    var auj = dateDe(D.aujourdhui), sept = '';
    for (var i = 6; i >= 0; i--) {
      var d = new Date(auj); d.setDate(d.getDate() - i);
      var jj = D.jours[cleDe(d)] || {};
      sept += '<div class="col">' + TYPES.map(function (t) { return '<b' + (jj.lus && jj.lus[t] ? ' class="l-' + t + '"' : '') + '></b>'; }).join('') + '<span>' + INITIALES[d.getDay()] + '</span></div>';
    }
    return '<p class="petit">Votre grade</p><h1 class="grade">' + n.nom + '</h1>' +
      '<div class="jauge" aria-hidden="true">' + j + '</div>' +
      '<p class="texte">' + n.points + ' point' + (n.points > 1 ? 's' : '') + (n.suivant ? '. Encore ' + n.manque + ' pour devenir ' + n.suivant.nom.toLowerCase() + '.' : '. Vous avez atteint le plus haut grade.') + '</p>' +
      '<div class="stats">' +
        '<div class="stat"><i class="m-mot"></i><strong>' + l.mot + '</strong><span>mots lus</span></div>' +
        '<div class="stat"><i class="m-date"></i><strong>' + l.date + '</strong><span>dates lues</span></div>' +
        '<div class="stat"><i class="m-artiste"></i><strong>' + l.artiste + '</strong><span>artistes lus</span></div>' +
        '<div class="stat"><i class="m-quiz"></i><strong>' + pointsQuiz() + '</strong><span>points de quiz</span></div></div>' +
      '<h2 class="titre-section">Les sept derniers jours</h2><div class="sept">' + sept + '</div>' +
      '<p class="note">' + (s > 1 ? 'Série de ' + s + ' jours de lecture.' : s === 1 ? 'Un jour de lecture dans la série en cours.' : 'Ouvrez une fiche pour commencer une série.') + '</p>' +
      '<h2 class="titre-section">Le barème</h2><div class="bareme">' +
        '<div><span>Une fiche lue</span><span>1 point</span></div>' +
        '<div><span>Une bonne réponse au quiz de la semaine</span><span>1 point</span></div>' +
        D.niveaux.map(function (x) { return '<div><span>' + x.nom + '</span><span>dès ' + x.seuil + ' points</span></div>'; }).join('') + '</div>';
  }

  // ---------- Fiche ----------
  function ilYa(annee) {
    var txt = String(annee), n = parseInt(txt.replace(/[^0-9]/g, ''), 10);
    if (!n) return '';
    var auj = new Date().getFullYear();
    var ecart = /av\./.test(txt) ? auj + n - 1 : auj - n;
    if (ecart < 1) return '';
    return 'il y a ' + (/vers/.test(txt) ? 'environ ' : '') + nombre(ecart) + NB + 'ans';
  }
  function tailleTitre(t, texte) {
    var n = String(texte).length;
    if (t === 'artiste') return Math.max(34, Math.min(72, Math.floor(1000 / Math.max(n, 8))));
    return Math.max(40, Math.min(118, Math.floor(600 / Math.max(n, 4))));
  }
  function section(titre) { return '<h2 class="section"><i aria-hidden="true"></i>' + esc(titre) + '</h2>'; }
  function blocEcoute(e) {
    if (!e.ecouter || !e.ecouter.length) return '';
    return section('à écouter') + e.ecouter.map(function (c) {
      return lien(c.url, '<span class="jouer">' + I.jouer + '</span><span><small>' + esc([c.emission, c.chaine].filter(Boolean).join(' · ')) + '</small><strong>' + esc(c.titre) + '</strong></span>', 'ecoute');
    }).join('');
  }
  function actions(t, e) {
    var fav = estFavori(t, e);
    return '<div class="actions"><button class="action" data-favori aria-pressed="' + fav + '">' + (fav ? I.garde : I.garder) + '<span>' + (fav ? 'gardé' : 'garder') + '</span></button>' +
      '<button class="action action-plein" data-partager>' + I.partager + '<span>partager</span></button></div>';
  }
  function zoneWiki(t, k, partie, classe) { return '<div class="' + (classe || '') + '" data-wiki="' + t + '|' + k + '" data-part="' + partie + '"></div>'; }
  function corpsMot(e, k) {
    var lemme = e.lemme || String(e.mot).toLowerCase();
    var nature = CATEGORIES[e.categorie] || e.categorie || '';
    return (nature ? '<span class="tag">' + esc(nature) + '</span>' : '') + actions('mot', e) +
      '<p class="lead">' + esc(e.definition) + '</p>' +
      (e.exemple ? '<p class="citation">« ' + esc(e.exemple) + ' »</p>' : '') +
      (e.synonymes && e.synonymes.length ? section('synonymes') + '<div class="mots">' + e.synonymes.map(function (s) { return '<span>' + esc(s) + '</span>'; }).join('') + '</div>' : '') +
      blocEcoute(e) +
      section('à lire') +
      lien('https://www.cnrtl.fr/definition/' + encodeURIComponent(lemme), '<span><small>cnrtl, trésor de la langue française</small><strong>' + esc(e.mot) + ' : définition et étymologie</strong></span>' + I.sortie, 'lire') +
      '<div class="volets">' + volet('en situation', liste(e.situations)) + volet('la nuance', e.piege ? '<p>' + esc(e.piege) + '</p>' : '') + '</div>';
  }
  function corpsDate(e, k) {
    var ecart = ilYa(e.annee);
    return '<h1>' + esc(e.evenement) + '</h1>' + (ecart ? '<span class="tag">' + ecart + '</span>' : '') + actions('date', e) +
      '<p class="lead">' + esc(e.contexte) + '</p>' +
      zoneWiki('date', k, 'image', 'visuel') +
      (e.recit ? '<p class="texte">' + esc(e.recit) + '</p>' : '') +
      blocEcoute(e) +
      zoneWiki('date', k, 'lire', 'zone-lire') +
      '<div class="volets">' + volet('le résumé de wikipédia', zoneWiki('date', k, 'extrait')) + '</div>';
  }
  function corpsArtiste(e, k) {
    var meta = [e.discipline, e.pays, e.epoque].filter(Boolean).join(' · ');
    var mv = e.mouvement || {};
    return (meta ? '<span class="tag">' + esc(meta) + '</span>' : '') + actions('artiste', e) +
      '<p class="lead">' + esc(e.presentation) + '</p>' +
      zoneWiki('artiste', k, 'galerie', 'galerie') +
      (e.oeuvre ? section('pour commencer') + '<p class="lead">' + esc(e.oeuvre) + '</p>' : '') +
      (e.bio ? section('sa vie') + '<p class="texte">' + esc(e.bio) + '</p>' : '') +
      blocEcoute(e) +
      zoneWiki('artiste', k, 'lire', 'zone-lire') +
      '<div class="volets">' +
        volet('œuvres clés', liste(e.oeuvres_cles || (e.oeuvre ? [e.oeuvre] : []))) +
        (mv.nom ? volet('le courant : ' + mv.nom.toLowerCase(), '<p>' + esc(mv.texte) + '</p>') : '') +
        volet('le résumé de wikipédia', zoneWiki('artiste', k, 'extrait')) +
      '</div>';
  }
  function vueFiche() {
    var f = etat.fiche, t = f.type, e = entreeDe(t, f.cle);
    if (!e) { etat.fiche = null; return null; }
    var n = niveau();
    var titre = t === 'mot' ? e.mot : t === 'date' ? String(e.annee).replace(/^vers\s+/, '') : e.nom;
    var vers = t === 'date' && /^vers\s/.test(String(e.annee));
    var contenu = t === 'mot' ? corpsMot(e, f.cle) : t === 'date' ? corpsDate(e, f.cle) : corpsArtiste(e, f.cle);
    return '<article class="fiche f-' + t + '"><header class="hero"><div class="hero-tri" aria-hidden="true"></div>' +
      '<div class="hero-haut"><button class="retour" data-fermer aria-label="Revenir">' + I.retour + '</button><span>' + NOMS_FICHE[t] + ' · ' + heure(t) +
      (f.cle !== D.aujourdhui ? ' · ' + jourMois(f.cle) : '') + '</span></div>' +
      (vers ? '<span class="hero-vers">vers</span>' : '') +
      '<p class="hero-titre' + (t === 'date' ? '' : ' bas-casse') + '" style="font-size: ' + tailleTitre(t, titre) + 'px">' + esc(titre) + '</p></header>' +
      '<div class="corps">' + contenu + '</div>' +
      '<div class="bandeau"><span>' + (f.nouveau ? 'fiche lue <span class="plus">+1</span>' : 'fiche déjà lue') + '</span><span>' + esc(libelleNiveau(n).toLowerCase()) + '</span></div></article>';
  }

  // ---------- Rendu ----------
  function barre() {
    var onglets = [['jour', 'Aujourd’hui'], ['carnet', 'Carnet'], ['quiz', 'Quiz'], ['progres', 'Progrès']];
    return '<nav class="nav" aria-label="Navigation">' + onglets.map(function (o) {
      return '<button data-onglet="' + o[0] + '" style="--c: ' + COULEUR_ONGLET[o[0]] + '"' + (etat.onglet === o[0] ? ' aria-current="page"' : '') + '><i></i><span>' + o[1] + '</span></button>';
    }).join('') + '</nav>';
  }
  function libellesBord(n) {
    var s = serie(), prochain = 'Prochain quiz : ' + titreJour(D.quizSemaine.prochain);
    var bas = etat.onglet === 'quiz' && etat.quiz ? 'Une bonne réponse, un point' : (etat.onglet === 'progres' ? 'Un point par fiche lue' : prochain);
    return '<div class="lib lib-haut"><span>Trois fois par jour</span><span>' + jourMois(D.aujourdhui) + '</span></div>' +
      '<div class="lib lib-droite">' + esc(libelleNiveau(n)) + (n.suivant ? ' · ' + n.suivant.nom + ' dans ' + n.manque : '') + '</div>' +
      '<div class="lib lib-gauche">' + (s > 1 ? 'Série de ' + s + ' jours' : 'Série en cours : ' + s + ' jour') + '</div>' +
      '<div class="lib lib-bas">' + esc(bas) + '</div>';
  }
  function vueOnglet() {
    return etat.onglet === 'carnet' ? vueCarnet() : etat.onglet === 'quiz' ? vueQuiz() : etat.onglet === 'progres' ? vueProgres() : vueJour();
  }
  function rendre(garderDefilement) {
    var app = document.getElementById('app');
    var z = document.querySelector('.zone'), y = garderDefilement && z ? z.scrollTop : 0;
    var fiche = etat.fiche ? vueFiche() : null;
    if (fiche) {
      app.innerHTML = fiche;
      if (!garderDefilement) window.scrollTo(0, 0);
      demander(etat.fiche.type, etat.fiche.cle);
      remplir();
      return;
    }
    var n = niveau();
    app.innerHTML = cadre(n) + libellesBord(n) + '<main class="zone">' + vueOnglet() + '</main>' + barre();
    var nz = document.querySelector('.zone');
    if (nz) nz.scrollTop = y;
  }
  function ouvrir(t, k) {
    var nouveau = !estLu(t, k);
    if (nouveau) {
      D.jours[k] = D.jours[k] || {};
      D.jours[k].lus = D.jours[k].lus || {};
      D.jours[k].lus[t] = true;
      pont('lire', { cle: k, type: t });
    }
    etat.fiche = { type: t, cle: k, nouveau: nouveau };
    rendre();
  }

  // ---------- Wikipédia (via Scriptable) ----------
  function demander(t, k) {
    var c = t + '|' + k;
    if (t === 'mot') return;
    if (demandes[c]) { remplir(); return; }
    var e = entreeDe(t, k);
    if (!e) return;
    demandes[c] = true;
    setTimeout(function () { if (!wiki[c]) { wiki[c] = { vide: true }; remplir(); } }, 15000);
    pont('wiki', { cle: c, items: [{ id: t, q: t === 'date' ? (e.wikipedia || e.evenement) : (e.wikipedia || e.nom), galerie: t === 'artiste' }] });
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
      if (!w) { if (z.getAttribute('data-part') === 'extrait') z.innerHTML = '<p class="attente">Chargement…</p>'; continue; }
      var partie = z.getAttribute('data-part');
      if (partie === 'image') {
        z.innerHTML = w.image ? '<img src="' + esc(w.image) + '" alt=""><p class="legende-img">Image : Wikipédia</p>' : '';
      } else if (partie === 'galerie') {
        z.innerHTML = w.galerie && w.galerie.length ? w.galerie.map(function (g) {
          return '<figure><img src="' + esc(g.src) + '" alt="' + esc(g.legende) + '" loading="lazy">' + (g.legende ? '<figcaption>' + esc(g.legende) + '</figcaption>' : '') + '</figure>';
        }).join('') : '';
      } else if (partie === 'lire') {
        z.innerHTML = w.url ? section('à lire') + '<div style="height: 14px"></div>' + lien(w.url, '<span><small>wikipédia</small><strong>' + esc(w.titre) + '</strong></span>' + I.sortie, 'lire') : '';
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
    var f = etat.fiche, e = entreeDe(f.type, f.cle), id = identite(f.type, e), actifFav = !estFavori(f.type, e);
    favoris = favoris.filter(function (x) { return !(x.type === f.type && x.id === id); });
    if (actifFav) favoris.push({ type: f.type, id: id, jour: f.cle, entree: e });
    pont('favoris', { liste: favoris });
    var y = window.scrollY; rendre(true); window.scrollTo(0, y);
  }

  // ---------- Interactions ----------
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-onglet],[data-ouvrir],[data-fermer],[data-jour],[data-mois],[data-favori],[data-partager],[data-carnet],[data-quiz],[data-rep],[data-suivante],[data-quitter]');
    if (!b || b.disabled) return;
    if (b.hasAttribute('data-onglet')) {
      etat.onglet = b.getAttribute('data-onglet'); etat.fiche = null;
      if (etat.onglet !== 'quiz' && etat.quiz && etat.quiz.fini) etat.quiz = null;
      rendre();
    } else if (b.hasAttribute('data-ouvrir')) {
      var p = b.getAttribute('data-ouvrir').split('|');
      ouvrir(p[0], p[1]);
    } else if (b.hasAttribute('data-fermer')) {
      etat.fiche = null; rendre();
    } else if (b.hasAttribute('data-jour')) {
      etat.choisi = b.getAttribute('data-jour'); rendre(true);
    } else if (b.hasAttribute('data-mois')) {
      var a = +etat.mois.slice(0, 4), m = +etat.mois.slice(5, 7) - 1 + (+b.getAttribute('data-mois'));
      etat.mois = cleDe(new Date(a, m, 1)).slice(0, 7); rendre(true);
    } else if (b.hasAttribute('data-carnet')) {
      etat.vueCarnet = b.getAttribute('data-carnet'); rendre();
    } else if (b.hasAttribute('data-quiz')) {
      lancerQuiz(b.getAttribute('data-quiz')); rendre();
    } else if (b.hasAttribute('data-rep')) {
      repondre(+b.getAttribute('data-rep')); rendre(true);
    } else if (b.hasAttribute('data-suivante')) {
      suivante(); rendre();
    } else if (b.hasAttribute('data-quitter')) {
      etat.quiz = null; rendre();
    } else if (b.hasAttribute('data-favori')) {
      basculerFavori();
    } else if (b.hasAttribute('data-partager')) {
      var f = etat.fiche; pont('partager', { texte: texteAPartager(f.type, entreeDe(f.type, f.cle)) });
    }
  });

  // Un tap sur le widget ouvre directement la fiche qui vient d'être révélée
  if (D.actuel) ouvrir(D.actuel, D.aujourdhui); else rendre();
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
    if (garde.lus) j.lus = garde.lus
    jours[k] = j
    curseur.setDate(curseur.getDate() + 1)
  }

  // Le quiz porte sur les six jours qui précèdent son dimanche
  const dimanche = dimancheDuQuiz(maintenant)
  const entreesQuiz = []
  for (let i = 6; i >= 1; i--) {
    const jour = decaler(dimanche, -i)
    const garde = h.jours[cle(jour)] || {}
    for (const t of TYPES) {
      entreesQuiz.push({ type: t, jour: cle(jour), entree: actualiser(t, garde[t], listes[t]) || choisir(listes[t], jour) })
    }
  }

  const donnees = {
    horaires: HORAIRES,
    aujourdhui: cleAujourdhui,
    debut: h.debut,
    actuel: revele("mot", maintenant) ? momentActuel(maintenant).type : null,
    jours,
    listes,
    niveaux: NIVEAUX,
    quiz: h.quiz,
    quizSemaine: { cle: cle(dimanche), prochain: cle(decaler(dimanche, 7)), entrees: entreesQuiz },
    questionsSemaine: QUESTIONS_SEMAINE,
    questionsRevision: QUESTIONS_REVISION,
    favoris: lireFavoris(),
    depot: DEPOT,
  }

  const vue = new WebView()

  // La page demande à Scriptable ce qu'elle ne peut pas faire seule :
  // charger Wikipédia, enregistrer la lecture, les favoris et le quiz, ouvrir le partage.
  async function pont(url) {
    try {
      const action = url.slice("tfpj://".length, url.indexOf("?"))
      const demande = JSON.parse(decodeURIComponent(url.slice(url.indexOf("?") + 1)))
      if (action === "wiki") {
        const resultats = {}
        await Promise.all(demande.items.map(async it => { resultats[it.id] = await wikipedia(it.q, it.galerie) }))
        await vue.evaluateJavaScript(`window.recevoirWiki(${JSON.stringify({ cle: demande.cle, resultats })})`, false)
      } else if (action === "lire") {
        const hh = lireHistorique()
        hh.jours[demande.cle] = hh.jours[demande.cle] || {}
        hh.jours[demande.cle].lus = hh.jours[demande.cle].lus || {}
        hh.jours[demande.cle].lus[demande.type] = true
        ecrireHistorique(hh)
      } else if (action === "quiz") {
        const hh = lireHistorique()
        if (!hh.quiz[demande.cle]) {
          hh.quiz[demande.cle] = { score: demande.score, total: demande.total }
          ecrireHistorique(hh)
        }
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
