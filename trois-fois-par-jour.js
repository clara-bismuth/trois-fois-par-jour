// ============================================================
// Trois fois par jour · version 6
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
  papier: Color.dynamic(new Color("#F6F5F1"), new Color("#161615")),
  doux: Color.dynamic(new Color("#55554F"), new Color("#A3A39B")),
  moment: {
    mot: new Color("#E8B800"),
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

// Les folles histoires : combien sont offertes dès la première ouverture.
// Ensuite, une par quiz de la semaine terminé, et une en bonus à chaque grade passé.
const HISTOIRES_OFFERTES = 1

const ENTETES_WIKI = {
  "Api-User-Agent": "TroisFoisParJour/6.0 (https://github.com/clara-bismuth/trois-fois-par-jour)",
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
const FICHIER_HISTOIRES = "histoires.json"

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

// Les folles histoires : un seul fichier, gardé en copie pour les jours sans réseau
async function chargerHistoires() {
  const chemin = fm.joinPath(dossier, FICHIER_HISTOIRES)
  try {
    const requete = new Request(URL_DONNEES + FICHIER_HISTOIRES)
    requete.timeoutInterval = 8
    const donnees = await requete.loadJSON()
    if (donnees && Array.isArray(donnees.histoires) && donnees.histoires.length > 0) {
      fm.writeString(chemin, JSON.stringify(donnees))
      return donnees
    }
  } catch (e) {
    console.log(`Téléchargement impossible pour les histoires : ${e}`)
  }
  if (fm.fileExists(chemin)) {
    try { return JSON.parse(fm.readString(chemin)) } catch (e) {}
  }
  return { histoires: [], statuts: {} }
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
      h.histoires = h.histoires || { ids: [], lues: {} }
      return h
    }
  } catch (e) {
    console.log("Carnet illisible, il repart de zéro")
  }
  return { debut: null, jours: {}, quiz: {}, histoires: { ids: [], lues: {} } }
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

// Points de la jauge : une fiche lue, un point ; une bonne réponse au quiz de la semaine, un point
function pointsDe(h) {
  let n = 0
  for (const k of Object.keys(h.jours)) {
    const l = h.jours[k].lus
    if (l) for (const t of TYPES) if (l[t]) n++
  }
  for (const k of Object.keys(h.quiz)) n += h.quiz[k].score || 0
  return n
}

function gradeDe(points) {
  let i = 0
  while (i + 1 < NIVEAUX.length && points >= NIVEAUX[i + 1].seuil) i++
  return i
}

// Débloque les folles histoires dans l'ordre du fichier, selon les droits acquis.
// La page applique la même règle, pour afficher l'histoire gagnée sans attendre.
function attribuerHistoires(h, liste) {
  h.histoires = h.histoires || { ids: [], lues: {} }
  h.histoires.lues = h.histoires.lues || {}
  const droits = Math.min(liste.length, HISTOIRES_OFFERTES + Object.keys(h.quiz).length + gradeDe(pointsDe(h)))
  const vues = new Set(h.histoires.ids)
  for (const x of liste) {
    if (h.histoires.ids.length >= droits) break
    if (!vues.has(x.id)) { h.histoires.ids.push(x.id); vues.add(x.id) }
  }
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
  for (const t of [libelle, titre, texte]) t.leftAlignText()
  return w
}

function widgetLigne(f) {
  const w = new ListWidget()
  const t = w.addText(`${f.libelle.split(" ")[0]} : ${f.titre}`)
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
// Charte « Bauhaus discret » : fond papier, cartes blanches, une forme et une couleur par moment.

const STYLES = `
:root {
  --fond: #F6F5F1; --carte: #FFFFFF; --trait: #DAD8D1; --piste: #E7E5DF; --eteint: #CFCDC6;
  --encre: #1A1A1A; --doux: #5E5D57; --inactif: #6B6A64; --pale: #A9A7A0;
  --jaune: #E8B800; --jaune-clair: #F2D04B; --rouge: #D7261E; --bleu: #2F74C0; --vert: #157A43;
  --titre: Futura, "Futura-Medium", Jost, "Avenir Next", sans-serif;
  --texte: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Inter, sans-serif;
  color-scheme: light;
}
* { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
html { -webkit-text-size-adjust: 100%; }
body { margin: 0; background: var(--fond); color: var(--encre); font: 16px/1.5 var(--texte); }
button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; text-align: left; cursor: pointer; }
button:disabled { cursor: default; }
a { color: inherit; text-decoration: none; }
button:focus-visible, a:focus-visible, summary:focus-visible { outline: 2px solid var(--bleu); outline-offset: 2px; }
svg { flex: none; display: block; }
p { margin: 0; }

/* ---------- Écrans ---------- */
.ecran { max-width: 560px; margin: 0 auto; padding: calc(env(safe-area-inset-top) + 18px) 20px calc(env(safe-area-inset-bottom) + 104px);
  display: flex; flex-direction: column; gap: 16px; }
.ecran.focus { padding-bottom: calc(env(safe-area-inset-bottom) + 28px); min-height: 100vh; }
.page { margin: 0; font: 500 34px/1.1 var(--titre); letter-spacing: -0.01em; }
.sous-page { margin-top: -10px; font-size: 15px; color: var(--doux); }
.etiquette { margin: 0 0 8px; font-size: 13px; font-weight: 600; color: var(--doux); }
.carte { background: var(--carte); border: 1px solid var(--trait); }
.pad { padding: 14px 16px; }
.texte-doux { font-size: 14px; line-height: 1.5; color: var(--doux); }
.vide { padding: 18px 16px; font-size: 15px; line-height: 1.5; color: var(--doux); }

/* ---------- En-tête ---------- */
.entete { display: flex; justify-content: space-between; align-items: center; min-height: 28px; }
.marque { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; }
.marque span { margin-left: 4px; }
.puce { display: inline-flex; align-items: center; gap: 6px; height: 28px; padding: 0 10px; background: var(--carte);
  border: 1px solid var(--trait); font-size: 13px; font-weight: 600; white-space: nowrap; }

/* ---------- Grade ---------- */
.grade-ligne { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
.grade-nom { font: 500 18px/1.2 var(--titre); }
.grade-pts { font-size: 14px; color: var(--doux); }
.grade-pts strong { color: var(--encre); }
.barre { height: 6px; margin-top: 10px; background: var(--piste); }
.barre i { display: block; height: 100%; background: var(--encre); }
.grade-aide { margin-top: 8px; font-size: 13px; color: var(--doux); }

/* ---------- À la une ---------- */
.une { position: relative; overflow: hidden; }
.une-coin { position: absolute; right: 0; top: 0; width: 52px; height: 52px; clip-path: polygon(0 0, 100% 0, 100% 100%); }
.une-corps { padding: 16px 16px 0; }
.une-sur { display: flex; align-items: center; gap: 8px; padding-right: 48px; font-size: 13px; font-weight: 500; color: var(--doux); }
.une-titre { margin-top: 10px; font: 500 44px/1.02 var(--titre); letter-spacing: -0.02em; overflow-wrap: anywhere; }
.une-titre.long { font-size: 34px; }
.une-sous { margin-top: 6px; font-size: 18px; line-height: 1.3; font-weight: 600; }
.une-resume { margin-top: 6px; font-size: 15px; line-height: 1.45; color: var(--doux);
  display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.une-plus { display: flex; align-items: center; gap: 6px; margin-top: 10px; font-size: 13px; color: var(--doux); }
.bouton { display: flex; align-items: center; justify-content: space-between; gap: 10px; min-height: 48px; padding: 0 16px;
  background: var(--encre); color: #FFFFFF; font-size: 16px; font-weight: 600; width: 100%; }
.bouton.centre { justify-content: center; }
.bouton.vert { background: var(--vert); }
.bouton.clair { background: var(--carte); color: var(--encre); border: 1px solid var(--trait); }
.bouton:disabled { background: var(--piste); color: var(--pale); }
.une .bouton { margin: 14px 16px 16px; width: calc(100% - 32px); }

/* ---------- Listes ---------- */
.liste { background: var(--carte); border: 1px solid var(--trait); }
.rang { display: grid; grid-template-columns: 30px minmax(0, 1fr) auto; align-items: center; gap: 8px; width: 100%;
  min-height: 60px; padding: 10px 14px; color: var(--encre); }
.rang + .rang { border-top: 1px solid var(--trait); }
.rang-sur { font-size: 12px; color: var(--doux); }
.rang-titre { font-size: 17px; font-weight: 600; line-height: 1.3; margin-top: 1px; }
.rang-titre.eteint { color: var(--doux); }
.rang-texte { font-size: 14px; line-height: 1.4; color: var(--doux); margin-top: 2px;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.lu { display: inline-flex; align-items: center; gap: 4px; font-size: 13px; font-weight: 600; color: var(--vert); }
.nouveau { display: inline-block; margin-left: 6px; padding: 1px 6px; background: var(--jaune-clair); color: var(--encre);
  font-size: 11px; font-weight: 700; letter-spacing: 0.02em; vertical-align: 1px; }
.seule { border: 1px solid var(--trait); background: var(--carte); }

/* ---------- Barre d'onglets ---------- */
.nav { position: fixed; left: 0; right: 0; bottom: 0; z-index: 10; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr));
  padding: 6px 8px calc(env(safe-area-inset-bottom) + 10px); background: var(--carte); border-top: 1px solid var(--trait); }
.nav button { position: relative; min-height: 52px; display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 4px; color: var(--inactif); font-size: 12px; font-weight: 500; text-align: center; }
.nav button[aria-current="page"] { color: var(--encre); font-weight: 600; }
.nav button[aria-current="page"]::before { content: ""; position: absolute; top: -7px; left: 50%; width: 28px; height: 3px;
  margin-left: -14px; background: var(--encre); }

/* ---------- Bascule ---------- */
.bascule { display: grid; grid-auto-columns: minmax(0, 1fr); grid-auto-flow: column; padding: 3px; background: var(--piste); }
.bascule button { min-height: 36px; padding: 0 6px; border: 1px solid transparent; color: var(--doux); font-size: 14px; font-weight: 500;
  text-align: center; white-space: nowrap; }
.bascule button[aria-pressed="true"] { background: var(--carte); border-color: var(--trait); color: var(--encre); font-weight: 600; }

/* ---------- Calendrier ---------- */
.cal { padding: 10px 12px 14px; }
.cal-mois { display: flex; justify-content: space-between; align-items: center; }
.cal-mois strong { font: 500 20px/1.2 var(--titre); }
.fleche { width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; }
.fleche:disabled { opacity: 0.3; }
.cal-sem, .cal-grille { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); }
.cal-sem { margin: 4px 0 2px; text-align: center; font-size: 12px; font-weight: 600; color: var(--doux); }
.jour { height: 46px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; font-size: 15px; }
.jour .num { width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; }
.jour.hors .num, .jour.futur .num { color: var(--pale); }
.jour.auj .num { border: 1.5px solid var(--encre); font-weight: 600; }
.jour.choisi .num { background: var(--encre); color: #FFFFFF; font-weight: 600; border-color: var(--encre); }
.jour .pts { height: 6px; }
.legende { display: flex; flex-wrap: wrap; gap: 8px 16px; margin-top: 8px; padding-top: 10px; border-top: 1px solid var(--trait);
  font-size: 12px; color: var(--doux); }
.legende span { display: inline-flex; align-items: center; gap: 6px; }

/* ---------- Progrès ---------- */
.grade-grand { margin-top: 2px; font: 500 38px/1.1 var(--titre); }
.chemin { position: relative; height: 26px; margin-top: 16px; }
.chemin-piste, .chemin-fait { position: absolute; top: 11px; height: 4px; left: 7px; }
.chemin-piste { right: 7px; background: var(--piste); }
.chemin-fait { background: var(--encre); }
.chemin-pas { position: absolute; top: 6px; }
.chemin-noms { display: flex; justify-content: space-between; margin-top: 4px; font-size: 12px; color: var(--doux); }
.stats { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.stat { padding: 12px 14px; }
.stat strong { display: block; margin-top: 8px; font: 500 28px/1 var(--titre); }
.stat span { display: block; margin-top: 4px; font-size: 13px; color: var(--doux); }
.semaine { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); margin-top: 12px; text-align: center; font-size: 12px; color: var(--doux); }
.semaine div { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.semaine .auj { font-weight: 700; color: var(--encre); }

/* ---------- Volets ---------- */
details.volet { border-top: 1px solid var(--trait); }
details.volet summary { list-style: none; display: flex; justify-content: space-between; align-items: center; min-height: 52px;
  font-size: 16px; font-weight: 600; cursor: pointer; }
details.volet summary::-webkit-details-marker { display: none; }
details.volet .ouvre { transition: transform .2s ease-out; }
details.volet[open] .ouvre { transform: rotate(45deg); }
details.volet .contenu { padding: 0 0 16px; font-size: 16px; line-height: 1.6; }
details.volet .contenu ul { margin: 0; padding-left: 20px; }
details.volet .contenu li + li { margin-top: 6px; }
.carte details.volet { border-top: 0; padding: 0 16px; }

/* ---------- Fiche ---------- */
.fiche { max-width: 560px; margin: 0 auto; min-height: 100vh; display: flex; flex-direction: column; }
.hero { position: relative; flex: none; min-height: calc(env(safe-area-inset-top) + 250px); overflow: hidden;
  padding: calc(env(safe-area-inset-top) + 84px) 20px 64px; clip-path: polygon(0 0, 100% 0, 100% 82%, 0 100%); }
.h-mot { background: var(--jaune); color: var(--encre); }
.h-date { background: var(--rouge); color: #FFFFFF; }
.h-artiste { background: var(--bleu); color: #FFFFFF; }
.h-histoire { background: var(--encre); color: #FFFFFF; }
.hero-coin { position: absolute; right: 0; top: 0; width: 84px; height: calc(env(safe-area-inset-top) + 100px); clip-path: polygon(0 0, 100% 0, 100% 100%); }
.hero-barre { position: absolute; left: 16px; right: 16px; top: calc(env(safe-area-inset-top) + 16px); display: flex; justify-content: space-between; align-items: center; }
.hero-actions { display: flex; gap: 8px; margin-right: 44px; }
.carre { width: 44px; height: 44px; border: 1.5px solid currentColor; display: flex; align-items: center; justify-content: center; }
.carre[aria-pressed="true"] { background: currentColor; }
.carre[aria-pressed="true"] svg { color: var(--fond-hero, #1A1A1A); }
.h-mot .carre[aria-pressed="true"] svg { color: var(--jaune); }
.h-date .carre[aria-pressed="true"] svg { color: var(--rouge); }
.h-artiste .carre[aria-pressed="true"] svg { color: var(--bleu); }
.hero-sur { font-size: 13px; font-weight: 600; }
.hero-titre { margin-top: 8px; display: flex; align-items: baseline; gap: 8px; font-family: var(--titre); font-weight: 500;
  line-height: 1; letter-spacing: -0.03em; overflow-wrap: anywhere; }
.hero-titre small { font-size: 20px; letter-spacing: 0; }
.corps { padding: 6px 20px 0; display: flex; flex-direction: column; gap: 18px; }
.corps h1 { margin: 0; font: 500 30px/1.15 var(--titre); letter-spacing: -0.01em; }
.meta { display: flex; align-items: center; flex-wrap: wrap; gap: 8px 12px; }
.tag { display: inline-block; padding: 3px 10px; background: var(--jaune-clair); color: var(--encre); font-size: 13px; font-weight: 600; transform: rotate(-2deg); }
.tag.droit { transform: none; }
.temps { font-size: 13px; color: var(--doux); }
.lead { font-size: 20px; line-height: 1.45; font-weight: 500; }
.texte { font-size: 17px; line-height: 1.6; }
.citation { font-size: 18px; line-height: 1.5; font-style: italic; color: var(--doux); }
.mots { display: flex; flex-wrap: wrap; gap: 8px; }
.mots span { padding: 6px 12px; background: var(--carte); border: 1px solid var(--trait); font-size: 15px; }
.bloc { border-top: 1px solid var(--trait); padding-top: 14px; }
.bloc > .etiquette { margin-bottom: 10px; }
.ecoute { display: grid; grid-template-columns: 52px minmax(0, 1fr); gap: 14px; align-items: center; padding: 12px; background: var(--carte); border: 1px solid var(--trait); }
.ecoute + .ecoute { margin-top: 8px; }
.ecoute-jouer { width: 52px; height: 52px; background: var(--bleu); display: flex; align-items: center; justify-content: center; }
.ecoute small, .lire small { display: block; font-size: 12px; color: var(--doux); }
.ecoute strong { display: block; margin-top: 2px; font-size: 16px; line-height: 1.3; }
.lire { display: flex; justify-content: space-between; align-items: center; gap: 12px; min-height: 52px; }
.lire strong { font-size: 16px; }
.visuel img { display: block; width: 100%; height: auto; background: var(--piste); }
.visuel p { margin-top: 6px; font-size: 12px; color: var(--doux); }
.galerie { display: flex; gap: 10px; overflow-x: auto; margin: 0 -20px; padding: 0 20px; scroll-snap-type: x mandatory; }
.galerie:empty { display: none; }
.galerie figure { flex: none; width: 72%; margin: 0; scroll-snap-align: start; }
.galerie img { display: block; width: 100%; height: 220px; object-fit: cover; background: var(--piste); }
.galerie figcaption { margin-top: 6px; font-size: 12px; line-height: 1.4; color: var(--doux); }
.attente, .source { font-size: 14px; color: var(--doux); }
.source { margin-top: 10px; }
.pied { margin-top: 28px; padding: 14px 20px calc(env(safe-area-inset-bottom) + 22px); background: var(--carte); border-top: 1px solid var(--trait);
  display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.pied-gauche { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 600; }
.pied-droite { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--doux); white-space: nowrap; }
.mini { width: 60px; height: 5px; background: var(--piste); }
.mini i { display: block; height: 100%; background: var(--encre); }
.cadeau { display: grid; grid-template-columns: 30px minmax(0, 1fr) auto; gap: 8px; align-items: center; margin: 18px 20px 0; padding: 12px 14px;
  background: var(--carte); border: 1.5px solid var(--encre); }
.apparait { animation: apparait .35s ease-out both; }
@keyframes apparait { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .apparait { animation: none; } details.volet .ouvre { transition: none; } }

/* ---------- Folles histoires ---------- */
.statut { display: inline-block; padding: 3px 10px; font-size: 13px; font-weight: 600; }
.st-vrai { background: var(--vert); color: #FFFFFF; }
.st-embelli { background: var(--jaune-clair); color: var(--encre); }
.st-mythe, .st-legende { background: var(--rouge); color: #FFFFFF; }
.st-dispute { background: var(--bleu); color: #FFFFFF; }
.avis { display: grid; grid-template-columns: 22px minmax(0, 1fr); gap: 10px; padding: 12px 14px; background: var(--carte); border: 1px solid var(--trait);
  font-size: 15px; line-height: 1.5; }
.avis strong { display: block; font-size: 13px; color: var(--doux); }
.collection { display: grid; grid-template-columns: repeat(10, minmax(0, 1fr)); gap: 4px; margin-top: 14px; }
.collection i { display: block; aspect-ratio: 1; border: 1.5px solid var(--eteint); }
.collection i.ok { background: var(--encre); border-color: var(--encre); }
.collection i.neuf { background: var(--jaune); border-color: var(--jaune); }
.compte { display: flex; align-items: baseline; gap: 8px; margin-top: 10px; }
.compte strong { font: 500 40px/1 var(--titre); }
.compte span { font-size: 15px; color: var(--doux); }
.regle { display: grid; grid-template-columns: 20px minmax(0, 1fr); gap: 10px; align-items: start; font-size: 14px; line-height: 1.45; color: var(--doux); }
.regle + .regle { margin-top: 8px; }
.regle svg { margin-top: 3px; }

/* ---------- Quiz ---------- */
.q-tete { display: grid; grid-template-columns: 44px minmax(0, 1fr) 44px; align-items: center; }
.q-tete .fermer { width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; }
.q-tete span { text-align: center; font-size: 15px; font-weight: 600; }
.q-tete span + span { text-align: right; color: var(--doux); }
.q-barre { display: grid; gap: 3px; }
.q-barre i { display: block; height: 5px; background: var(--piste); }
.q-barre i.ok { background: var(--vert); }
.q-barre i.ko { background: var(--encre); }
.q-barre i.ici { background: var(--pale); }
.q-sur { display: flex; align-items: center; gap: 8px; margin-top: 6px; font-size: 13px; font-weight: 500; color: var(--doux); }
.q-enonce { margin: -6px 0 0; font: 500 28px/1.15 var(--titre); }
.q-citation { padding: 14px 16px; background: var(--carte); border: 1px solid var(--trait); font-size: 19px; line-height: 1.4; font-weight: 500; }
.options { display: flex; flex-direction: column; gap: 8px; }
.option { display: grid; grid-template-columns: 32px minmax(0, 1fr) 20px; align-items: center; gap: 12px; min-height: 56px; padding: 10px 14px;
  background: var(--carte); border: 1px solid var(--trait); font-size: 17px; line-height: 1.35; font-weight: 500; }
.option .lettre { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border: 1px solid var(--trait); font-size: 14px; }
.option.bonne { background: var(--vert); border: 2px solid var(--vert); color: #FFFFFF; font-weight: 600; }
.option.bonne .lettre { background: #FFFFFF; color: var(--vert); border-color: #FFFFFF; }
.option.fausse { border: 2px solid var(--encre); }
.option.fausse .lettre { background: var(--encre); color: #FFFFFF; border-color: var(--encre); }
.option.terne { color: var(--pale); }
.verdict { padding: 14px 16px; background: var(--carte); border: 1px solid var(--trait); }
.verdict strong { font-size: 16px; }
.verdict p { margin-top: 6px; font-size: 15px; line-height: 1.5; color: var(--doux); }
.bas { margin-top: auto; }
.score { font: 500 64px/1 var(--titre); }
.score small { font-size: 28px; color: var(--doux); }
.historique div { display: flex; justify-content: space-between; min-height: 48px; align-items: center; padding: 0 16px; font-size: 15px; }
.historique div + div { border-top: 1px solid var(--trait); }
.recompense { display: flex; align-items: center; gap: 8px; margin-top: 10px; font-size: 13px; color: var(--doux); }
`


// ---------- PAGE DE L'APP : COMPORTEMENT ----------
// Écrit sans gabarits ni « ${ » : ce texte est injecté tel quel dans la page.

const SCRIPT_PAGE = String.raw`
(function () {
  var D = JSON.parse(document.getElementById('donnees').textContent);
  var NB = String.fromCharCode(160);
  var TYPES = ['mot', 'date', 'artiste'];
  var NOMS = { mot: 'Le mot du matin', date: 'La date de midi', artiste: 'L’artiste du soir' };
  var MOMENTS = { mot: 'Mot du matin', date: 'Date de midi', artiste: 'Artiste du soir' };
  var COURTS = { mot: 'Mot', date: 'Date', artiste: 'Artiste' };
  var CATEGORIES = { 'n. f.': 'nom féminin', 'n. m.': 'nom masculin', 'n. f. pl.': 'nom féminin pluriel',
    'n. m. pl.': 'nom masculin pluriel', 'adj.': 'adjectif', 'adv.': 'adverbe', 'v.': 'verbe', 'v. pron.': 'verbe pronominal' };
  var MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  var SEMAINE = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  var INITIALES = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
  var C = { mot: '#E8B800', date: '#D7261E', artiste: '#2F74C0', quiz: '#157A43', histoire: '#1A1A1A', eteint: '#CFCDC6', encre: '#1A1A1A', doux: '#5E5D57', blanc: '#FFFFFF', vert: '#157A43' };
  var CORNE = { mot: '#2F74C0', date: '#E8B800', artiste: '#E8B800', histoire: '#E8B800' };
  var etat = { onglet: 'jour', fiche: null, histoire: null, mois: null, choisi: null, vueCarnet: 'calendrier', quiz: null };
  var wiki = {}, demandes = {};
  var favoris = D.favoris || [];
  var quizFaits = D.quiz || {};
  var H = { liste: (D.histoires && D.histoires.liste) || [], ids: ((D.histoires && D.histoires.ids) || []).slice(),
    lues: (D.histoires && D.histoires.lues) || {}, statuts: (D.histoires && D.histoires.statuts) || {}, offertes: (D.histoires && D.histoires.offertes) || 0 };

  // ---------- Outils ----------
  function esc(s) {
    // Espaces insécables de la typographie française : jamais de « : » ou de « ? » seul en début de ligne
    return String(s == null ? '' : s).replace(/ ([:;?!»])/g, NB + '$1').replace(/« /g, '«' + NB)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function capitale(s) { s = String(s); return s.charAt(0).toUpperCase() + s.slice(1); }
  function dateDe(k) { var p = k.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function cleDe(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function jourMois(k) { var d = dateDe(k); return d.getDate() + (d.getDate() === 1 ? 'er' : '') + NB + MOIS[d.getMonth()]; }
  function titreJour(k) { return SEMAINE[dateDe(k).getDay()] + ' ' + jourMois(k); }
  function heure(t) { var h = D.horaires[t]; return h[0] + NB + 'h' + (h[1] ? NB + pad(h[1]) : ''); }
  function nombre(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, NB); }
  function pluriel(n, mot) { return n + NB + mot + (n > 1 ? 's' : ''); }
  function reste(t) {
    var h = D.horaires[t], cible = new Date(); cible.setHours(h[0], h[1], 0, 0);
    var m = Math.round((cible - new Date()) / 60000);
    if (m <= 0) return '';
    var hh = Math.floor(m / 60), mm = m % 60;
    return 'dans ' + (hh ? hh + NB + 'h' + (mm ? NB + pad(mm) : '') : mm + NB + 'min');
  }
  function identite(t, e) { return t === 'mot' ? e.mot : t === 'date' ? e.annee + '|' + e.evenement : e.nom; }
  function titreDe(t, e) { return t === 'mot' ? e.mot : t === 'date' ? e.annee + ', ' + e.evenement : e.nom; }
  function resumeDe(t, e) { return t === 'mot' ? e.definition : t === 'date' ? e.contexte : e.presentation; }
  function minutes(textes) {
    var n = textes.filter(Boolean).join(' ').split(/\s+/).length;
    return Math.max(1, Math.round(n / 200)) + NB + 'min de lecture';
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

  // ---------- Formes et icônes ----------
  function forme(t, taille, couleur, creux) {
    var s = taille || 12, c = couleur || C[t];
    if (t === 'mot') return '<svg width="' + (s + 2) + '" height="' + s + '" viewBox="0 0 14 13" aria-hidden="true"><polygon points="7,0.8 13.2,12.2 0.8,12.2" ' + (creux ? 'fill="none" stroke="' + c + '" stroke-width="1.6"' : 'fill="' + c + '"') + '></polygon></svg>';
    if (t === 'artiste') return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 14 14" aria-hidden="true"><circle cx="7" cy="7" r="' + (creux ? 5.8 : 6.5) + '" ' + (creux ? 'fill="none" stroke="' + c + '" stroke-width="2"' : 'fill="' + c + '"') + '></circle></svg>';
    if (t === 'histoire') return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 14 14" aria-hidden="true"><path d="M1 13V1a12 12 0 0 1 12 12z" ' + (creux ? 'fill="none" stroke="' + c + '" stroke-width="1.6"' : 'fill="' + c + '"') + '></path></svg>';
    return '<svg width="' + (s - 1) + '" height="' + (s - 1) + '" viewBox="0 0 12 12" aria-hidden="true"><rect x="' + (creux ? 1 : 0) + '" y="' + (creux ? 1 : 0) + '" width="' + (creux ? 10 : 12) + '" height="' + (creux ? 10 : 12) + '" ' + (creux ? 'fill="none" stroke="' + c + '" stroke-width="2"' : 'fill="' + c + '"') + '></rect></svg>';
  }
  function trio(j, taille) {
    return '<svg width="26" height="6" viewBox="0 0 26 6" aria-hidden="true">' +
      '<polygon points="3,0 6,6 0,6" fill="' + (j.lus && j.lus.mot ? C.mot : C.eteint) + '"></polygon>' +
      '<rect x="10" y="0" width="6" height="6" fill="' + (j.lus && j.lus.date ? C.date : C.eteint) + '"></rect>' +
      '<circle cx="23" cy="3" r="2.6" fill="' + (j.lus && j.lus.artiste ? C.artiste : C.eteint) + '"></circle></svg>';
  }
  var I = {
    retour: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2"></path></svg>',
    chevron: '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M5 2l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8"></path></svg>',
    fleche: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2"></path></svg>',
    cadenas: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><rect x="5" y="11" width="14" height="10" fill="none" stroke="#5E5D57" stroke-width="1.8"></rect><path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="#5E5D57" stroke-width="1.8"></path></svg>',
    coche: '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M2 8.5l4 4 8-9" fill="none" stroke="currentColor" stroke-width="2"></path></svg>',
    cocheVerte: '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M2 8.5l4 4 8-9" fill="none" stroke="#157A43" stroke-width="2"></path></svg>',
    croix: '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M3 3l10 10M13 3L3 13" fill="none" stroke="currentColor" stroke-width="2"></path></svg>',
    fermer: '<svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true"><path d="M4 4l12 12M16 4L4 16" stroke="#1A1A1A" stroke-width="2"></path></svg>',
    garder: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M6 3h12v18l-6-5-6 5z" fill="none" stroke="currentColor" stroke-width="1.8"></path></svg>',
    garde: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M6 3h12v18l-6-5-6 5z" fill="currentColor" stroke="currentColor" stroke-width="1.8"></path></svg>',
    partager: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 3v12M7 8l5-5 5 5M5 13v8h14v-8" fill="none" stroke="currentColor" stroke-width="1.8"></path></svg>',
    jouer: '<svg viewBox="0 0 22 22" width="20" height="20" aria-hidden="true"><polygon points="5,2 20,11 5,20" fill="#FFFFFF"></polygon></svg>',
    sortie: '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M4 12L12 4M6 4h6v6" fill="none" stroke="currentColor" stroke-width="1.8"></path></svg>',
    gauche: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="1.8"></path></svg>',
    droite: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="1.8"></path></svg>',
    plus: '<svg class="ouvre" viewBox="0 0 14 14" width="14" height="14" aria-hidden="true"><path d="M7 1v12M1 7h12" stroke="currentColor" stroke-width="1.8"></path></svg>',
    casque: '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M4 15v-3a8 8 0 0 1 16 0v3M4 15h3v5H4zM17 15h3v5h-3z" fill="none" stroke="#5E5D57" stroke-width="2"></path></svg>',
    serie: '<svg viewBox="0 0 14 14" width="14" height="14" aria-hidden="true"><path d="M2 12V8M7 12V5M12 12V2" stroke="#1A1A1A" stroke-width="2" fill="none"></path></svg>',
    info: '<svg viewBox="0 0 22 22" width="20" height="20" aria-hidden="true"><circle cx="11" cy="11" r="9" fill="none" stroke="#1A1A1A" stroke-width="1.8"></circle><path d="M11 10v6M11 6.5v.5" stroke="#1A1A1A" stroke-width="2"></path></svg>'
  };
  function icone(nom, actif) {
    var c = actif ? '#1A1A1A' : '#6B6A64', w = actif ? 2 : 1.7;
    if (nom === 'jour') return '<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.5" fill="' + (actif ? c : 'none') + '" stroke="' + c + '" stroke-width="' + w + '"></circle><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2" stroke="' + c + '" stroke-width="' + w + '"></path></svg>';
    if (nom === 'carnet') return '<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15.5" fill="' + (actif ? c : 'none') + '" stroke="' + c + '" stroke-width="' + w + '"></rect><path d="M3.5 10h17" stroke="' + (actif ? '#FFFFFF' : c) + '" stroke-width="' + w + '"></path><path d="M8 3v4M16 3v4" stroke="' + c + '" stroke-width="' + w + '"></path></svg>';
    if (nom === 'quiz') return '<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" fill="' + (actif ? c : 'none') + '" stroke="' + c + '" stroke-width="' + w + '"></rect><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5V14M12 16.5v.5" fill="none" stroke="' + (actif ? '#FFFFFF' : c) + '" stroke-width="' + w + '"></path></svg>';
    return '<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 20V13M12 20V7M19 20V10M2 20.5h20" stroke="' + c + '" stroke-width="' + (actif ? 2.4 : w) + '" fill="none"></path></svg>';
  }

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
    return { index: i, nom: N[i].nom, seuil: N[i].seuil, points: p, suivant: suivant, manque: suivant ? suivant.seuil - p : 0, part: Math.max(0, Math.min(1, part)) };
  }
  function actif(k) { var j = D.jours[k]; return !!(j && (j.lu || (j.lus && (j.lus.mot || j.lus.date || j.lus.artiste)))); }
  function serie() {
    var d = dateDe(D.aujourdhui);
    if (!actif(D.aujourdhui)) d.setDate(d.getDate() - 1);
    var n = 0;
    while (actif(cleDe(d))) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }

  // ---------- Folles histoires ----------
  // Une offerte au départ, une par quiz de la semaine terminé, une par grade passé.
  function droitsHistoires() {
    return Math.min(H.liste.length, H.offertes + Object.keys(quizFaits).length + niveau().index);
  }
  function attribuer() {
    var vu = {}, nouv = [], droits = droitsHistoires();
    H.ids.forEach(function (id) { vu[id] = true; });
    for (var i = 0; i < H.liste.length && H.ids.length < droits; i++) {
      var id = H.liste[i].id;
      if (!vu[id]) { vu[id] = true; H.ids.push(id); nouv.push(id); }
    }
    return nouv;
  }
  function histoire(id) { for (var i = 0; i < H.liste.length; i++) if (H.liste[i].id === id) return H.liste[i]; return null; }
  function debloquees() { return H.ids.map(histoire).filter(Boolean); }
  function numero(id) { return H.ids.indexOf(id) + 1; }
  function aLire() { return debloquees().filter(function (x) { return !H.lues[x.id]; }); }
  function libelleStatut(x) { return H.statuts[x.statut] || 'Histoire vraie'; }
  function rangHistoire(x, sur) {
    var neuf = !H.lues[x.id];
    return '<button class="rang" data-histoire="' + esc(x.id) + '">' + forme('histoire', 13) +
      '<span><span class="rang-sur">' + esc(sur || ('N°' + NB + numero(x.id) + ' · ' + x.categorie)) + (neuf ? '<span class="nouveau">NOUVEAU</span>' : '') + '</span>' +
      '<span class="rang-titre" style="display:block">' + esc(x.titre) + '</span><span class="rang-texte">' + esc(x.accroche) + '</span></span>' +
      '<span>' + I.chevron + '</span></button>';
  }
  function carteCadeau(ids, intro) {
    if (!ids || !ids.length) return '';
    return '<div class="carte pad apparait"><p class="etiquette" style="display:flex;align-items:center;gap:8px">' + forme('histoire', 12) + esc(intro) + '</p>' +
      '<div class="liste" style="border:0">' + ids.map(function (id) { var x = histoire(id); return x ? rangHistoire(x, 'Folle histoire n°' + NB + numero(id)) : ''; }).join('') + '</div></div>';
  }
  function prochaineHistoire() {
    if (H.ids.length >= H.liste.length) return 'Vous avez débloqué toutes les histoires. Bravo.';
    var s = etatQuizSemaine();
    if (!s.fait) return 'Prochaine histoire : en terminant le quiz de la semaine, ouvert jusqu’au ' + titreJour(D.quizSemaine.prochain) + '.';
    return 'Prochaine histoire : avec le quiz du ' + titreJour(D.quizSemaine.prochain) + ', ou plus tôt en passant au grade suivant.';
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
      q.explication = e.presentation || '';
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
      i: 0, reponses: [], fini: false, nouvelles: []
    };
    etat.onglet = 'quiz';
    etat.fiche = null;
    etat.histoire = null;
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
      var avant = niveau();
      quizFaits[D.quizSemaine.cle] = { score: q.score, total: q.questions.length };
      q.grade = niveau().index > avant.index ? niveau().nom : null;
      q.nouvelles = attribuer();
      pont('quiz', { cle: D.quizSemaine.cle, score: q.score, total: q.questions.length });
    }
  }
  function etatQuizSemaine() {
    var fait = quizFaits[D.quizSemaine.cle], e = D.quizSemaine.entrees;
    return { fait: fait, debut: e.length ? e[0].jour : D.quizSemaine.cle, fin: e.length ? e[e.length - 1].jour : D.quizSemaine.cle };
  }

  // ---------- Écran Aujourd'hui ----------
  function rangMoment(t, k, e) {
    if (!e) {
      var r = reste(t);
      return '<div class="rang">' + forme(t, 14, C[t], true) +
        '<span><span class="rang-sur">' + heure(t) + ' · ' + MOMENTS[t] + '</span><span class="rang-titre eteint" style="display:block">' + (r ? 'Révélé ' + r : 'Bientôt') + '</span></span>' +
        I.cadenas + '</div>';
    }
    var lu = estLu(t, k);
    return '<button class="rang" data-ouvrir="' + t + '|' + k + '">' + forme(t, 14) +
      '<span><span class="rang-sur">' + heure(t) + ' · ' + MOMENTS[t] + '</span><span class="rang-titre" style="display:block">' + esc(t === 'date' ? e.evenement : titreDe(t, e)) + '</span></span>' +
      (lu ? '<span class="lu">' + I.coche + 'Lu</span>' : '<span style="display:inline-flex;align-items:center;gap:4px;font-size:13px;font-weight:600">À lire' + I.chevron + '</span>') + '</button>';
  }
  function carteUne(t, k, e) {
    var lu = estLu(t, k), titre, sous = '', long = false;
    if (t === 'date') { titre = e.annee; sous = e.evenement; long = String(titre).length > 9; }
    else if (t === 'mot') { titre = e.mot; sous = CATEGORIES[e.categorie] || e.categorie || ''; long = String(titre).length > 11; }
    else { titre = e.nom; sous = [e.discipline, e.epoque].filter(Boolean).join(' · '); long = true; }
    var ecoute = e.ecouter && e.ecouter.length ? '<p class="une-plus">' + I.casque + 'Un épisode à écouter : ' + esc(e.ecouter[0].emission || e.ecouter[0].chaine || 'podcast') + '</p>' : '';
    return '<section class="carte une" aria-label="À la une">' +
      '<div class="une-coin" style="background:' + C[t] + '" aria-hidden="true"></div>' +
      '<div class="une-corps"><p class="une-sur">' + forme(t, 11) + heure(t) + ' · ' + NOMS[t] + (lu ? ' · lu' : ' · à lire') + '</p>' +
      '<p class="une-titre' + (long ? ' long' : '') + '">' + esc(titre) + '</p>' +
      (sous ? '<p class="une-sous">' + esc(sous) + '</p>' : '') +
      '<p class="une-resume">' + esc(t === 'date' ? e.contexte : t === 'mot' ? e.definition : e.presentation) + '</p>' + ecoute + '</div>' +
      '<button class="bouton" data-ouvrir="' + t + '|' + k + '">' + (lu ? 'Relire la fiche' : 'Lire la fiche') + I.fleche + '</button></section>';
  }
  function carteAttente() {
    var r = reste('mot'), hier = cleDe(new Date(dateDe(D.aujourdhui).getTime() - 86400000));
    return '<section class="carte une" aria-label="Prochain rendez-vous">' +
      '<div class="une-coin" style="background:' + C.mot + '" aria-hidden="true"></div>' +
      '<div class="une-corps"><p class="une-sur">' + forme('mot', 11) + heure('mot') + ' · ' + NOMS.mot + '</p>' +
      '<p class="une-titre long">Rendez-vous à ' + heure('mot') + '</p>' +
      '<p class="une-resume">' + (r ? 'Le mot du jour sera révélé ' + r + '. ' : '') + 'En attendant, la journée d’hier vous attend dans le carnet.</p></div>' +
      '<button class="bouton" data-revoir="' + hier + '">Revoir hier' + I.fleche + '</button></section>';
  }
  function rangQuiz() {
    var s = etatQuizSemaine();
    if (!D.quizSemaine.entrees.length) return '';
    var texte = s.fait ? s.fait.score + ' / ' + s.fait.total + ' · prochain quiz ' + titreJour(D.quizSemaine.prochain)
      : D.questionsSemaine + ' questions · ouvert jusqu’au ' + jourMois(D.quizSemaine.prochain);
    return '<button class="rang seule" data-onglet="quiz">' + forme('quiz', 13) +
      '<span><span class="rang-titre" style="display:block;font-size:16px">Quiz de la semaine' + (s.fait ? '' : '<span class="nouveau">OUVERT</span>') + '</span><span class="rang-sur" style="font-size:13px">' + esc(texte) + '</span></span>' + I.chevron + '</button>';
  }
  function rangHistoires() {
    if (!H.liste.length) return '';
    var neuves = aLire();
    if (neuves.length) return '<div class="liste">' + rangHistoire(neuves[0], 'Folle histoire à lire') + '</div>';
    return '<button class="rang seule" data-histoires>' + forme('histoire', 13) +
      '<span><span class="rang-titre" style="display:block;font-size:16px">Les folles histoires</span><span class="rang-sur" style="font-size:13px">' +
      H.ids.length + ' sur ' + H.liste.length + ' débloquées · la suivante avec le quiz</span></span>' + I.chevron + '</button>';
  }
  function vueJour() {
    var j = D.jours[D.aujourdhui] || {}, n = niveau(), s = serie(), d = dateDe(D.aujourdhui);
    var reveles = TYPES.filter(function (t) { return j[t]; });
    var une = reveles.length ? reveles[reveles.length - 1] : null;
    var autres = TYPES.filter(function (t) { return t !== une; });
    var entete = '<div class="entete"><div class="marque">' + forme('mot', 10) + forme('date', 10) + forme('artiste', 10) + '<span>Trois fois par jour</span></div>' +
      (s ? '<span class="puce">' + I.serie + (s > 1 ? s + ' jours d’affilée' : '1 jour de lecture') + '</span>' : '') + '</div>';
    var grade = '<div class="carte pad"><div class="grade-ligne"><span class="grade-nom">' + esc(n.nom) + '</span><span class="grade-pts"><strong>' + n.points + '</strong>' +
      (n.suivant ? ' / ' + n.suivant.seuil + ' points' : ' points') + '</span></div>' +
      '<div class="barre" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + Math.round(n.part * 100) + '" aria-label="Progression vers le grade suivant"><i style="width:' + Math.round(n.part * 100) + '%"></i></div>' +
      '<p class="grade-aide">' + (n.suivant ? capitale(n.suivant.nom) + ' dans ' + pluriel(n.manque, 'point') + '. Une fiche lue, un point.' : 'Vous avez atteint le plus haut grade.') + '</p></div>';
    return '<main class="ecran">' + entete +
      '<h1 class="page">' + capitale(SEMAINE[d.getDay()]) + ' ' + jourMois(D.aujourdhui) + '</h1>' + grade +
      (une ? carteUne(une, D.aujourdhui, j[une]) : carteAttente()) +
      '<div><p class="etiquette">' + (une ? 'Le reste de la journée' : 'Aujourd’hui') + '</p><div class="liste">' +
        (une ? autres : TYPES.slice(1)).map(function (t) { return rangMoment(t, D.aujourdhui, j[t]); }).join('') + '</div></div>' +
      rangQuiz() + rangHistoires() + '</main>';
  }

  // ---------- Écran Carnet ----------
  function rangCarnet(t, k, e, sur) {
    var lu = estLu(t, k);
    return '<button class="rang" data-ouvrir="' + t + '|' + k + '">' + forme(t, 14) +
      '<span><span class="rang-sur">' + esc(sur) + (lu ? '' : ' · non lu') + '</span><span class="rang-titre" style="display:block">' + esc(titreDe(t, e)) + '</span></span>' +
      (lu ? I.cocheVerte : I.chevron) + '</button>';
  }
  function vueCalendrier() {
    var cles = Object.keys(D.jours).sort();
    if (!etat.choisi) etat.choisi = (D.jours[D.aujourdhui] && D.jours[D.aujourdhui].mot) || cles.length < 2 ? D.aujourdhui : cles[cles.length - 2];
    if (!etat.mois) etat.mois = etat.choisi.slice(0, 7);
    var an = +etat.mois.slice(0, 4), mo = +etat.mois.slice(5, 7) - 1;
    var decalage = (new Date(an, mo, 1).getDay() + 6) % 7, nb = new Date(an, mo + 1, 0).getDate(), cases = '';
    for (var i = 0; i < decalage; i++) cases += '<span></span>';
    for (var d = 1; d <= nb; d++) {
      var k = an + '-' + pad(mo + 1) + '-' + pad(d), j = D.jours[k];
      if (!j || !(j.mot || j.date || j.artiste)) {
        cases += '<span class="jour ' + (k > D.aujourdhui ? 'futur' : 'hors') + '"><span class="num">' + d + '</span><span class="pts"></span></span>';
        continue;
      }
      var lib = jourMois(k) + (k === D.aujourdhui ? ', aujourd’hui' : '') + (k === etat.choisi ? ', sélectionné' : '');
      cases += '<button class="jour' + (k === etat.choisi ? ' choisi' : '') + (k === D.aujourdhui ? ' auj' : '') + '" data-jour="' + k + '" aria-label="' + esc(lib) + '">' +
        '<span class="num">' + d + '</span><span class="pts">' + trio(j) + '</span></button>';
    }
    var min = D.debut.slice(0, 7), max = D.aujourdhui.slice(0, 7), jour = D.jours[etat.choisi] || {};
    var lignes = TYPES.filter(function (t) { return jour[t]; }).map(function (t) { return rangCarnet(t, etat.choisi, jour[t], heure(t) + ' · ' + COURTS[t]); }).join('');
    return '<div class="carte cal"><div class="cal-mois">' +
        '<button class="fleche" data-mois="-1" aria-label="Mois précédent"' + (etat.mois <= min ? ' disabled' : '') + '>' + I.gauche + '</button>' +
        '<strong>' + capitale(MOIS[mo]) + ' ' + an + '</strong>' +
        '<button class="fleche" data-mois="1" aria-label="Mois suivant"' + (etat.mois >= max ? ' disabled' : '') + '>' + I.droite + '</button></div>' +
      '<div class="cal-sem" aria-hidden="true"><span>L</span><span>M</span><span>M</span><span>J</span><span>V</span><span>S</span><span>D</span></div>' +
      '<div class="cal-grille">' + cases + '</div>' +
      '<div class="legende"><span>' + forme('mot', 8) + 'Mot lu</span><span>' + forme('date', 9) + 'Date lue</span><span>' + forme('artiste', 8) + 'Artiste lu</span></div></div>' +
      '<div><p class="etiquette">' + capitale(titreJour(etat.choisi)) + '</p>' +
      (lignes ? '<div class="liste">' + lignes + '</div>' : '<div class="liste vide">Rien n’a encore été révélé ce jour-là.</div>') + '</div>' +
      (cles.length <= 1 ? '<p class="texte-doux">Votre carnet se remplit jour après jour. Dès demain, vous y retrouverez ce que vous avez appris aujourd’hui.</p>' : '');
  }
  function vueGardes() {
    var html = favoris.slice().reverse().map(function (f) { return rangCarnet(f.type, f.jour, f.entree, COURTS[f.type] + ', ' + titreJour(f.jour)); }).join('');
    return html ? '<div class="liste">' + html + '</div>' : '<div class="liste vide">Touchez l’icône marque-page d’une fiche pour la retrouver ici.</div>';
  }
  function vueHistoires() {
    if (!H.liste.length) return '<div class="liste vide">Les folles histoires n’ont pas pu être chargées. Vérifiez la connexion, et que le fichier histoires.json est bien sur GitHub.</div>';
    var faites = debloquees(), total = H.liste.length, neufs = {};
    aLire().forEach(function (x) { neufs[x.id] = true; });
    var cases = '';
    for (var i = 0; i < total; i++) {
      var id = H.ids[i];
      cases += '<i class="' + (id ? (neufs[id] ? 'neuf' : 'ok') : '') + '"></i>';
    }
    var tete = '<div class="carte pad"><p style="font:500 22px/1.2 var(--titre)">Les folles histoires</p><p class="texte-doux">dénichées sur Wikipédia, racontées pour vous</p>' +
      '<div class="compte"><strong>' + faites.length + '</strong><span>' + (faites.length > 1 ? 'histoires' : 'histoire') + ' sur ' + total + '</span></div>' +
      '<div class="collection" role="img" aria-label="' + faites.length + ' histoires débloquées sur ' + total + '">' + cases + '</div>' +
      '<div style="margin-top:14px"><p class="regle">' + forme('quiz', 12) + '<span>Une histoire à chaque quiz de la semaine terminé.</span></p>' +
      '<p class="regle">' + forme('date', 12, C.encre, true) + '<span>Une histoire en bonus à chaque nouveau grade.</span></p>' +
      '<p class="regle">' + forme('histoire', 12) + '<span>' + esc(prochaineHistoire()) + '</span></p></div></div>';
    var liste = faites.length ? '<div><p class="etiquette">Votre collection</p><div class="liste">' + faites.slice().reverse().map(function (x) { return rangHistoire(x); }).join('') + '</div></div>' : '';
    return tete + liste;
  }
  function vueCarnet() {
    var choix = [['calendrier', 'Calendrier'], ['gardes', 'Gardés (' + favoris.length + ')'], ['histoires', 'Histoires']];
    var bascule = '<div class="bascule" role="group" aria-label="Affichage du carnet">' + choix.map(function (c) {
      return '<button data-carnet="' + c[0] + '" aria-pressed="' + (etat.vueCarnet === c[0]) + '">' + c[1] + '</button>';
    }).join('') + '</div>';
    var contenu = etat.vueCarnet === 'gardes' ? vueGardes() : etat.vueCarnet === 'histoires' ? vueHistoires() : vueCalendrier();
    return '<main class="ecran"><h1 class="page">Carnet</h1>' + bascule + contenu + '</main>';
  }

  // ---------- Écran Quiz ----------
  function vueQuestion() {
    var q = etat.quiz, cour = q.questions[q.i], rep = q.reponses[q.i], repondu = rep != null;
    var barre = '<div class="q-barre" aria-hidden="true" style="grid-template-columns: repeat(' + q.questions.length + ', minmax(0, 1fr))">' +
      q.questions.map(function (x, i) { return '<i class="' + (q.reponses[i] == null ? (i === q.i ? 'ici' : '') : x.juste ? 'ok' : 'ko') + '"></i>'; }).join('') + '</div>';
    var opts = cour.options.map(function (o, n) {
      var cls = 'option', signe = '<span></span>';
      if (repondu) {
        if (o.bon) { cls += ' bonne'; signe = '<span role="img" aria-label="Bonne réponse">' + I.coche + '</span>'; }
        else if (n === rep) { cls += ' fausse'; signe = '<span role="img" aria-label="Votre réponse, incorrecte">' + I.croix + '</span>'; }
        else cls += ' terne';
      }
      return '<button class="' + cls + '" data-rep="' + n + '"' + (repondu ? ' disabled' : '') + '><span class="lettre">' + 'ABC'.charAt(n) + '</span><span>' + esc(o.texte) + '</span>' + signe + '</button>';
    }).join('');
    var bonne = cour.options.filter(function (o) { return o.bon; })[0].texte;
    var verdict = repondu ? '<div class="verdict" aria-live="polite"><strong>' + (cour.juste ? 'Exact.' : 'Pas tout à fait : ' + esc(bonne) + '.') + '</strong>' +
      (cour.explication ? '<p>' + esc(cour.explication) + '</p>' : '') + '</div>' +
      '<button class="bouton centre bas" data-suivante>' + (q.i + 1 < q.questions.length ? 'Question suivante' : 'Voir le résultat') + I.fleche + '</button>' : '';
    return '<main class="ecran focus"><div class="q-tete"><button class="fermer" data-quitter aria-label="Quitter le quiz">' + I.fermer + '</button>' +
      '<span>' + (q.mode === 'semaine' ? 'Quiz de la semaine' : 'Révision') + '</span><span>' + (q.i + 1) + '/' + q.questions.length + '</span></div>' + barre +
      '<p class="q-sur">' + forme(cour.type, 11) + COURTS[cour.type] + ' du ' + titreJour(cour.jour) + '</p>' +
      '<h1 class="q-enonce">' + esc(cour.enonce) + '</h1>' + (cour.citation ? '<p class="q-citation">' + esc(cour.citation) + '</p>' : '') +
      '<div class="options">' + opts + '</div>' + verdict + '</main>';
  }
  function vueResultat() {
    var q = etat.quiz, n = q.questions.length;
    var message = q.score === n ? 'Sans faute.' : q.score >= n * 0.7 ? 'Très bien retenu.' : q.score >= n * 0.4 ? 'Une bonne base. Le carnet vous aidera pour le reste.' : 'Les fiches de la semaine sont dans le carnet, pour une seconde lecture.';
    var ratees = q.questions.filter(function (x) { return !x.juste; });
    var note = q.compte ? pluriel(q.score, 'point') + ' ajouté' + (q.score > 1 ? 's' : '') + ' à votre jauge.' : q.mode === 'semaine' ? 'Quiz déjà compté cette semaine : cette partie ne rapporte pas de points.' : 'La révision ne rapporte pas de points.';
    return '<main class="ecran focus"><div class="q-tete"><button class="fermer" data-quitter aria-label="Fermer">' + I.fermer + '</button><span>' + (q.mode === 'semaine' ? 'Quiz de la semaine' : 'Révision') + '</span><span></span></div>' +
      '<div class="carte pad"><p class="score">' + q.score + '<small> / ' + n + '</small></p><p class="lead" style="margin-top:10px">' + message + '</p>' +
      '<p class="texte-doux" style="margin-top:6px">' + note + (q.grade ? ' Nouveau grade : ' + esc(q.grade) + '.' : '') + '</p></div>' +
      carteCadeau(q.nouvelles, q.nouvelles.length > 1 ? 'Vous débloquez ' + q.nouvelles.length + ' folles histoires' : 'Vous débloquez une folle histoire') +
      (ratees.length ? '<div><p class="etiquette">À relire</p><div class="liste">' + ratees.map(function (x) { return rangCarnet(x.type, x.jour, x.entree, COURTS[x.type] + ', ' + titreJour(x.jour)); }).join('') + '</div></div>' : '') +
      '<button class="bouton centre bas" data-quitter>Terminer</button></main>';
  }
  function vueQuiz() {
    if (etat.quiz) return etat.quiz.fini ? vueResultat() : vueQuestion();
    var s = etatQuizSemaine(), items = D.quizSemaine.entrees;
    var recompense = '<p class="recompense">' + forme('histoire', 11) + 'Récompense : un point par bonne réponse et une folle histoire.</p>';
    var semaine = !items.length ? '' : s.fait
      ? '<div class="carte pad"><p class="etiquette" style="display:flex;align-items:center;gap:8px">' + forme('quiz', 12) + 'Quiz de la semaine · terminé</p>' +
        '<p class="score" style="font-size:44px">' + s.fait.score + '<small> / ' + s.fait.total + '</small></p>' +
        '<p class="texte-doux" style="margin-top:8px">Prochain quiz ' + titreJour(D.quizSemaine.prochain) + ', à ' + heure('mot') + '.</p>' +
        '<button class="bouton clair centre" style="margin-top:14px" data-quiz="semaine">Le refaire, sans points</button></div>'
      : '<div class="carte pad"><p class="etiquette" style="display:flex;align-items:center;gap:8px">' + forme('quiz', 12) + 'Quiz de la semaine</p>' +
        '<p style="font:500 26px/1.15 var(--titre)">' + D.questionsSemaine + ' questions</p>' +
        '<p class="texte-doux" style="margin-top:6px">Sur les mots, les dates et les artistes du ' + jourMois(s.debut) + ' au ' + jourMois(s.fin) + '. Ouvert jusqu’au ' + titreJour(D.quizSemaine.prochain) + '.</p>' +
        recompense + '<button class="bouton vert" style="margin-top:14px" data-quiz="semaine">Commencer' + I.fleche + '</button></div>';
    var dispo = entreesCarnet().length;
    var revision = '<div class="carte pad"><p class="etiquette">Révision libre</p><p class="texte-doux">' + Math.min(D.questionsRevision, dispo) +
      ' questions tirées de votre carnet, à tout moment. Elles ne rapportent pas de points.</p>' +
      '<button class="bouton" style="margin-top:14px" data-quiz="revision"' + (dispo ? '' : ' disabled') + '>Réviser maintenant' + I.fleche + '</button></div>';
    var passes = Object.keys(quizFaits).sort().reverse();
    var hist = passes.length ? '<div><p class="etiquette">Vos quiz</p><div class="liste historique">' + passes.map(function (k) {
      return '<div><span>' + capitale(titreJour(k)) + '</span><strong>' + quizFaits[k].score + ' / ' + quizFaits[k].total + '</strong></div>';
    }).join('') + '</div></div>' : '';
    return '<main class="ecran"><h1 class="page">Quiz</h1><p class="sous-page">Chaque dimanche, la semaine en questions</p>' + semaine + revision + hist + '</main>';
  }

  // ---------- Écran Progrès ----------
  function vueProgres() {
    var n = niveau(), l = fichesLues(), s = serie(), N = D.niveaux, max = N[N.length - 1].seuil;
    var part = Math.min(1, n.points / max), milieu = N.length > 2 ? N[1].seuil / max : 0.5;
    var chemin = '<div class="chemin" aria-hidden="true"><div class="chemin-piste"></div><div class="chemin-fait" style="width:calc((100% - 14px) * ' + part.toFixed(3) + ')"></div>' +
      '<span class="chemin-pas" style="left:0">' + forme('mot', 13) + '</span>' +
      '<span class="chemin-pas" style="left:calc(7px + (100% - 14px) * ' + milieu.toFixed(3) + ' - 6px);top:7px">' + forme('date', 13, C.date, n.index < 1) + '</span>' +
      '<span class="chemin-pas" style="right:0">' + forme('artiste', 14, C.artiste, n.index < 2) + '</span></div>' +
      '<div class="chemin-noms">' + N.map(function (x) { return '<span>' + esc(x.nom) + ' · ' + x.seuil + '</span>'; }).join('') + '</div>';
    var auj = dateDe(D.aujourdhui), sept = '';
    for (var i = 6; i >= 0; i--) {
      var d = new Date(auj); d.setDate(d.getDate() - i);
      var jj = D.jours[cleDe(d)] || {}, lu = jj.lus || {};
      sept += '<div>' + forme('mot', 9, lu.mot ? C.mot : C.eteint) + forme('date', 10, lu.date ? C.date : C.eteint) + forme('artiste', 9, lu.artiste ? C.artiste : C.eteint) +
        '<span' + (i === 0 ? ' class="auj"' : '') + ' style="margin-top:2px">' + INITIALES[d.getDay()] + '</span></div>';
    }
    var stat = function (t, v, lib) { return '<div class="carte stat">' + forme(t, 12) + '<strong>' + v + '</strong><span>' + lib + '</span></div>'; };
    var pq = pointsQuiz();
    return '<main class="ecran"><h1 class="page">Progrès</h1>' +
      '<div class="carte pad"><p class="etiquette" style="margin:0">Votre grade</p><p class="grade-grand">' + esc(n.nom) + '</p>' + chemin +
      '<p style="margin-top:12px;font-size:15px"><strong>' + pluriel(n.points, 'point') + '.</strong> ' + (n.suivant ? 'Encore ' + n.manque + ' pour devenir ' + n.suivant.nom.toLowerCase() + '.' : 'Vous avez atteint le plus haut grade.') + '</p></div>' +
      '<div class="stats">' + stat('mot', l.mot, l.mot > 1 ? 'mots lus' : 'mot lu') + stat('date', l.date, l.date > 1 ? 'dates lues' : 'date lue') +
        stat('artiste', l.artiste, l.artiste > 1 ? 'artistes lus' : 'artiste lu') + stat('quiz', pq, pq > 1 ? 'points de quiz' : 'point de quiz') + '</div>' +
      '<div class="carte pad"><div class="grade-ligne"><span style="font-size:15px;font-weight:600">Cette semaine</span><span class="grade-pts">' +
        (s > 1 ? s + ' jours d’affilée' : s === 1 ? '1 jour de lecture' : 'Pas encore de série') + '</span></div><div class="semaine">' + sept + '</div></div>' +
      (H.liste.length ? '<button class="rang seule" data-histoires>' + forme('histoire', 13) + '<span><span class="rang-titre" style="display:block;font-size:16px">Les folles histoires</span>' +
        '<span class="rang-sur" style="font-size:13px">' + H.ids.length + ' sur ' + H.liste.length + ' débloquées</span></span>' + I.chevron + '</button>' : '') +
      '<div class="carte"><details class="volet"><summary>Comment gagner des points' + I.plus + '</summary><div class="contenu"><ul>' +
        '<li>Une fiche lue : 1 point.</li><li>Une bonne réponse au quiz de la semaine : 1 point.</li>' +
        N.map(function (x) { return '<li>' + esc(x.nom) + ' : dès ' + pluriel(x.seuil, 'point') + '.</li>'; }).join('') +
        '<li>Une folle histoire à chaque quiz de la semaine terminé, et une en bonus à chaque nouveau grade.</li></ul></div></details></div></main>';
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
  function taille(t, texte) {
    var n = String(texte).length;
    if (t === 'date') return n > 6 ? 56 : 92;
    if (t === 'artiste') return Math.max(34, Math.min(58, Math.floor(620 / Math.max(n, 8))));
    if (t === 'histoire') return 34;
    return Math.max(38, Math.min(76, Math.floor(560 / Math.max(n, 5))));
  }
  function bloc(titre, contenu) { return contenu ? '<div class="bloc"><p class="etiquette">' + esc(titre) + '</p>' + contenu + '</div>' : ''; }
  function volet(titre, contenu) {
    if (!contenu) return '';
    return '<details class="volet"><summary>' + esc(titre) + I.plus + '</summary><div class="contenu">' + contenu + '</div></details>';
  }
  function liste(items) { return items && items.length ? '<ul>' + items.map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('') + '</ul>' : ''; }
  function lien(url, sur, titre) { return '<a class="lire" href="' + esc(url) + '"><span><small>' + esc(sur) + '</small><strong>' + esc(titre) + '</strong></span>' + I.sortie + '</a>'; }
  function blocEcoute(e) {
    if (!e.ecouter || !e.ecouter.length) return '';
    return bloc('À écouter', e.ecouter.map(function (c) {
      return '<a class="ecoute" href="' + esc(c.url) + '"><span class="ecoute-jouer">' + I.jouer + '</span><span><small>' + esc([c.emission, c.chaine].filter(Boolean).join(' · ')) + '</small><strong>' + esc(c.titre) + '</strong></span></a>';
    }).join(''));
  }
  function zoneWiki(t, k, partie, classe) { return '<div class="' + (classe || '') + '" data-wiki="' + t + '|' + k + '" data-part="' + partie + '"></div>'; }
  function corpsMot(e, k) {
    var lemme = e.lemme || String(e.mot).toLowerCase();
    var nature = CATEGORIES[e.categorie] || e.categorie || '';
    return '<div class="meta">' + (nature ? '<span class="tag">' + esc(nature) + '</span>' : '') + '<span class="temps">' + minutes([e.definition, e.exemple, e.piege].concat(e.situations || [])) + '</span></div>' +
      '<p class="lead">' + esc(e.definition) + '</p>' +
      (e.exemple ? '<p class="citation">« ' + esc(e.exemple) + ' »</p>' : '') +
      (e.synonymes && e.synonymes.length ? bloc('Synonymes', '<div class="mots">' + e.synonymes.map(function (s) { return '<span>' + esc(s) + '</span>'; }).join('') + '</div>') : '') +
      blocEcoute(e) +
      bloc('À lire', lien('https://www.cnrtl.fr/definition/' + encodeURIComponent(lemme), 'CNRTL, trésor de la langue française', e.mot + ' : définition et étymologie') +
        volet('En situation', liste(e.situations)) + volet('La nuance', e.piege ? '<p>' + esc(e.piege) + '</p>' : ''));
  }
  function corpsDate(e, k) {
    var ecart = ilYa(e.annee);
    return '<div><h1>' + esc(e.evenement) + '</h1><div class="meta" style="margin-top:12px">' + (ecart ? '<span class="tag">' + ecart + '</span>' : '') +
      '<span class="temps">' + minutes([e.contexte, e.recit]) + '</span></div></div>' +
      '<p class="lead">' + esc(e.contexte) + '</p>' +
      (e.recit ? '<p class="texte">' + esc(e.recit) + '</p>' : '') +
      zoneWiki('date', k, 'image', 'visuel') +
      blocEcoute(e) +
      '<div class="bloc"><p class="etiquette" style="margin-bottom:4px">À lire</p>' + zoneWiki('date', k, 'lire') +
        volet('Le résumé de Wikipédia', zoneWiki('date', k, 'extrait')) + '</div>';
  }
  function corpsArtiste(e, k) {
    var meta = [e.discipline, e.pays, e.epoque].filter(Boolean).join(' · ');
    var mv = e.mouvement || {};
    return '<div class="meta">' + (meta ? '<span class="tag">' + esc(meta) + '</span>' : '') + '<span class="temps">' + minutes([e.presentation, e.bio, mv.texte]) + '</span></div>' +
      '<p class="lead">' + esc(e.presentation) + '</p>' +
      zoneWiki('artiste', k, 'galerie', 'galerie') +
      (e.oeuvre ? bloc('Pour commencer', '<p class="texte" style="font-weight:600">' + esc(e.oeuvre) + '</p>') : '') +
      (e.bio ? bloc('Sa vie', '<p class="texte">' + esc(e.bio) + '</p>') : '') +
      blocEcoute(e) +
      '<div class="bloc"><p class="etiquette" style="margin-bottom:4px">À lire</p>' + zoneWiki('artiste', k, 'lire') +
        volet('Œuvres clés', liste(e.oeuvres_cles || (e.oeuvre ? [e.oeuvre] : []))) +
        (mv.nom ? volet('Le courant : ' + mv.nom, '<p>' + esc(mv.texte) + '</p>') : '') +
        volet('Le résumé de Wikipédia', zoneWiki('artiste', k, 'extrait')) + '</div>';
  }
  function heroFiche(t, sur, titreHTML, fav, avecGarder) {
    return '<header class="hero h-' + t + '"><div class="hero-coin" style="background:' + CORNE[t] + '" aria-hidden="true"></div>' +
      '<div class="hero-barre"><button class="carre" data-fermer aria-label="Revenir">' + I.retour + '</button><div class="hero-actions">' +
      (avecGarder ? '<button class="carre" data-favori aria-pressed="' + fav + '" aria-label="' + (fav ? 'Retirer des gardés' : 'Garder dans le carnet') + '">' + (fav ? I.garde : I.garder) + '</button>' : '') +
      '<button class="carre" data-partager aria-label="Partager">' + I.partager + '</button></div></div>' +
      '<p class="hero-sur">' + sur + '</p><div class="hero-titre">' + titreHTML + '</div></header>';
  }
  function vueFiche() {
    var f = etat.fiche, t = f.type, e = entreeDe(t, f.cle);
    if (!e) { etat.fiche = null; return null; }
    var n = niveau(), fav = estFavori(t, e);
    var brut = t === 'mot' ? e.mot : t === 'date' ? String(e.annee).replace(/^vers\s+/, '') : e.nom;
    var vers = t === 'date' && /^vers\s/.test(String(e.annee));
    var titreHTML = (vers ? '<small>vers</small>' : '') + '<span style="font-size:' + taille(t, brut) + 'px">' + esc(brut) + '</span>';
    var sur = NOMS[t] + ' · ' + heure(t) + (f.cle !== D.aujourdhui ? ' · ' + jourMois(f.cle) : '');
    var contenu = t === 'mot' ? corpsMot(e, f.cle) : t === 'date' ? corpsDate(e, f.cle) : corpsArtiste(e, f.cle);
    var cadeau = f.nouvelles && f.nouvelles.length ? '<button class="cadeau apparait" data-histoire="' + esc(f.nouvelles[0]) + '">' + forme('histoire', 14) +
      '<span><span class="rang-sur">Nouveau grade : ' + esc(n.nom) + '</span><span class="rang-titre" style="display:block;font-size:16px">Une folle histoire débloquée</span></span>' + I.chevron + '</button>' : '';
    return '<article class="fiche">' + heroFiche(t, sur, titreHTML, fav, true) +
      '<div class="corps">' + contenu + '</div>' + cadeau +
      '<footer class="pied"><span class="pied-gauche">' + I.cocheVerte + (f.nouveau ? 'Fiche lue · +1 point' : 'Fiche déjà lue') + '</span>' +
      '<span class="pied-droite"><span class="mini"><i style="width:' + Math.round(n.part * 100) + '%"></i></span>' + n.points + (n.suivant ? ' / ' + n.suivant.seuil : '') + '</span></footer></article>';
  }

  // ---------- Histoire ----------
  function vueHistoire() {
    var x = histoire(etat.histoire);
    if (!x) { etat.histoire = null; return null; }
    var no = numero(x.id), suivantes = aLire().filter(function (y) { return y.id !== x.id; });
    var titreHTML = '<span style="font-size:' + (x.titre.length > 34 ? 30 : 36) + 'px;line-height:1.08;letter-spacing:-0.01em">' + esc(x.titre) + '</span>';
    var sur = 'Folle histoire n°' + NB + no + ' · ' + esc(x.categorie);
    var meta = '<div class="meta"><span class="statut st-' + esc(x.statut) + '">' + esc(libelleStatut(x)) + '</span>' +
      '<span class="temps">' + esc([x.annee, x.lieu].filter(Boolean).join(' · ')) + ' · ' + minutes([x.recit]) + '</span></div>';
    return '<article class="fiche">' + heroFiche('histoire', sur, titreHTML, false, false) +
      '<div class="corps">' + meta + '<p class="lead">' + esc(x.accroche) + '</p><p class="texte">' + esc(x.recit) + '</p>' +
      '<div class="avis">' + I.info + '<p><strong>Vrai ou faux ?</strong>' + esc(x.statut_texte) + '</p></div>' +
      bloc('Pour aller plus loin', lien(x.article.url, 'Wikipédia', x.article.titre) +
        '<p class="texte-doux" style="margin-top:6px;font-size:13px">Histoire racontée par Trois fois par jour à partir de cet article.</p>') + '</div>' +
      (suivantes.length ? '<button class="cadeau" data-histoire="' + esc(suivantes[0].id) + '">' + forme('histoire', 14) +
        '<span><span class="rang-sur">Encore une à lire</span><span class="rang-titre" style="display:block;font-size:16px">' + esc(suivantes[0].titre) + '</span></span>' + I.chevron + '</button>' : '') +
      '<footer class="pied"><span class="pied-gauche">' + forme('histoire', 14) + 'Histoire ' + no + ' sur ' + H.liste.length + '</span>' +
      '<button class="pied-droite" data-histoires style="color:#1A1A1A;font-weight:600">Collection' + I.chevron + '</button></footer></article>';
  }
  function ouvrirHistoire(id) {
    if (!histoire(id) || H.ids.indexOf(id) < 0) return;
    if (!H.lues[id]) { H.lues[id] = true; pont('histoire', { id: id }); }
    etat.histoire = id;
    etat.fiche = null;
    rendre();
  }

  // ---------- Rendu ----------
  function barre() {
    var onglets = [['jour', 'Aujourd’hui'], ['carnet', 'Carnet'], ['quiz', 'Quiz'], ['progres', 'Progrès']];
    return '<nav class="nav" aria-label="Navigation">' + onglets.map(function (o) {
      var a = etat.onglet === o[0];
      return '<button data-onglet="' + o[0] + '"' + (a ? ' aria-current="page"' : '') + '>' + icone(o[0], a) + '<span>' + o[1] + '</span></button>';
    }).join('') + '</nav>';
  }
  function vueOnglet() {
    return etat.onglet === 'carnet' ? vueCarnet() : etat.onglet === 'quiz' ? vueQuiz() : etat.onglet === 'progres' ? vueProgres() : vueJour();
  }
  function rendre(garderDefilement) {
    var app = document.getElementById('app');
    var y = garderDefilement ? window.scrollY : 0;
    var plein = etat.histoire ? vueHistoire() : etat.fiche ? vueFiche() : null;
    if (plein) {
      app.innerHTML = plein;
      window.scrollTo(0, y);
      if (etat.fiche) { demander(etat.fiche.type, etat.fiche.cle); remplir(); }
      return;
    }
    var focus = etat.onglet === 'quiz' && etat.quiz;
    app.innerHTML = vueOnglet() + (focus ? '' : barre());
    window.scrollTo(0, y);
  }
  function ouvrir(t, k) {
    var nouveau = !estLu(t, k), nouvelles = [];
    if (nouveau) {
      var avant = niveau().index;
      D.jours[k] = D.jours[k] || {};
      D.jours[k].lus = D.jours[k].lus || {};
      D.jours[k].lus[t] = true;
      if (niveau().index > avant) nouvelles = attribuer();
      pont('lire', { cle: k, type: t });
    }
    etat.fiche = { type: t, cle: k, nouveau: nouveau, nouvelles: nouvelles };
    etat.histoire = null;
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
      var z = zones[i], w = wiki[z.getAttribute('data-wiki')], partie = z.getAttribute('data-part');
      if (!w) { if (partie === 'extrait' || partie === 'lire') z.innerHTML = '<p class="attente">Chargement…</p>'; continue; }
      if (partie === 'image') {
        z.innerHTML = w.image ? '<img src="' + esc(w.image) + '" alt=""><p>Image libre de droits · Wikipédia</p>' : '';
      } else if (partie === 'galerie') {
        z.innerHTML = w.galerie && w.galerie.length ? w.galerie.map(function (g) {
          return '<figure><img src="' + esc(g.src) + '" alt="' + esc(g.legende) + '" loading="lazy">' + (g.legende ? '<figcaption>' + esc(g.legende) + '</figcaption>' : '') + '</figure>';
        }).join('') : '';
      } else if (partie === 'lire') {
        z.innerHTML = w.url ? lien(w.url, 'Wikipédia', w.titre) : '<p class="attente">Wikipédia n’est pas joignable pour le moment.</p>';
      } else {
        z.innerHTML = w.extrait
          ? '<p>' + esc(w.extrait) + '</p><p class="source">Source : Wikipédia, article « ' + esc(w.titre) + ' »</p>'
          : '<p class="attente">Le résumé n’est pas disponible pour le moment. Vérifiez la connexion, puis rouvrez la fiche.</p>';
      }
    }
  }

  // ---------- Partage et favoris ----------
  function texteAPartager() {
    var signature = '\n\nDécouvert avec Trois fois par jour : ' + D.depot;
    if (etat.histoire) {
      var x = histoire(etat.histoire);
      return x.titre + '\n' + x.accroche + ' (' + libelleStatut(x).toLowerCase() + ')\nÀ lire : ' + x.article.url + signature;
    }
    var f = etat.fiche, t = f.type, e = entreeDe(t, f.cle);
    if (t === 'mot') return e.mot + ' (' + (CATEGORIES[e.categorie] || e.categorie || '') + ') : ' + e.definition + (e.exemple ? '\n« ' + e.exemple + ' »' : '') + signature;
    if (t === 'date') return e.annee + ', ' + e.evenement + '. ' + e.contexte + signature;
    return e.nom + ' (' + [e.discipline, e.epoque].filter(Boolean).join(', ') + '). ' + e.presentation + (e.oeuvre ? '\nÀ découvrir : ' + e.oeuvre : '') + signature;
  }
  function basculerFavori() {
    var f = etat.fiche, e = entreeDe(f.type, f.cle), id = identite(f.type, e), actifFav = !estFavori(f.type, e);
    favoris = favoris.filter(function (x) { return !(x.type === f.type && x.id === id); });
    if (actifFav) favoris.push({ type: f.type, id: id, jour: f.cle, entree: e });
    pont('favoris', { liste: favoris });
    rendre(true);
  }

  // ---------- Interactions ----------
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-onglet],[data-ouvrir],[data-fermer],[data-jour],[data-mois],[data-favori],[data-partager],[data-carnet],[data-quiz],[data-rep],[data-suivante],[data-quitter],[data-histoire],[data-histoires],[data-revoir]');
    if (!b || b.disabled) return;
    if (b.hasAttribute('data-onglet')) {
      etat.onglet = b.getAttribute('data-onglet'); etat.fiche = null; etat.histoire = null;
      if (etat.onglet !== 'quiz' && etat.quiz && etat.quiz.fini) etat.quiz = null;
      rendre();
    } else if (b.hasAttribute('data-ouvrir')) {
      var p = b.getAttribute('data-ouvrir').split('|');
      ouvrir(p[0], p[1]);
    } else if (b.hasAttribute('data-histoire')) {
      if (etat.quiz && etat.quiz.fini) { etat.quiz = null; etat.onglet = 'carnet'; etat.vueCarnet = 'histoires'; }
      ouvrirHistoire(b.getAttribute('data-histoire'));
    } else if (b.hasAttribute('data-histoires')) {
      etat.onglet = 'carnet'; etat.vueCarnet = 'histoires'; etat.fiche = null; etat.histoire = null; rendre();
    } else if (b.hasAttribute('data-revoir')) {
      etat.onglet = 'carnet'; etat.vueCarnet = 'calendrier'; etat.choisi = b.getAttribute('data-revoir'); etat.mois = etat.choisi.slice(0, 7); rendre();
    } else if (b.hasAttribute('data-fermer')) {
      etat.fiche = null; etat.histoire = null; rendre();
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
      pont('partager', { texte: texteAPartager() });
    }
  });

  // Un tap sur le widget ouvre la fiche qu'il affiche ; sinon, l'écran Aujourd'hui
  if (D.ouvrir && entreeDe(D.ouvrir.type, D.ouvrir.cle)) ouvrir(D.ouvrir.type, D.ouvrir.cle); else rendre();
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
  // Toucher le widget ouvre directement la fiche qu'il affiche
  w.url = `${URLScheme.forRunningScript()}?type=${moment.type}&jour=${cle(moment.jour)}`
  w.refreshAfterDate = prochainChangement(maintenant)
  Script.setWidget(w)
} else {
  const [mots, dates, artistes, recueil] = await Promise.all([charger("mot"), charger("date"), charger("artiste"), chargerHistoires()])
  const listes = { mot: mots, date: dates, artiste: artistes }
  const histoires = recueil.histoires || []
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
  attribuerHistoires(h, histoires)
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

  // Ouverture depuis le widget : la fiche qu'il affichait
  const demande = args.queryParameters || {}
  let ouvrir = null
  if (TYPES.includes(demande.type) && /^\d{4}-\d{2}-\d{2}$/.test(demande.jour || "") && demande.jour <= cleAujourdhui) {
    ouvrir = { type: demande.type, cle: demande.jour }
  }

  const donnees = {
    horaires: HORAIRES,
    aujourdhui: cleAujourdhui,
    debut: h.debut,
    ouvrir,
    jours,
    listes,
    niveaux: NIVEAUX,
    quiz: h.quiz,
    quizSemaine: { cle: cle(dimanche), prochain: cle(decaler(dimanche, 7)), entrees: entreesQuiz },
    questionsSemaine: QUESTIONS_SEMAINE,
    questionsRevision: QUESTIONS_REVISION,
    favoris: lireFavoris(),
    histoires: {
      liste: histoires,
      ids: h.histoires.ids,
      lues: h.histoires.lues,
      statuts: recueil.statuts || {},
      offertes: HISTOIRES_OFFERTES,
    },
    depot: DEPOT,
  }

  const vue = new WebView()

  // La page demande à Scriptable ce qu'elle ne peut pas faire seule :
  // charger Wikipédia, enregistrer lectures, favoris, quiz et histoires, ouvrir le partage.
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
        attribuerHistoires(hh, histoires)
        ecrireHistorique(hh)
      } else if (action === "quiz") {
        const hh = lireHistorique()
        if (!hh.quiz[demande.cle]) {
          hh.quiz[demande.cle] = { score: demande.score, total: demande.total }
          attribuerHistoires(hh, histoires)
          ecrireHistorique(hh)
        }
      } else if (action === "histoire") {
        const hh = lireHistorique()
        attribuerHistoires(hh, histoires)
        if (hh.histoires.ids.includes(demande.id)) {
          hh.histoires.lues[demande.id] = true
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
