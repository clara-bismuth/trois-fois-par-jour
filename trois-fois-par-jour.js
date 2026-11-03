// ============================================================
// Trois fois par jour · version 2
// Un mot à 7h, une date à 12h, un artiste à 18h.
// Widget Scriptable pour l'écran verrouillé et l'écran d'accueil de l'iPhone.
// Code sous licence MIT. Contenus sous licence CC BY 4.0.
// https://github.com/clara-bismuth/trois-fois-par-jour
// ============================================================


// ---------- RÉGLAGES ----------

// Adresse des fichiers de contenu (à la racine du dépôt GitHub).
// Pour une copie du projet, remplacez clara-bismuth par votre propre pseudo GitHub.
const URL_DONNEES = "https://raw.githubusercontent.com/clara-bismuth/trois-fois-par-jour/main/"

// Horaires de changement de contenu : [heure, minute]
const HORAIRES = {
  mot: [7, 0],
  date: [12, 0],
  artiste: [18, 0],
}

// Point de départ de la rotation. Tous les utilisateurs voient le même
// contenu le même jour. Ne pas modifier une fois le projet publié.
const DEBUT = new Date(2026, 0, 1)

// Couleurs (clair, sombre) pour l'écran d'accueil et le StandBy.
// Sur l'écran verrouillé, iOS impose sa propre teinte.
const COULEURS = {
  fond: Color.dynamic(new Color("#F5F0E6"), new Color("#1B1A17")),
  texte: Color.dynamic(new Color("#1B1A17"), new Color("#F5F0E6")),
  secondaire: Color.dynamic(new Color("#6B655B"), new Color("#A8A195")),
  mot: Color.dynamic(new Color("#A0522D"), new Color("#E0965A")),
  date: Color.dynamic(new Color("#2F5D8A"), new Color("#7FB0E0")),
  artiste: Color.dynamic(new Color("#7A3B69"), new Color("#D49AC4")),
}

const POLICE_TITRE = "Georgia-Bold"

// Identification polie auprès de Wikipédia (recommandée par Wikimedia)
const ENTETES_WIKI = {
  "Api-User-Agent": "TroisFoisParJour/2.0 (https://github.com/clara-bismuth/trois-fois-par-jour)",
}


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


// ---------- CHARGEMENT DES DONNÉES ----------

const FICHIERS = { mot: "mots.json", date: "dates.json", artiste: "artistes.json" }

const fm = FileManager.local()
const dossier = fm.joinPath(fm.documentsDirectory(), "trois-fois-par-jour")
if (!fm.fileExists(dossier)) fm.createDirectory(dossier, true)

// Télécharge le fichier depuis GitHub et en garde une copie sur le téléphone.
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

// Jours écoulés depuis DEBUT (insensible aux changements d'heure)
function numeroDuJour(jour) {
  const a = Date.UTC(jour.getFullYear(), jour.getMonth(), jour.getDate())
  const b = Date.UTC(DEBUT.getFullYear(), DEBUT.getMonth(), DEBUT.getDate())
  return Math.round((a - b) / 86400000)
}

function choisir(liste, jour) {
  const n = liste.length
  return liste[((numeroDuJour(jour) % n) + n) % n]
}

// Avant 7h, on garde l'artiste de la veille
function momentActuel(maintenant) {
  const m = minutesActuelles(maintenant)
  if (m >= enMinutes(HORAIRES.artiste)) return { type: "artiste", jour: maintenant }
  if (m >= enMinutes(HORAIRES.date)) return { type: "date", jour: maintenant }
  if (m >= enMinutes(HORAIRES.mot)) return { type: "mot", jour: maintenant }
  return { type: "artiste", jour: veille(maintenant) }
}

function momentFixe(type, maintenant) {
  if (minutesActuelles(maintenant) >= enMinutes(HORAIRES[type])) return { type, jour: maintenant }
  return { type, jour: veille(maintenant) }
}

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


// ---------- MISE EN FORME DES FICHES ----------

function fiche(type, e) {
  if (type === "mot") {
    return {
      libelle: "MOT DU JOUR", titre: e.mot, meta: e.categorie || "",
      principal: e.definition, court: e.definition,
      detail: e.exemple ? `« ${e.exemple} »` : "",
    }
  }
  if (type === "date") {
    return {
      libelle: "DATE DU JOUR", titre: e.annee, meta: "",
      principal: e.evenement, court: e.evenement,
      detail: e.contexte || "",
    }
  }
  return {
    libelle: "ARTISTE DU JOUR", titre: e.nom,
    meta: [e.discipline, e.pays, e.epoque].filter(Boolean).join(" · "),
    principal: e.oeuvre ? `À découvrir : ${e.oeuvre}` : "",
    court: [e.discipline, e.epoque].filter(Boolean).join(" · "),
    detail: e.presentation || "",
  }
}

function policeTitre(taille) { return new Font(POLICE_TITRE, taille) }


// ---------- WIDGETS ----------

// Écran verrouillé, format rectangulaire : texte agrandi au maximum de la zone
function widgetRectangulaire(f) {
  const w = new ListWidget()
  w.setPadding(0, 0, 0, 0)
  const libelle = w.addText(f.libelle)
  libelle.font = Font.semiboldSystemFont(10)
  libelle.textOpacity = 0.75
  w.addSpacer(1)
  const titre = w.addText(f.titre)
  titre.font = policeTitre(19)
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
  const t = w.addText(`${f.titre} · ${f.court}`)
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
  w.backgroundColor = COULEURS.fond
  w.setPadding(14, 14, 14, 14)
  const libelle = w.addText(f.libelle)
  libelle.font = Font.boldSystemFont(11)
  libelle.textColor = COULEURS[type]
  w.addSpacer(4)
  const titre = w.addText(f.titre)
  titre.font = policeTitre(grand ? 26 : 22)
  titre.textColor = COULEURS.texte
  titre.lineLimit = 1
  titre.minimumScaleFactor = 0.5
  if (f.meta) {
    const meta = w.addText(f.meta)
    meta.font = Font.italicSystemFont(12)
    meta.textColor = COULEURS.secondaire
    meta.lineLimit = 1
    meta.minimumScaleFactor = 0.7
  }
  w.addSpacer(6)
  const principal = w.addText(f.principal)
  principal.font = Font.systemFont(grand ? 14 : 13)
  principal.textColor = COULEURS.texte
  principal.lineLimit = grand ? 2 : 4
  principal.minimumScaleFactor = 0.8
  if (grand && f.detail) {
    w.addSpacer(4)
    const detail = w.addText(f.detail)
    detail.font = Font.italicSystemFont(13)
    detail.textColor = COULEURS.secondaire
    detail.lineLimit = 3
    detail.minimumScaleFactor = 0.8
  }
  w.addSpacer()
  return w
}


// ---------- ENRICHISSEMENT (dans l'app uniquement) ----------

async function lireJSON(url) {
  const r = new Request(url)
  r.headers = ENTETES_WIKI
  r.timeoutInterval = 8
  return await r.loadJSON()
}

// Cherche l'article Wikipédia le plus pertinent, puis son résumé et ses images.
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
          .slice(0, 8)
          .map(i => {
            const src = i.srcset[i.srcset.length - 1].src
            return {
              src: src.startsWith("//") ? "https:" + src : src,
              legende: (i.caption && i.caption.text) || "",
            }
          })
      } catch (e) {}
    }
    return {
      titre,
      extrait: resume.extract || "",
      image: (resume.thumbnail && resume.thumbnail.source) || "",
      url: (resume.content_urls && resume.content_urls.mobile && resume.content_urls.mobile.page) || `https://fr.wikipedia.org/wiki/${t}`,
      galerie,
    }
  } catch (e) {
    console.log(`Wikipédia indisponible : ${e}`)
    return null
  }
}

const enc = encodeURIComponent
const LIENS = {
  wikipedia: q => `https://fr.wikipedia.org/w/index.php?search=${enc(q)}`,
  franceCulture: q => `https://duckduckgo.com/?q=${enc("site:radiofrance.fr/franceculture " + q)}`,
  youtube: q => `https://www.youtube.com/results?search_query=${enc(q)}`,
  cnrtl: m => `https://www.cnrtl.fr/definition/${enc(m)}`,
  synonymes: m => `https://www.cnrtl.fr/synonymie/${enc(m)}`,
  academie: m => `https://www.dictionnaire-academie.fr/search?term=${enc(m)}`,
  artsCulture: q => `https://artsandculture.google.com/search?q=${enc(q)}`,
}


// ---------- PAGE DE L'APP ----------

function esc(texte) {
  return String(texte || "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

function bouton(texte, url) {
  return `<a class="bouton" href="${esc(url)}">${esc(texte)}</a>`
}

function section(titre, contenu) {
  return contenu ? `<h3>${esc(titre)}</h3>${contenu}` : ""
}

function liste(items) {
  return items && items.length ? `<ul>${items.map(i => `<li>${esc(i)}</li>`).join("")}</ul>` : ""
}

function etiquettes(items) {
  return items && items.length ? `<p class="etiquettes">${items.map(i => `<span>${esc(i)}</span>`).join("")}</p>` : ""
}

function extraitWiki(w) {
  if (!w || !w.extrait) return ""
  return `<blockquote>${esc(w.extrait)}<cite>Source : Wikipédia, article « ${esc(w.titre)} »</cite></blockquote>`
}

function galerieHTML(w) {
  if (!w || !w.galerie || !w.galerie.length) return ""
  return `<div class="galerie">${w.galerie.map(i =>
    `<figure><img src="${esc(i.src)}" loading="lazy">${i.legende ? `<figcaption>${esc(i.legende)}</figcaption>` : ""}</figure>`
  ).join("")}</div><p class="note">Images issues de Wikipédia et Wikimedia Commons, sous licences libres.</p>`
}

function entete(type, libelle, titre, meta) {
  const h = HORAIRES[type]
  const heure = `${h[0]}h${h[1] ? String(h[1]).padStart(2, "0") : ""}`
  return `<div class="lib">${esc(libelle)}<span class="heure">${heure}</span></div>
    <h2>${esc(titre)}</h2>${meta ? `<div class="meta">${esc(meta)}</div>` : ""}`
}

function carteMot(e, actuel) {
  const lemme = e.lemme || e.mot.toLowerCase()
  return `<section class="carte ${actuel ? "actuel" : ""}" style="--accent: var(--mot)">
    ${entete("mot", "MOT DU JOUR", e.mot, e.categorie)}
    <p class="principal">${esc(e.definition)}</p>
    ${e.exemple ? `<p class="exemple">« ${esc(e.exemple)} »</p>` : ""}
    ${section("En situation", liste(e.situations))}
    ${section("Synonymes", etiquettes(e.synonymes))}
    ${e.piege ? `<h3>Attention</h3><p class="piege">${esc(e.piege)}</p>` : ""}
    <h3>Pour aller plus loin</h3>
    <p>${bouton("Définition · CNRTL", LIENS.cnrtl(lemme))}${bouton("Synonymes · CNRTL", LIENS.synonymes(lemme))}${bouton("Académie française", LIENS.academie(lemme))}</p>
  </section>`
}

function carteDate(e, w, actuel) {
  const q = e.recherche || `${e.evenement} ${e.annee}`
  return `<section class="carte ${actuel ? "actuel" : ""}" style="--accent: var(--date)">
    ${entete("date", "DATE DU JOUR", e.annee, "")}
    <p class="principal fort">${esc(e.evenement)}</p>
    ${w && w.image ? `<img class="visuel" src="${esc(w.image)}">` : ""}
    <p>${esc(e.contexte)}</p>
    ${section("Le contexte", e.recit ? `<p>${esc(e.recit)}</p>` : "")}
    ${section("Ce qu'en dit Wikipédia", extraitWiki(w))}
    <h3>Écouter, voir, lire</h3>
    <p>${bouton("Podcasts France Culture", LIENS.franceCulture(q))}${bouton("Vidéos YouTube", LIENS.youtube(q + " histoire"))}${bouton("Article Wikipédia", w ? w.url : LIENS.wikipedia(q))}</p>
    <p class="note">Les liens podcasts et vidéos lancent une recherche : choisissez de préférence des sources identifiées (Radio France, INA, Arte, musées, universités).</p>
  </section>`
}

function carteArtiste(e, w, wm, actuel) {
  const meta = [e.discipline, e.pays, e.epoque].filter(Boolean).join(" · ")
  const mouvement = e.mouvement || {}
  return `<section class="carte ${actuel ? "actuel" : ""}" style="--accent: var(--artiste)">
    ${entete("artiste", "ARTISTE DU JOUR", e.nom, meta)}
    <p class="principal">${esc(e.presentation)}</p>
    ${section("Biographie", e.bio ? `<p>${esc(e.bio)}</p>` : "")}
    ${section("Œuvres clés", liste(e.oeuvres_cles || (e.oeuvre ? [e.oeuvre] : [])))}
    ${galerieHTML(w)}
    ${mouvement.nom ? `<h3>Courant : ${esc(mouvement.nom)}</h3><p>${esc(mouvement.texte)}</p>` : ""}
    ${section("Ce qu'en dit Wikipédia", extraitWiki(w))}
    <h3>Écouter, voir, lire</h3>
    <p>${bouton("Podcasts France Culture", LIENS.franceCulture(e.nom))}${bouton("Vidéos YouTube", LIENS.youtube(e.nom + " " + (e.discipline || "")))}${bouton("Google Arts & Culture", LIENS.artsCulture(e.nom))}${bouton("Article Wikipédia", w ? w.url : LIENS.wikipedia(e.nom))}${mouvement.nom ? bouton("Le courant sur Wikipédia", wm ? wm.url : LIENS.wikipedia(mouvement.nom)) : ""}</p>
  </section>`
}

function pageHTML(jour, contenu, typeActuel) {
  const df = new DateFormatter()
  df.locale = "fr_FR"
  df.dateFormat = "EEEE d MMMM"
  const cartes = {
    mot: carteMot(contenu.mot, typeActuel === "mot"),
    date: carteDate(contenu.date, contenu.wikiDate, typeActuel === "date"),
    artiste: carteArtiste(contenu.artiste, contenu.wikiArtiste, contenu.wikiMouvement, typeActuel === "artiste"),
  }
  // Le contenu du moment s'affiche en premier
  const ordre = [typeActuel].concat(["mot", "date", "artiste"].filter(t => t !== typeActuel))
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  :root { --fond:#F5F0E6; --texte:#1B1A17; --sec:#6B655B; --carte:#FFFFFF; --trait:#E4DDCF;
          --mot:#A0522D; --date:#2F5D8A; --artiste:#7A3B69; }
  @media (prefers-color-scheme: dark) {
    :root { --fond:#1B1A17; --texte:#F5F0E6; --sec:#A8A195; --carte:#26241F; --trait:#3A3731;
            --mot:#E0965A; --date:#7FB0E0; --artiste:#D49AC4; } }
  * { box-sizing: border-box; }
  body { margin:0; padding:28px 16px 56px; background:var(--fond); color:var(--texte);
         font:17px/1.55 -apple-system, system-ui, sans-serif; -webkit-text-size-adjust:100%; }
  h1 { font:700 30px Georgia, serif; margin:0 0 2px; }
  .jour { color:var(--sec); margin:0 0 22px; text-transform:capitalize; }
  .carte { background:var(--carte); border-radius:20px; padding:20px 18px; margin-bottom:16px; }
  .actuel { box-shadow:0 0 0 2px var(--accent); }
  .lib { font-size:12px; font-weight:700; letter-spacing:.08em; color:var(--accent); }
  .heure { float:right; color:var(--sec); font-weight:500; }
  h2 { font:700 32px/1.15 Georgia, serif; margin:8px 0 4px; }
  h3 { font-size:13px; letter-spacing:.06em; text-transform:uppercase; color:var(--accent);
       margin:22px 0 6px; padding-top:14px; border-top:1px solid var(--trait); }
  .meta { font-style:italic; color:var(--sec); font-size:15px; }
  .principal { font-size:19px; margin:14px 0 8px; }
  .fort { font-weight:600; }
  .exemple, .piege { font-style:italic; color:var(--sec); }
  p { margin:8px 0; }
  ul { margin:6px 0; padding-left:20px; }
  li { margin:4px 0; }
  .etiquettes span { display:inline-block; border:1px solid var(--trait); border-radius:999px;
                     padding:3px 12px; margin:0 6px 8px 0; font-size:15px; }
  blockquote { margin:6px 0; padding-left:12px; border-left:3px solid var(--accent); }
  cite { display:block; margin-top:6px; font-size:13px; color:var(--sec); font-style:normal; }
  .visuel { width:100%; border-radius:12px; margin:8px 0; }
  .galerie { display:flex; gap:10px; overflow-x:auto; padding:6px 0; -webkit-overflow-scrolling:touch; }
  .galerie figure { margin:0; flex:0 0 72%; }
  .galerie img { width:100%; height:200px; object-fit:cover; border-radius:12px; background:var(--trait); }
  figcaption { font-size:13px; color:var(--sec); margin-top:4px; }
  .bouton { display:inline-block; margin:0 8px 8px 0; padding:8px 14px; border-radius:999px;
            background:var(--accent); color:var(--carte); text-decoration:none; font-size:15px; font-weight:600; }
  .note { font-size:13px; color:var(--sec); }
</style></head>
<body>
  <h1>Trois fois par jour</h1>
  <p class="jour">${esc(df.string(jour))}</p>
  ${ordre.map(t => cartes[t]).join("")}
</body></html>`
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
  // Ouvert depuis l'app ou par un tap sur le widget : la page complète du jour
  const moment = momentActuel(maintenant)
  const jour = minutesActuelles(maintenant) < enMinutes(HORAIRES.mot) ? veille(maintenant) : maintenant
  const [mots, dates, artistes] = await Promise.all([charger("mot"), charger("date"), charger("artiste")])
  const mot = choisir(mots, jour)
  const date = choisir(dates, jour)
  const artiste = choisir(artistes, jour)
  const [wikiDate, wikiArtiste, wikiMouvement] = await Promise.all([
    wikipedia(date.wikipedia || date.evenement, false),
    wikipedia(artiste.wikipedia || artiste.nom, true),
    artiste.mouvement && artiste.mouvement.nom ? wikipedia(artiste.mouvement.wikipedia || artiste.mouvement.nom, false) : null,
  ])
  const html = pageHTML(jour, { mot, date, artiste, wikiDate, wikiArtiste, wikiMouvement }, moment.type)

  // Les liens s'ouvrent dans Safari, la page reste dans Scriptable
  const vue = new WebView()
  vue.shouldAllowRequest = requete => {
    const url = requete.url || ""
    if (url.startsWith("http")) { Safari.open(url); return false }
    return true
  }
  await vue.loadHTML(html)
  await vue.present(true)
}

Script.complete()
