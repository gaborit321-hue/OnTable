// -----------------------------------------------------------------------
// OnTable — backend Apps Script (remplace window.storage)
//
// DÉPLOIEMENT :
// 1. Ouvre https://script.google.com, crée un nouveau projet, colle ce code
//    dans Code.gs (remplace le contenu par défaut).
// 2. Déployer > Nouveau déploiement > Type : Application Web
//      - Exécuter en tant que : Moi
//      - Qui a accès : Tout le monde
// 3. Copie l'URL de l'application Web générée (se termine par /exec).
// 4. Colle cette URL dans index.html, à la place de APPS_SCRIPT_URL.
//
// Stockage : PropertiesService.getScriptProperties() — partagé entre tous
// les appelants (contrairement à UserProperties), exactement le comportement
// dont on a besoin pour un code de session partagé entre plusieurs personnes.
// -----------------------------------------------------------------------

function doGet(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  var action = e.parameter.action;
  var key = e.parameter.key;

  if (!key) {
    return jsonResponse({ error: 'missing key' });
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(10000); // attend jusqu'à 10s si un autre appel modifie la même donnée

  try {
    var props = PropertiesService.getScriptProperties();

    if (action === 'get') {
      var value = props.getProperty(key);
      return jsonResponse({ value: value || null });

    } else if (action === 'set') {
      var value = e.parameter.value;
      props.setProperty(key, value);
      return jsonResponse({ ok: true });

    } else {
      return jsonResponse({ error: 'unknown action: ' + action });
    }
  } finally {
    lock.releaseLock();
  }
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
