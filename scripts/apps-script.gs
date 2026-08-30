/**
 * Points de collecte — pont d'écriture vers ce Sheet.
 *
 * Installation (5 min) :
 *  1. Dans le Sheet public : Extensions → Apps Script → remplacer tout le contenu par ce fichier.
 *  2. Remplacer CHANGE-MOI par un mot de passe long (ex. sortie de `openssl rand -base64 32`).
 *  3. Déployer → Nouveau déploiement → type « Application web » →
 *     Exécuter en tant que : Moi · Accès : Tout le monde → Déployer → autoriser → copier l'URL « …/exec ».
 *  4. Dans Vercel : SHEET_SCRIPT_URL = cette URL, SHEET_SCRIPT_SECRET = le même mot de passe. Redeploy.
 *
 * Le script agit avec votre identité Google : il ne fait que lire/écrire ce classeur (et, si ID_PRIVE
 * est renseigné, un second classeur privé pour les signalements). Après toute modification du code,
 * refaire « Déployer → Gérer les déploiements → modifier → nouvelle version ».
 */
var SECRET = "CHANGE-MOI";
var ID_PRIVE = ""; // optionnel : ID d'un Sheet privé pour l'onglet « signalements » (recommandé)
var ONGLET_SIGNALEMENTS = "signalements";
var ENTETES = ["recu", "code", "wilaya", "commune", "nom", "adresse", "tel", "contact_nom", "contact_tel", "statut", "lang"];

function doPost(e) {
  var d;
  try { d = JSON.parse(e.postData.contents); } catch (err) { return reponse({ ok: false, erreur: "JSON invalide" }); }
  if (!d || typeof d.secret !== "string" || d.secret !== SECRET) return reponse({ ok: false, erreur: "secret refusé" });
  try {
    var r = executer(d);
    r.ok = true;
    return reponse(r);
  } catch (err) {
    return reponse({ ok: false, erreur: String(err && err.message ? err.message : err) });
  }
}

function executer(d) {
  var classeur = SpreadsheetApp.getActiveSpreadsheet();
  var points = classeur.getSheets()[0]; // le premier onglet = celui que l'export CSV publie
  switch (d.action) {
    case "info":
      return { gid: points.getSheetId(), onglet: points.getName() };
    case "entetesPoints":
      return { valeurs: ligne(points, 1) };
    case "lireLigne": {
      var f = d.onglet === "signalements" ? feuilleSignalements(false) : points;
      return { valeurs: f ? ligne(f, Number(d.ligne)) : [] };
    }
    case "ajouterPoint":
      ajouter(points, d.ligne);
      return {};
    case "supprimerLigne": {
      var n = Number(d.ligne);
      if (!(n >= 2)) throw new Error("ligne invalide");
      points.deleteRow(n);
      return {};
    }
    case "ajouterSignalement":
      ajouter(feuilleSignalements(true), d.ligne);
      return {};
    case "lireSignalements": {
      var s = feuilleSignalements(false);
      if (!s || s.getLastRow() < 1) return { valeurs: [] };
      return { valeurs: s.getRange(1, 1, s.getLastRow(), Math.max(1, s.getLastColumn())).getDisplayValues() };
    }
    case "marquerSignalement": {
      var fs = feuilleSignalements(true);
      var col = ligne(fs, 1).map(function (h) { return String(h).trim().toLowerCase(); }).indexOf("statut") + 1;
      if (!col) throw new Error("colonne statut absente");
      fs.getRange(Number(d.ligne), col).setValue(String(d.statut));
      return {};
    }
    default:
      throw new Error("action inconnue : " + d.action);
  }
}

/** Lecture d'une ligne telle qu'affichée (les numéros gardent leur zéro). */
function ligne(f, n) {
  if (n < 1 || n > f.getLastRow()) return [];
  return f.getRange(n, 1, 1, Math.max(1, f.getLastColumn())).getDisplayValues()[0];
}

/** Ajout en texte brut : Sheets ne transforme pas « 0555… » en nombre ni « 2026-08-30 » en date. */
function ajouter(f, valeurs) {
  if (!Array.isArray(valeurs)) throw new Error("ligne attendue");
  var r = f.getRange(f.getLastRow() + 1, 1, 1, valeurs.length);
  r.setNumberFormat("@");
  r.setValues([valeurs.map(function (v) { return v == null ? "" : String(v); })]);
}

function feuilleSignalements(creer) {
  var classeur = ID_PRIVE ? SpreadsheetApp.openById(ID_PRIVE) : SpreadsheetApp.getActiveSpreadsheet();
  var f = classeur.getSheetByName(ONGLET_SIGNALEMENTS);
  if (!f && creer) {
    f = classeur.insertSheet(ONGLET_SIGNALEMENTS);
    ajouter(f, ENTETES);
  }
  return f;
}

function reponse(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
