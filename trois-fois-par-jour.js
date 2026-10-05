// ============================================================
// Trois fois par jour
// Un mot à 7h, une date à 12h, un artiste à 18h.
// Widget Scriptable pour l'écran verrouillé et l'écran d'accueil de l'iPhone.
// Code sous licence MIT. Contenus sous licence CC BY 4.0.
// ============================================================


// ---------- RÉGLAGES ----------

// Adresse des fichiers de contenu sur GitHub.
// Pour une copie du projet, remplacez clara-bismuth par votre propre pseudo GitHub.
const URL_DONNEES = "https://raw.githubusercontent.com/clara-bismuth/trois-fois-par-jour/main/data/"

// Horaires de changement de contenu : [heure, minute]
const HORAIRES = {
  mot: [7, 0],
  date: [12, 0],
  artiste: [18, 0],
}

// Point de départ de la rotation. Tous les utilisateurs voient le même
// contenu le même jour. Ne pas modifier une fois le projet publié.
const DEBUT = new Date(2026, 0, 1)

// Couleurs (clair, sombre). Utilisées sur l'écran d'accueil et en StandBy.
// Sur l'écran verrouillé, iOS remplace les couleurs par sa propre teinte.
const COULEURS = {
  fond: Color.dynamic(new Color("#F5F0E6"), new Color("#1B1A17")),
  texte: Color.dynamic(new Color("#1B1A17"), new Color("#F5F0E6")),
  secondaire: Color.dynamic(new Color("#6B655B"), new Color("#A8A195")),
  mot: Color.dynamic(new Color("#A0522D"), new Color("#E0965A")),
  date: Color.dynamic(new Color("#2F5D8A"), new Color("#7FB0E0")),
  artiste: Color.dynamic(new Color("#7A3B69"), new Color("#D49AC4")),
}

// Police des titres (doit être installée sur iOS : Georgia, Didot, Baskerville...)
const POLICE_TITRE = "Georgia-Bold"


// ---------- CONTENU DE SECOURS ----------
// Affiché uniquement si GitHub est inaccessible lors de la toute première utilisation.

const SECOURS = {
  mot: [{
    mot: "Acception",
    categorie: "n. f.",
    definition: "Sens particulier dans lequel un mot est employé. À ne pas confondre avec acceptation.",
    exemple: "Dans son acception juridique, ce terme est bien plus restrictif.",
  }],
  date: [{
    annee: "1789",
    evenement: "Prise de la Bastille",
    contexte: "Le 14 juillet, le peuple parisien s'empare de la forteresse, symbole de l'arbitraire royal.",
  }],
  artiste: [{
    nom: "Hilma af Klint",
    discipline: "Peinture",
    pays: "Suède",
    epoque: "1862-1944",
    oeuvre: "Les Dix Plus Grands (1907)",
    presentation: "Pionnière de l'abstraction, elle peint des toiles non figuratives avant Kandinsky.",
  }],
}


// ---------- CHARGEMENT DES DONNÉES ----------

const FICHIERS = { mot: "mots.json", date: "dates.json", artiste: "artistes.json" }

const fm = FileManager.local()
const dossier = fm.joinPath(fm.documentsDirectory(), "trois-fois-par-jour")
if (!fm.fileExists(dossier)) fm.createDirectory(dossier, true)

// Télécharge le fichier sur GitHub et le garde en mémoire sur le téléphone.
// Sans réseau, on utilise la dernière version enregistrée.
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
  } catch (e) {
    console.log(`Téléchargement impossible pour ${type} : ${e}`)
  }
  if (fm.fileExists(chemin)) {
    try {
      return JSON.parse(fm.readString(chemin))
    } catch (e) {
      console.log(`Fichier local illisible pour ${type}`)
    }
  }
  return SECOURS[type]
}


// ---------- CALENDRIER ----------

function enMinutes(horaire) {
  return horaire[0] * 60 + horaire[1]
}

function minutesActuelles(d) {
  return d.getHours() * 60 + d.getMinutes()
}

function veille(d) {
  const v = new Date(d)
  v.setDate(v.getDate() - 1)
  return v
}

// Nombre de jours écoulés depuis DEBUT (insensible aux changements d'heure)
function numeroDuJour(jour) {
  const a = Date.UTC(jour.getFullYear(), jour.getMonth(), jour.getDate())
  const b = Date.UTC(DEBUT.getFullYear(), DEBUT.getMonth(), DEBUT.getDate())
  return Math.round((a - b) / 86400000)
}

function choisir(liste, jour) {
  const n = liste.length
  return liste[((numeroDuJour(jour) % n) + n) % n]
}

// Quel contenu afficher maintenant ? Avant 7h, on garde l'artiste de la veille.
function momentActuel(maintenant) {
  const m = minutesActuelles(maintenant)
  if (m >= enMinutes(HORAIRES.artiste)) return { type: "artiste", jour: maintenant }
  if (m >= enMinutes(HORAIRES.date)) return { type: "date", jour: maintenant }
  if (m >= enMinutes(HORAIRES.mot)) return { type: "mot", jour: maintenant }
  return { type: "artiste", jour: veille(maintenant) }
}

// Widget réglé sur une seule catégorie (paramètre "mot", "date" ou "artiste")
function momentFixe(type, maintenant) {
  if (minutesActuelles(maintenant) >= enMinutes(HORAIRES[type])) {
    return { type, jour: maintenant }
  }
  return { type, jour: veille(maintenant) }
}

// Prochain horaire de changement, pour demander à iOS de rafraîchir le widget
function prochainChangement(maintenant) {
  const candidats = ["mot", "date", "artiste"].map(t => {
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


// ---------- MISE EN FORME ----------

// Transforme une entrée JSON en fiche affichable, quel que soit son type
function fiche(type, e) {
  if (type === "mot") {
    return {
      libelle: "MOT DU JOUR",
      titre: e.mot,
      meta: e.categorie || "",
      principal: e.definition,
      court: e.definition,
      detail: e.exemple ? `« ${e.exemple} »` : "",
    }
  }
  if (type === "date") {
    return {
      libelle: "DATE DU JOUR",
      titre: e.annee,
      meta: "",
      principal: e.evenement,
      court: e.evenement,
      detail: e.contexte || "",
    }
  }
  const meta = [e.discipline, e.pays, e.epoque].filter(Boolean).join(" · ")
  return {
    libelle: "ARTISTE DU JOUR",
    titre: e.nom,
    meta,
    principal: e.oeuvre ? `À découvrir : ${e.oeuvre}` : "",
    court: meta,
    detail: e.presentation || "",
  }
}

function policeTitre(taille) {
  return new Font(POLICE_TITRE, taille)
}


// ---------- WIDGETS ----------

// Écran verrouillé, format rectangulaire
function widgetRectangulaire(f) {
  const w = new ListWidget()
  const libelle = w.addText(f.libelle)
  libelle.font = Font.semiboldSystemFont(9)
  libelle.textOpacity = 0.7
  const titre = w.addText(f.titre)
  titre.font = policeTitre(15)
  titre.lineLimit = 1
  titre.minimumScaleFactor = 0.6
  const texte = w.addText(f.court)
  texte.font = Font.systemFont(11)
  texte.lineLimit = 2
  texte.minimumScaleFactor = 0.8
  return w
}

// Écran verrouillé, une ligne au-dessus de l'heure
function widgetLigne(f) {
  const w = new ListWidget()
  const t = w.addText(`${f.titre} · ${f.court}`)
  t.font = Font.systemFont(12)
  return w
}

// Écran verrouillé, format rond : le titre seul
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

// Écran d'accueil et StandBy, en couleur
function widgetCouleur(f, type, grand) {
  const w = new ListWidget()
  w.backgroundColor = COULEURS.fond
  w.setPadding(14, 14, 14, 14)

  const libelle = w.addText(f.libelle)
  libelle.font = Font.boldSystemFont(10)
  libelle.textColor = COULEURS[type]

  w.addSpacer(4)
  const titre = w.addText(f.titre)
  titre.font = policeTitre(grand ? 24 : 20)
  titre.textColor = COULEURS.texte
  titre.lineLimit = 1
  titre.minimumScaleFactor = 0.5

  if (f.meta) {
    const meta = w.addText(f.meta)
    meta.font = Font.italicSystemFont(11)
    meta.textColor = COULEURS.secondaire
    meta.lineLimit = 1
    meta.minimumScaleFactor = 0.7
  }

  w.addSpacer(6)
  const principal = w.addText(f.principal)
  principal.font = Font.systemFont(grand ? 13 : 12)
  principal.textColor = COULEURS.texte
  principal.lineLimit = grand ? 2 : 4
  principal.minimumScaleFactor = 0.8

  if (grand && f.detail) {
    w.addSpacer(4)
    const detail = w.addText(f.detail)
    detail.font = Font.italicSystemFont(12)
    detail.textColor = COULEURS.secondaire
    detail.lineLimit = 3
    detail.minimumScaleFactor = 0.8
  }

  w.addSpacer()
  return w
}


// ---------- AFFICHAGE DANS L'APP ----------

function echapper(texte) {
  return String(texte || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function carteHTML(type, f, actuel) {
  const h = HORAIRES[type]
  const heure = `${h[0]}h${h[1] ? String(h[1]).padStart(2, "0") : ""}`
  return `
    <section class="carte ${actuel ? "actuel" : ""}" style="--accent: var(--${type})">
      <div class="lib">${echapper(f.libelle)}<span class="heure">${heure}</span></div>
      <div class="titre">${echapper(f.titre)}</div>
      ${f.meta ? `<div class="meta">${echapper(f.meta)}</div>` : ""}
      <p class="principal">${echapper(f.principal)}</p>
      ${f.detail ? `<p class="detail">${echapper(f.detail)}</p>` : ""}
    </section>`
}

function pageHTML(jour, fiches, typeActuel) {
  const df = new DateFormatter()
  df.locale = "fr_FR"
  df.dateFormat = "EEEE d MMMM"
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  :root {
    --fond: #F5F0E6; --texte: #1B1A17; --sec: #6B655B; --carte: #FFFFFF;
    --mot: #A0522D; --date: #2F5D8A; --artiste: #7A3B69;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --fond: #1B1A17; --texte: #F5F0E6; --sec: #A8A195; --carte: #26241F;
      --mot: #E0965A; --date: #7FB0E0; --artiste: #D49AC4;
    }
  }
  body { margin: 0; padding: 28px 18px 48px; background: var(--fond); color: var(--texte);
         font: 16px/1.5 -apple-system, system-ui, sans-serif; }
  h1 { font: 700 30px Georgia, serif; margin: 0 0 4px; }
  .jour { color: var(--sec); margin: 0 0 22px; text-transform: capitalize; }
  .carte { background: var(--carte); border-radius: 18px; padding: 18px; margin-bottom: 14px; }
  .actuel { box-shadow: 0 0 0 2px var(--accent); }
  .lib { font-size: 11px; font-weight: 700; letter-spacing: .08em; color: var(--accent); }
  .heure { float: right; color: var(--sec); font-weight: 500; }
  .titre { font: 700 28px Georgia, serif; margin: 6px 0 2px; }
  .meta { font-style: italic; color: var(--sec); font-size: 14px; }
  .principal { margin: 12px 0 6px; }
  .detail { font-style: italic; color: var(--sec); margin: 0; }
</style>
</head>
<body>
  <h1>Trois fois par jour</h1>
  <p class="jour">${echapper(df.string(jour))}</p>
  ${carteHTML("mot", fiches.mot, typeActuel === "mot")}
  ${carteHTML("date", fiches.date, typeActuel === "date")}
  ${carteHTML("artiste", fiches.artiste, typeActuel === "artiste")}
</body>
</html>`
}


// ---------- LANCEMENT ----------

const maintenant = new Date()
const parametre = (args.widgetParameter || "").trim().toLowerCase()
const typeFixe = ["mot", "date", "artiste"].includes(parametre) ? parametre : null

if (config.runsInWidget) {
  const moment = typeFixe ? momentFixe(typeFixe, maintenant) : momentActuel(maintenant)
  const liste = await charger(moment.type)
  const f = fiche(moment.type, choisir(liste, moment.jour))

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
  // Lancé depuis l'app ou par un tap sur le widget : les 3 contenus du jour
  const moment = momentActuel(maintenant)
  const jour = minutesActuelles(maintenant) < enMinutes(HORAIRES.mot) ? veille(maintenant) : maintenant
  const [mots, dates, artistes] = await Promise.all([charger("mot"), charger("date"), charger("artiste")])
  const fiches = {
    mot: fiche("mot", choisir(mots, jour)),
    date: fiche("date", choisir(dates, jour)),
    artiste: fiche("artiste", choisir(artistes, jour)),
  }
  await WebView.loadHTML(pageHTML(jour, fiches, moment.type), null, null, true)
}

Script.complete()
