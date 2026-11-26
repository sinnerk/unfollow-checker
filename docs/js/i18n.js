/**
 * Unfollow Checker — UI translations.
 *
 * Static UI strings live here so the tool itself speaks the visitor's
 * language. Everything falls back to English when a key is missing, so
 * partial translations never break the page. Guide prose (tutorials,
 * privacy) stays English-only for now — the parser output is language-free.
 *
 * window.ucT(key, params) -> translated string (params: {n}, {u} … )
 * window.ucSetLang(lang)  -> switch + remember + re-translate the page
 */
(function () {
  "use strict";

  var LANGS = {
    en: "English",
    es: "Español",
    pt: "Português",
    hi: "हिन्दी",
    id: "Bahasa Indonesia",
    ja: "日本語",
  };

  var DICT = {
    en: {
      "nav.features": "Features",
      "nav.tutorials": "Tutorials",
      "nav.privacy": "Privacy",
      "nav.tool": "Open the tool",
      "nav.home": "Home",
      "nav.github": "GitHub",

      "hero.eyebrow": "Free · open source · no login",
      "hero.title": "See exactly who doesn't follow you back.",
      "hero.lede":
        "Drop your Instagram data export and get the real list in seconds — plus the fans you never followed back, and the dead accounts still sitting in your following. Everything is computed inside your own browser tab.",
      "hero.cta": "Open the tool →",
      "hero.getExport": "Get your export (2 min)",
      "hero.check1": "No password, no scraping, no automation",
      "hero.check2": "Your ZIP never leaves your device",
      "hero.check3": "Works on a phone, and it's free forever",

      "features.title": "Everything you need to clean up your following",
      "features.sub":
        "Not a screenshot of the maths — the actual lists, with the boring edge cases handled.",
      "features.exact.title": "Exact counts",
      "features.exact.body":
        "Following, followers, mutual, fans and not-following-back, reconciled on casefolded handles with duplicate rows dropped. Split files, HTML exports and old /_u/ links all parse.",
      "features.integrity.title": "Export integrity panel",
      "features.integrity.body":
        "See exactly which files were read, how many rows each held, how many duplicates were dropped, and whether Instagram's own insights page disagrees with your follower list.",
      "features.loop.title": "Open next & check off",
      "features.loop.body":
        "One button opens the next unchecked profile in a new tab and records it, so you never lose your place. Progress is saved per export, not globally.",
      "features.dead.title": "Dead-account finder",
      "features.dead.body":
        "Instagram hides deleted and deactivated accounts in plain sight. Run the optional one-click check inside your own logged-in tab and they get flagged.",
      "features.export.title": "Take the list with you",
      "features.export.body":
        "Search, filter, copy the usernames, or download a CSV that includes follow dates and verification status. No account needed to export.",
      "features.diff.title": "Changes between exports",
      "features.diff.body":
        "Import a newer export any time and see exactly who unfollowed you, who started following, who you unfollowed and who you newly followed — computed locally from the two snapshots.",
      "features.local.title": "Truly local",
      "features.local.body":
        "No backend, no analytics, no third-party scripts. The zip reader is bundled with the page, so the site works with your network switched off.",

      "steps.title": "Three steps",
      "steps.one.title": "Download your export",
      "steps.one.body":
        "Accounts Center → Your information and permissions → Download your information. Pick JSON and tick only Followers and following so the file stays small.",
      "steps.one.link": "Walkthrough →",
      "steps.two.title": "Drop the ZIP",
      "steps.two.body":
        "The page reads it in memory and compares both lists locally. A 450 MB export takes about five seconds; nothing is transmitted anywhere.",
      "steps.two.link": "Open the tool →",
      "steps.three.title": "Work the list",
      "steps.three.body":
        "Hit Open next & check off and go down the list. Mark dead accounts as gone. Come back any time — your progress is remembered.",
      "steps.three.link": "How the cleanup loop works →",

      "faq.title": "Questions people actually ask",
      "faq.q1": "Is this allowed? Will Instagram ban me?",
      "faq.a1":
        "You're reading a file Instagram gave you. There is no automation, no scraping and no login, so there is nothing for them to act on. The tool never unfollows for you — you click unfollow yourself.",
      "faq.q2": "Why doesn't it unfollow people automatically?",
      "faq.a2":
        "Instagram has no public unfollow API, and any site offering mass-unfollow is either running your password through a scraper or breaking the terms. The safe loop is: open profile → tap Unfollow → come back → next.",
      "faq.q3": "My export is HTML. Does it still work?",
      "faq.a3":
        "Yes, but HTML exports silently drop older rows from long lists, which can make real followers look like non-followers. The integrity panel flags it. Re-download in JSON for an exact answer.",
      "faq.q4": "Someone shows up as not following back, but I'm sure they do.",
      "faq.a4":
        "Three honest reasons: the export is a snapshot (a day or two old on big accounts), it's an HTML export, or the two lists were captured at different moments. Nothing is wrong with the maths in those cases — see troubleshooting.",
      "faq.q5": "How does it find deleted accounts?",
      "faq.a5":
        "Instagram only answers \"does this profile exist?\" for a logged-in visitor, so the check runs as a bookmarklet inside your own Instagram tab, read-only, about one request per second. Results come back to this page. It refuses to run without a valid session and marks nothing if it can't verify.",
      "faq.q6": "Where is my data stored?",
      "faq.a6":
        "In this browser's local storage: your check-offs and gone marks, keyed to that specific export. Nothing is synced, and \"Reset\" clears it.",
      "faq.more": "Full privacy notes →",

      "cta.title": "Ready when you are.",
      "cta.body": "Free, no account, works on your phone. About five seconds from ZIP to list.",

      "footer.tagline": "A local-first tool for auditing your Instagram following. Free and open source under MIT.",
      "footer.product": "Product",
      "footer.project": "Project",
      "footer.source": "Source code",
      "footer.trouble": "Troubleshooting",
      "footer.note": "Not affiliated with Instagram or Meta. Your export stays on your device.",

      "app.title": "Drop your export. Get the list.",
      "app.lede":
        "Your ZIP is read inside this tab — it is never uploaded. If you don't have the file yet, get your export in 2 minutes via <a href=\"tutorials.html#download\">the guide</a>.",
      "app.dropBig": "Drop your export .zip here",
      "app.dropSmall": "or tap to choose a file — JSON export recommended, HTML also supported",
      "app.pill1": "🔒 100% local — no upload, no server",
      "app.pill2": "⚡ Parse in seconds",
      "app.pill3": "📱 Works on phone",
      "app.pill4": "🧾 Exact counts, verified",
      "app.reading": "Reading export…",
      "app.comparing": "Comparing lists…",
      "app.largeExport":
        "Large export ({mb} MB) — on a phone this can take a minute. ",
      "app.loadDifferent": "Load a different export",
      "app.search": "Search username",
      "app.openNext": "Open next & check off ↗",
      "app.tab.notFollowingBack": "Doesn't follow back",
      "app.tab.fans": "Follows you only",
      "app.tab.mutual": "Mutual",
      "app.hideChecked": "Hide checked",
      "app.hideGone": "Hide gone accounts",
      "app.checkedOf": "{n} / {m} checked off",
      "app.goneSuffix": "· {n} gone",
      "app.copyList": "Copy usernames",
      "app.csv": "CSV",
      "app.reset": "Reset",
      "app.showMore": "Show {n} more of {m}",

      "stats.following": "Following",
      "stats.followers": "Followers",
      "stats.notFollowingBack": "Don't follow back",
      "stats.fans": "Follows you only",
      "stats.mutual": "Mutual",

      "list.noMatch": "Nothing matches this filter.",
      "list.allGood": "Everyone you follow follows you back.",
      "list.empty": "This list is empty.",

      "row.checkOff": "Check off @{u}",
      "row.openProfile": "Open profile",
      "row.openOn": "Open @{u} on Instagram",
      "row.markGone": "Mark as gone (deleted or deactivated)",
      "row.unmarkGone": "Unmark gone",
      "row.gone": "gone",
      "row.exists": "exists",

      "history.title": "Changes since your last export",
      "history.saved": "{n} saved",
      "history.lede":
        "Exports you import are remembered in this browser (the newest few). Pick an earlier one below and the page shows exactly what changed between the two snapshots: who unfollowed you, who started following you, who you unfollowed, and who you newly followed.",
      "history.noneYet":
        "Snapshots of your exports are kept here. The next time you import a newer export, the exact changes between the two appear in this panel.",
      "history.onlyCurrent":
        "Only the current export is stored so far. Import it again next month — or whenever you next download a newer export — and this panel shows who followed and unfollowed you in between.",
      "history.select": "Choose the earlier export to compare against",
      "history.compare": "Compare",
      "history.note": "Changes between {when} and now.",
      "history.unfollowedYou": "Unfollowed you",
      "history.newFollowers": "New followers",
      "history.youUnfollowed": "You unfollowed",
      "history.newlyFollowed": "You newly followed",
      "history.copy": "Copy",
      "history.nothing": "Nothing here.",
      "history.reimport":
        "Re-import your current export once to enable comparison (its full lists were not kept in local storage).",

      "verify.title": "Find dead or deactivated accounts",
      "verify.badge": "optional",
      "verify.lede":
        "Instagram only answers \"does this account still exist?\" for a logged-in session — every profile URL returns the same generic page when you are logged out. There are two ways to get that answer below: a shared checker service, or a one-click script that runs in your own tab.",
      "verify.opt1.title": "Option 1 — server check",
      "verify.opt1.badge": "fastest",
      "verify.opt1.body":
        "We send only the usernames on this list to a small checker service, which asks Instagram whether each profile still exists. Your export, your account and your session never leave your browser — the service has no idea who you are, and it answers from its own capacity.",
      "verify.opt1.button": "Check these accounts",
      "verify.opt2.title": "Option 2 — run it yourself",
      "verify.opt2.badge": "always works",
      "verify.opt2.body":
        "This runs in your own Instagram tab with your own session. Slower to set up, but it never depends on our service and it works even if you're rate-limited elsewhere.",
      "verify.opt2.step1":
        "Drag this button to your bookmarks bar (desktop) — or use Copy the script and paste it into the URL field of a new bookmark:",
      "verify.opt2.step2":
        "Open <a href=\"https://www.instagram.com/\" target=\"_blank\" rel=\"noopener\">instagram.com</a> in that same browser and make sure you're logged in.",
      "verify.opt2.step3":
        "Click the bookmark. A panel appears and checks every account one by one (~1 per second).",
      "verify.opt2.step4":
        "When it finishes, it copies the results and reopens this page with them filled in.",
      "verify.pastePrompt": "Got the results as text? Paste them here:",
      "verify.apply": "Apply results",
      "verify.clearGone": "Clear gone marks",
      "verify.phoneNote":
        "On a phone bookmarklets don't work — use the mark as gone button on any row after opening a profile and seeing \"Sorry, this page isn't available\".",
      "verify.bm.check": "Check {n} accounts",
      "verify.bm.copy": "Copy the script",
      "verify.bm.copied": "Copied ✓",
      "verify.bm.copiedToast":
        "Bookmark script copied — paste it into a new bookmark's URL field.",
      "verify.bm.copyFailed": "Could not copy — drag the button instead.",
      "verify.bm.note":
        "Bookmarklets are blocked on some phones and on Instagram's in-app browser — open this site in a real browser, and use the manual mark button on mobile.",
      "verify.slot.empty": "Nothing to check — the list is empty.",

      "devices.title": "Move progress between devices",
      "devices.lede":
        "Check-offs and gone marks live in this browser only. Download them as a small file to continue on another device, or to keep them safe before clearing your browser data.",
      "devices.download": "Download progress",
      "devices.restore": "Restore from a file",
      "devices.savedNote":
        "Saved {n} check-off(s) and {m} gone mark(s).",
      "devices.restoredNote":
        "Restored — {n} check-off(s), {m} gone mark(s) ({added} new).",

      "integrity.title": "Export integrity",
      "integrity.badge.ok": "complete",
      "integrity.badge.warn": "incomplete",
      "integrity.badge.dup": "{n} duplicates",
      "integrity.summary":
        "Read {files} list file(s), {rows} row(s); {dups} duplicate row(s) dropped, {skipped} unreadable row(s). Format: {format}.",
      "integrity.file": "File",
      "integrity.list": "List",
      "integrity.rows": "Rows",
      "integrity.reported":
        "Instagram's own insights page reported {reported} followers at export time; this export lists {listed}.",
      "integrity.noReport":
        "No audience-insights page in this export, so the follower count could not be cross-checked against Instagram's own number.",

      "toast.importFirst": "Import an export first.",
      "toast.cannotRead":
        "That file could not be read. Make sure it is the .zip Instagram emailed you.",
      "toast.zipReaderFailed":
        "The zip reader failed to load. Check your connection and reload the page.",
      "toast.nothingToCheck": "There is nothing to check.",
      "toast.contacting": "Contacting the checker service…",
      "toast.unreachable":
        "Could not reach the checker service. Use Option 2 (the bookmarklet) instead.",
      "toast.noSession":
        "The checker service has no Instagram session configured yet. Use Option 2 below — it works today.",
      "toast.serviceDown":
        "The checker service can't reach Instagram right now. Use Option 2 below.",
      "toast.rateLimited":
        "The checker service is busy (rate limited). Wait a minute, or use Option 2.",
      "toast.serviceError":
        "The checker service returned an error ({code}). Use Option 2.",
      "toast.nothingClassified":
        "The service could not classify anything this time.",
      "toast.serverProgress": "Checked {done} of {total} — {gone} gone, {exist} exist, {unknown} unknown.",
      "toast.serverDone": "Done — {gone} gone, {exist} exist, {unknown} unknown.",
      "toast.allChecked": "Everything in this list is checked off.",
      "toast.openedAndChecked": "Opened @{u} and checked it off.",
      "toast.nothingToCopy": "Nothing to copy.",
      "toast.copiedN": "Copied {n} usernames.",
      "toast.copyFallback": "Could not copy — use the CSV instead.",
      "toast.csvDone": "CSV downloaded.",
      "toast.nothingToReset": "Nothing to reset.",
      "toast.confirmReset": "Clear every check-off for this export? Gone marks are kept.",
      "toast.resetDone": "Check-offs cleared.",
      "toast.pasteFirst": "Paste the verifier output first.",
      "toast.notVerifierOutput": "That does not look like verifier output.",
      "toast.noDeadList": "No \"dead\" list in that output.",
      "toast.verifyPending":
        "Verifier results saved — import your export to apply them.",
      "toast.markedGone":
        "Marked {n} account(s) as gone, {m} confirmed to exist.",
      "toast.noGoneMarks": "No gone marks to clear.",
      "toast.goneCleared": "Gone marks cleared.",
      "toast.restoreFirst": "Import your export first, then restore progress.",
      "toast.notJson": "That file is not valid JSON.",
      "toast.notProgress": "That does not look like a progress file.",
      "toast.confirmMerge":
        "That progress belongs to a different export. Merge it into this one anyway?",
      "toast.restoredN": "Restored {n} check-off(s).",
      "toast.notALink": "Could not read the verifier result from the link.",
    },

    /* ---------------------------------------------------------------
       Español
    --------------------------------------------------------------- */
    es: {
      "nav.features": "Funciones",
      "nav.tutorials": "Tutoriales",
      "nav.privacy": "Privacidad",
      "nav.tool": "Abrir la herramienta",
      "nav.home": "Inicio",
      "nav.github": "GitHub",

      "hero.eyebrow": "Gratis · código abierto · sin inicio de sesión",
      "hero.title": "Averigua exactamente quién no te sigue.",
      "hero.lede":
        "Suelta la exportación de datos de tu Instagram y obtén la lista real en segundos — también los fans a los que nunca sigues, y las cuentas muertas que sigues llevan rato en tu lista. Todo se calcula dentro de tu propia pestaña del navegador.",
      "hero.cta": "Abrir la herramienta →",
      "hero.getExport": "Conseguir tu exportación (2 min)",
      "hero.check1": "Sin contraseña, sin scraping, sin automatización",
      "hero.check2": "Tu ZIP nunca sale de tu dispositivo",
      "hero.check3": "Funciona en el móvil, y es gratis para siempre",

      "features.title": "Todo lo que necesitas para limpiar tu lista de seguidos",
      "features.sub":
        "No una captura de las cuentas — las listas reales, con los casos límite aburridos resueltos.",
      "features.exact.title": "Recuentos exactos",
      "features.exact.body":
        "Seguidos, seguidores, mutuos, fans y no-te-siguen, conciliados sobre nombres en minúsculas con filas duplicadas descartadas. Archivos partidos, exportaciones HTML y enlaces /_u/ antiguos se procesan.",
      "features.integrity.title": "Panel de integridad",
      "features.integrity.body":
        "Mira exactamente qué archivos se leyeron, cuántas filas tenía cada uno, cuántos duplicados se descartaron, y si la propia página de estadísticas de Instagram discrepa de tu lista de seguidores.",
      "features.loop.title": "Abrir siguiente y marcar",
      "features.loop.body":
        "Un botón abre el siguiente perfil sin marcar en una pestaña nueva y lo anota, para que nunca pierdas tu sitio. El progreso se guarda por exportación, no globalmente.",
      "features.dead.title": "Detector de cuentas muertas",
      "features.dead.body":
        "Instagram esconde las cuentas borradas y desactivadas a plena vista. Ejecuta la comprobación opcional de un clic dentro de tu propia pestaña con sesión y quedan marcadas.",
      "features.export.title": "Llévate la lista",
      "features.export.body":
        "Busca, filtra, copia los nombres o descarga un CSV con fechas de seguimiento y estado de verificación. No hace falta ninguna cuenta para exportar.",
      "features.diff.title": "Cambios entre exportaciones",
      "features.diff.body":
        "Importa una exportación más nueva cuando quieras y mira exactamente quién te dejó de seguir, quién empezó a seguirte, a quién dejaste de seguir y a quién empezaste a seguir — calculado localmente entre las dos instantáneas.",
      "features.local.title": "Verdaderamente local",
      "features.local.body":
        "Sin backend, sin analítica, sin scripts de terceros. El lector ZIP viene incluido en la página, así que el sitio funciona con la red apagada.",

      "steps.title": "Tres pasos",
      "steps.one.title": "Descarga tu exportación",
      "steps.one.body":
        "Accounts Center → Tu información y permisos → Descargar tu información. Elige JSON y marca solo Seguidores y seguidos para que el archivo sea pequeño.",
      "steps.one.link": "Paso a paso →",
      "steps.two.title": "Suelta el ZIP",
      "steps.two.body":
        "La página lo lee en memoria y compara ambas listas localmente. Una exportación de 450 MB tarda unos cinco segundos; no se transmite nada.",
      "steps.two.link": "Abrir la herramienta →",
      "steps.three.title": "Trabaja la lista",
      "steps.three.body":
        "Pulsa Abrir siguiente y marcar y baja por la lista. Marca las cuentas muertas como desaparecidas. Vuelve cuando quieras — tu progreso se recuerda.",
      "steps.three.link": "Cómo funciona el bucle de limpieza →",

      "faq.title": "Preguntas que la gente hace de verdad",
      "faq.q1": "¿Está permitido? ¿Instagram me bloqueará?",
      "faq.a1":
        "Estás leyendo un archivo que Instagram te dio. No hay automatización, ni scraping, ni inicio de sesión, así que no hay nada de lo que acusarte. La herramienta nunca deja de seguir por ti — tú pulsas «Dejar de seguir».",
      "faq.q2": "¿Por qué no deja de seguir a la gente automáticamente?",
      "faq.a2":
        "Instagram no tiene una API pública para dejar de seguir, y cualquier sitio que ofrezca «unfollow masivo» o está procesando tu contraseña con un scraper o rompe los términos. El bucle seguro es: abrir perfil → pulsar «Dejar de seguir» → volver → siguiente.",
      "faq.q3": "Mi exportación es HTML. ¿Funciona igual?",
      "faq.a3":
        "Sí, pero las exportaciones HTML descartan filas antiguas de listas largas sin avisar, lo que puede hacer que seguidores reales parezcan no seguidores. El panel de integridad lo avisa. Vuelve a descargarla en JSON para una respuesta exacta.",
      "faq.q4": "Alguien aparece como que no me sigue, pero estoy seguro de que sí.",
      "faq.a4":
        "Tres razones honestas: la exportación es una instantánea (de hace un día o dos en cuentas grandes), es una exportación HTML, o las dos listas se capturaron en momentos distintos. No hay nada mal en las cuentas en esos casos — mira la solución de problemas.",
      "faq.q5": "¿Cómo encuentra las cuentas borradas?",
      "faq.a5":
        "Instagram solo responde «¿existe este perfil?» a un visitante con sesión iniciada, así que la comprobación corre como un bookmarklet dentro de tu propia pestaña de Instagram, en solo lectura, a una petición por segundo. Los resultados vuelven a esta página. Se niega a ejecutarse sin una sesión válida y no marca nada si no puede verificar.",
      "faq.q6": "¿Dónde se guardan mis datos?",
      "faq.a6":
        "En el almacenamiento local de este navegador: tus marcas, asociadas a esa exportación concreta. Nada se sincroniza, y «Restablecer» lo borra.",
      "faq.more": "Notas de privacidad completas →",

      "cta.title": "Listo cuando tú lo estés.",
      "cta.body": "Gratis, sin cuenta, funciona en tu móvil. Unos cinco segundos de ZIP a lista.",

      "footer.tagline": "Una herramienta local para auditar a quién sigues en Instagram. Gratis y de código abierto bajo MIT.",
      "footer.product": "Producto",
      "footer.project": "Proyecto",
      "footer.source": "Código fuente",
      "footer.trouble": "Solución de problemas",
      "footer.note": "Sin afiliación con Instagram ni Meta. Tu exportación se queda en tu dispositivo.",

      "app.title": "Suelta tu exportación. Obtén la lista.",
      "app.lede":
        "Tu ZIP se lee dentro de esta pestaña — nunca se sube. Si aún no tienes el archivo, consigue tu exportación en 2 minutos con <a href=\"tutorials.html#download\">la guía</a>.",
      "app.dropBig": "Suelta tu exportación .zip aquí",
      "app.dropSmall": "o toca para elegir un archivo — se recomienda JSON, también se admite HTML",
      "app.pill1": "🔒 100% local — sin subida, sin servidor",
      "app.pill2": "⚡ Analiza en segundos",
      "app.pill3": "📱 Funciona en el móvil",
      "app.pill4": "🧾 Recuentos exactos, verificados",
      "app.reading": "Leyendo la exportación…",
      "app.comparing": "Comparando listas…",
      "app.largeExport":
        "Exportación grande ({mb} MB) — en un móvil puede tardar un minuto. ",
      "app.loadDifferent": "Cargar otra exportación",
      "app.search": "Buscar nombre de usuario",
      "app.openNext": "Abrir siguiente y marcar ↗",
      "app.tab.notFollowingBack": "No te siguen",
      "app.tab.fans": "Solo te siguen a ti",
      "app.tab.mutual": "Mutuos",
      "app.hideChecked": "Ocultar marcados",
      "app.hideGone": "Ocultar cuentas desaparecidas",
      "app.checkedOf": "{n} / {m} marcados",
      "app.goneSuffix": "· {n} desaparecidas",
      "app.copyList": "Copiar nombres",
      "app.csv": "CSV",
      "app.reset": "Restablecer",
      "app.showMore": "Mostrar {n} más de {m}",

      "stats.following": "Seguidos",
      "stats.followers": "Seguidores",
      "stats.notFollowingBack": "No te siguen",
      "stats.fans": "Solo te siguen a ti",
      "stats.mutual": "Mutuos",

      "list.noMatch": "Nada coincide con este filtro.",
      "list.allGood": "Todos a los que sigues te siguen.",
      "list.empty": "Esta lista está vacía.",

      "row.checkOff": "Marcar @{u}",
      "row.openProfile": "Abrir perfil",
      "row.openOn": "Abrir @{u} en Instagram",
      "row.markGone": "Marcar como desaparecida (borrada o desactivada)",
      "row.unmarkGone": "Quitar marca de desaparecida",
      "row.gone": "desaparecida",
      "row.exists": "existe",

      "history.title": "Cambios desde tu última exportación",
      "history.saved": "{n} guardadas",
      "history.lede":
        "Las exportaciones que importas se recuerdan en este navegador (las últimas). Elige una anterior abajo y la página muestra exactamente qué cambió entre las dos instantáneas: quién te dejó de seguir, quién empezó a seguirte, a quién dejaste de seguir y a quién empezaste a seguir.",
      "history.noneYet":
        "Las instantáneas de tus exportaciones se guardan aquí. La próxima vez que importes una exportación más nueva, los cambios exactos entre ambas aparecerán en este panel.",
      "history.onlyCurrent":
        "Por ahora solo está guardada la exportación actual. Impórtala otra vez el mes que viene — o cuando descargues una más nueva — y este panel mostrará quién te siguió y te dejó de seguir mientras tanto.",
      "history.select": "Elige la exportación anterior para comparar",
      "history.compare": "Comparar",
      "history.note": "Cambios entre {when} y ahora.",
      "history.unfollowedYou": "Te dejaron de seguir",
      "history.newFollowers": "Nuevos seguidores",
      "history.youUnfollowed": "Dejaste de seguir",
      "history.newlyFollowed": "Empezaste a seguir",
      "history.copy": "Copiar",
      "history.nothing": "Nada aquí.",
      "history.reimport":
        "Vuelve a importar tu exportación actual una vez para activar la comparación (sus listas completas no se guardaron en el almacenamiento local).",

      "verify.title": "Encontrar cuentas borradas o desactivadas",
      "verify.badge": "opcional",
      "verify.lede":
        "Instagram solo responde «¿existe esta cuenta?» a una sesión iniciada — cada URL de perfil devuelve la misma página genérica si no tienes sesión. Abajo hay dos formas de obtener esa respuesta: un servicio verificador compartido, o un script de un clic que corre en tu propia pestaña.",
      "verify.opt1.title": "Opción 1 — comprobación por servidor",
      "verify.opt1.badge": "la más rápida",
      "verify.opt1.body":
        "Enviamos solo los nombres de esta lista a un pequeño servicio verificador, que pregunta a Instagram si cada perfil sigue existiendo. Tu exportación, tu cuenta y tu sesión nunca salen de tu navegador — el servicio no sabe quién eres, y responde con su propia capacidad.",
      "verify.opt1.button": "Comprobar estas cuentas",
      "verify.opt2.title": "Opción 2 — hazlo tú",
      "verify.opt2.badge": "siempre funciona",
      "verify.opt2.body":
        "Corre en tu propia pestaña de Instagram con tu propia sesión. Más lento de configurar, pero nunca depende de nuestro servicio y funciona aunque estés limitado en otros sitios.",
      "verify.opt2.step1":
        "Arrastra este botón a tu barra de marcadores (escritorio) — o usa Copiar el script y pégalo en el campo URL de un marcador nuevo:",
      "verify.opt2.step2":
        "Abre <a href=\"https://www.instagram.com/\" target=\"_blank\" rel=\"noopener\">instagram.com</a> en ese mismo navegador y asegúrate de tener sesión iniciada.",
      "verify.opt2.step3":
        "Pulsa el marcador. Aparece un panel y comprueba las cuentas una a una (~1 por segundo).",
      "verify.opt2.step4":
        "Al terminar, copia los resultados y vuelve a abrir esta página con ellos rellenados.",
      "verify.pastePrompt": "¿Tienes los resultados como texto? Pégalos aquí:",
      "verify.apply": "Aplicar resultados",
      "verify.clearGone": "Borrar marcas de desaparecidas",
      "verify.phoneNote":
        "En el móvil los bookmarklets no funcionan — usa el botón de marcar como desaparecida en cualquier fila tras abrir un perfil y ver «Sorry, this page isn't available».",
      "verify.bm.check": "Comprobar {n} cuentas",
      "verify.bm.copy": "Copiar el script",
      "verify.bm.copied": "Copiado ✓",
      "verify.bm.copiedToast":
        "Script copiado — pégalo en el campo URL de un marcador nuevo.",
      "verify.bm.copyFailed": "No se pudo copiar — arrastra el botón.",
      "verify.bm.note":
        "Los bookmarklets están bloqueados en algunos móviles y en el navegador integrado de Instagram — abre este sitio en un navegador real y usa el botón manual de marcar en el móvil.",
      "verify.slot.empty": "Nada que comprobar — la lista está vacía.",

      "devices.title": "Mover el progreso entre dispositivos",
      "devices.lede":
        "Las marcas viven solo en este navegador. Descárgalas como archivo pequeño para continuar en otro dispositivo, o para guardarlas antes de borrar los datos del navegador.",
      "devices.download": "Descargar progreso",
      "devices.restore": "Restaurar desde archivo",
      "devices.savedNote": "Guardadas {n} marca(s) y {m} desaparecidas.",
      "devices.restoredNote": "Restaurado — {n} marca(s), {m} desaparecidas ({added} nuevas).",

      "integrity.title": "Integridad de la exportación",
      "integrity.badge.ok": "completa",
      "integrity.badge.warn": "incompleta",
      "integrity.badge.dup": "{n} duplicados",
      "integrity.summary":
        "Leídos {files} archivo(s) de listas, {rows} fila(s); {dups} duplicado(s) descartado(s), {skipped} fila(s) ilegibles. Formato: {format}.",
      "integrity.file": "Archivo",
      "integrity.list": "Lista",
      "integrity.rows": "Filas",
      "integrity.reported":
        "La página de estadísticas de Instagram reportó {reported} seguidores al exportar; esta exportación lista {listed}.",
      "integrity.noReport":
        "No hay página de estadísticas en esta exportación, así que el recuento de seguidores no pudo contrastarse con la cifra de Instagram.",

      "toast.importFirst": "Importa una exportación primero.",
      "toast.cannotRead":
        "Ese archivo no se pudo leer. Comprueba que es el .zip que te envió Instagram.",
      "toast.zipReaderFailed":
        "El lector ZIP no cargó. Comprueba tu conexión y recarga la página.",
      "toast.nothingToCheck": "No hay nada que comprobar.",
      "toast.contacting": "Contactando con el servicio verificador…",
      "toast.unreachable":
        "No se pudo contactar con el servicio. Usa la Opción 2 (el bookmarklet).",
      "toast.noSession":
        "El servicio aún no tiene una sesión de Instagram configurada. Usa la Opción 2 — funciona hoy.",
      "toast.serviceDown":
        "El servicio no puede conectar con Instagram ahora mismo. Usa la Opción 2.",
      "toast.rateLimited":
        "El servicio está ocupado (límite de peticiones). Espera un minuto o usa la Opción 2.",
      "toast.serviceError":
        "El servicio devolvió un error ({code}). Usa la Opción 2.",
      "toast.nothingClassified": "El servicio no pudo clasificar nada esta vez.",
      "toast.serverProgress": "Comprobadas {done} de {total} — {gone} desaparecidas, {exist} existen, {unknown} desconocidas.",
      "toast.serverDone": "Hecho — {gone} desaparecidas, {exist} existen, {unknown} desconocidas.",
      "toast.allChecked": "Todo en esta lista está marcado.",
      "toast.openedAndChecked": "Abierto @{u} y marcado.",
      "toast.nothingToCopy": "Nada que copiar.",
      "toast.copiedN": "Copiados {n} nombres.",
      "toast.copyFallback": "No se pudo copiar — usa el CSV.",
      "toast.csvDone": "CSV descargado.",
      "toast.nothingToReset": "Nada que restablecer.",
      "toast.confirmReset":
        "¿Borrar todas las marcas de esta exportación? Las desaparecidas se conservan.",
      "toast.resetDone": "Marcas borradas.",
      "toast.pasteFirst": "Pega primero la salida del verificador.",
      "toast.notVerifierOutput": "Eso no parece salida del verificador.",
      "toast.noDeadList": "No hay lista \"dead\" en esa salida.",
      "toast.verifyPending":
        "Resultados guardados — importa tu exportación para aplicarlos.",
      "toast.markedGone": "Marcadas {n} cuenta(s) como desaparecidas, {m} confirmadas que existen.",
      "toast.noGoneMarks": "No hay marcas que borrar.",
      "toast.goneCleared": "Marcas borradas.",
      "toast.restoreFirst": "Importa tu exportación primero y luego restaura el progreso.",
      "toast.notJson": "Ese archivo no es JSON válido.",
      "toast.notProgress": "Eso no parece un archivo de progreso.",
      "toast.confirmMerge":
        "Ese progreso pertenece a otra exportación. ¿Fusionarlo en esta de todos modos?",
      "toast.restoredN": "Restauradas {n} marca(s).",
      "toast.notALink": "No se pudo leer el resultado del verificador del enlace.",
    },

    /* ---------------------------------------------------------------
       Português
    --------------------------------------------------------------- */
    pt: {
      "nav.features": "Funções",
      "nav.tutorials": "Tutoriais",
      "nav.privacy": "Privacidade",
      "nav.tool": "Abrir a ferramenta",
      "nav.home": "Início",
      "nav.github": "GitHub",

      "hero.eyebrow": "Grátis · código aberto · sem login",
      "hero.title": "Descubra exatamente quem não segue você de volta.",
      "hero.lede":
        "Solte a exportação de dados do seu Instagram e receba a lista real em segundos — incluindo os fãs que você nunca seguiu de volta e as contas mortas que ainda estão na sua lista. Tudo é calculado dentro da sua própria aba do navegador.",
      "hero.cta": "Abrir a ferramenta →",
      "hero.getExport": "Obter sua exportação (2 min)",
      "hero.check1": "Sem senha, sem scraping, sem automação",
      "hero.check2": "Seu ZIP nunca sai do seu dispositivo",
      "hero.check3": "Funciona no celular, e é grátis para sempre",

      "features.title": "Tudo o que você precisa para limpar quem você segue",
      "features.sub":
        "Não é uma captura das contas — são as listas reais, com os casos chatos resolvidos.",
      "features.exact.title": "Contagens exatas",
      "features.exact.body":
        "Seguindo, seguidores, mútuos, fãs e não-seguem-de-volta, reconciliados por nomes em minúsculas com linhas duplicadas descartadas. Arquivos divididos, exportações HTML e links antigos /_u/ são processados.",
      "features.integrity.title": "Painel de integridade",
      "features.integrity.body":
        "Veja exatamente quais arquivos foram lidos, quantas linhas cada um tinha, quantos duplicados foram descartados e se a própria página de insights do Instagram discorda da sua lista de seguidores.",
      "features.loop.title": "Abrir o próximo e marcar",
      "features.loop.body":
        "Um botão abre o próximo perfil sem marcar em uma nova aba e registra, para você nunca perder o lugar. O progresso é salvo por exportação, não globalmente.",
      "features.dead.title": "Detector de contas mortas",
      "features.dead.body":
        "O Instagram esconde contas excluídas e desativadas à vista de todos. Rode a verificação opcional de um clique dentro da sua própria aba logada e elas são sinalizadas.",
      "features.export.title": "Leve a lista com você",
      "features.export.body":
        "Pesquise, filtre, copie os nomes ou baixe um CSV com datas de seguida e status de verificação. Não é preciso conta para exportar.",
      "features.diff.title": "Mudanças entre exportações",
      "features.diff.body":
        "Importe uma exportação mais nova quando quiser e veja exatamente quem deixou de te seguir, quem começou a te seguir, quem você deixou de seguir e quem você passou a seguir — calculado localmente entre as duas capturas.",
      "features.local.title": "Verdadeiramente local",
      "features.local.body":
        "Sem backend, sem análise, sem scripts de terceiros. O leitor ZIP vem embutido na página, então o site funciona com a rede desligada.",

      "steps.title": "Três passos",
      "steps.one.title": "Baixe sua exportação",
      "steps.one.body":
        "Accounts Center → Suas informações e permissões → Baixar suas informações. Escolha JSON e marque apenas Seguidores e seguindo para o arquivo ficar pequeno.",
      "steps.one.link": "Passo a passo →",
      "steps.two.title": "Solte o ZIP",
      "steps.two.body":
        "A página lê na memória e compara as duas listas localmente. Uma exportação de 450 MB leva cerca de cinco segundos; nada é transmitido.",
      "steps.two.link": "Abrir a ferramenta →",
      "steps.three.title": "Trabalhe a lista",
      "steps.three.body":
        "Toque em Abrir o próximo e marcar e desça a lista. Marque contas mortas como sumidas. Volte quando quiser — seu progresso é lembrado.",
      "steps.three.link": "Como funciona o ciclo de limpeza →",

      "faq.title": "Perguntas que as pessoas realmente fazem",
      "faq.q1": "Isso é permitido? O Instagram me bane?",
      "faq.a1":
        "Você está lendo um arquivo que o Instagram te deu. Não há automação, scraping nem login, então não há nada do que eles possam agir. A ferramenta nunca deixa de seguir por você — você mesmo clica em \"Deixar de seguir\".",
      "faq.q2": "Por que não deixa de seguir automaticamente?",
      "faq.a2":
        "O Instagram não tem API pública para deixar de seguir, e qualquer site que oferece \"unfollow em massa\" está rodando sua senha num scraper ou quebrando os termos. O ciclo seguro é: abrir perfil → tocar em \"Deixar de seguir\" → voltar → próximo.",
      "faq.q3": "Minha exportação é HTML. Funciona mesmo assim?",
      "faq.a3":
        "Sim, mas exportações HTML descartam silenciosamente linhas antigas de listas longas, o que pode fazer seguidores reais parecerem não-seguidores. O painel de integridade sinaliza. Baixe novamente em JSON para uma resposta exata.",
      "faq.q4": "Alguém aparece como não seguindo de volta, mas tenho certeza que segue.",
      "faq.a4":
        "Três razões honestas: a exportação é uma fotografia (de um ou dois dias atrás em contas grandes), é uma exportação HTML, ou as duas listas foram capturadas em momentos diferentes. Nada está errado nas contas nesses casos — veja a solução de problemas.",
      "faq.q5": "Como encontra contas excluídas?",
      "faq.a5":
        "O Instagram só responde \"este perfil existe?\" para um visitante logado, então a verificação roda como um bookmarklet dentro da sua própria aba do Instagram, somente leitura, cerca de uma requisição por segundo. Os resultados voltam para esta página. Ela se recusa a rodar sem uma sessão válida e não marca nada se não conseguir verificar.",
      "faq.q6": "Onde ficam meus dados?",
      "faq.a6":
        "No armazenamento local deste navegador: suas marcas, associadas a essa exportação específica. Nada é sincronizado, e \"Redefinir\" apaga.",
      "faq.more": "Notas de privacidade completas →",

      "cta.title": "Pronto quando você estiver.",
      "cta.body": "Grátis, sem conta, funciona no celular. Cerca de cinco segundos do ZIP à lista.",

      "footer.tagline": "Uma ferramenta local para auditar quem você segue no Instagram. Grátis e de código aberto sob MIT.",
      "footer.product": "Produto",
      "footer.project": "Projeto",
      "footer.source": "Código-fonte",
      "footer.trouble": "Solução de problemas",
      "footer.note": "Sem afiliação com Instagram ou Meta. Sua exportação fica no seu dispositivo.",

      "app.title": "Solte sua exportação. Receba a lista.",
      "app.lede":
        "Seu ZIP é lido dentro desta aba — nunca é enviado. Se você ainda não tem o arquivo, obtenha sua exportação em 2 minutos pelo <a href=\"tutorials.html#download\">guia</a>.",
      "app.dropBig": "Solte sua exportação .zip aqui",
      "app.dropSmall": "ou toque para escolher um arquivo — JSON é recomendado, HTML também é aceito",
      "app.pill1": "🔒 100% local — sem upload, sem servidor",
      "app.pill2": "⚡ Analisa em segundos",
      "app.pill3": "📱 Funciona no celular",
      "app.pill4": "🧾 Contagens exatas, verificadas",
      "app.reading": "Lendo a exportação…",
      "app.comparing": "Comparando listas…",
      "app.largeExport":
        "Exportação grande ({mb} MB) — no celular pode levar um minuto. ",
      "app.loadDifferent": "Carregar outra exportação",
      "app.search": "Pesquisar nome de usuário",
      "app.openNext": "Abrir o próximo e marcar ↗",
      "app.tab.notFollowingBack": "Não seguem de volta",
      "app.tab.fans": "Só te seguem",
      "app.tab.mutual": "Mútuos",
      "app.hideChecked": "Ocultar marcados",
      "app.hideGone": "Ocultar contas sumidas",
      "app.checkedOf": "{n} / {m} marcados",
      "app.goneSuffix": "· {n} sumidas",
      "app.copyList": "Copiar nomes",
      "app.csv": "CSV",
      "app.reset": "Redefinir",
      "app.showMore": "Mostrar {n} mais de {m}",

      "stats.following": "Seguindo",
      "stats.followers": "Seguidores",
      "stats.notFollowingBack": "Não seguem de volta",
      "stats.fans": "Só te seguem",
      "stats.mutual": "Mútuos",

      "list.noMatch": "Nada corresponde a este filtro.",
      "list.allGood": "Todos que você seguem, te seguem de volta.",
      "list.empty": "Esta lista está vazia.",

      "row.checkOff": "Marcar @{u}",
      "row.openProfile": "Abrir perfil",
      "row.openOn": "Abrir @{u} no Instagram",
      "row.markGone": "Marcar como sumida (excluída ou desativada)",
      "row.unmarkGone": "Desmarcar sumida",
      "row.gone": "sumida",
      "row.exists": "existe",

      "history.title": "Mudanças desde sua última exportação",
      "history.saved": "{n} salvas",
      "history.lede":
        "As exportações importadas ficam guardadas neste navegador (as mais recentes). Escolha uma anterior abaixo e a página mostra exatamente o que mudou entre as duas capturas: quem deixou de te seguir, quem começou a te seguir, quem você deixou de seguir e quem você passou a seguir.",
      "history.noneYet":
        "As capturas das suas exportações ficam guardadas aqui. Na próxima vez que importar uma exportação mais nova, as mudanças exatas entre as duas aparecem neste painel.",
      "history.onlyCurrent":
        "Por enquanto só a exportação atual está guardada. Importe-a de novo no mês que vem — ou quando baixar uma mais nova — e este painel mostra quem te seguiu e deixou de te seguir nesse meio-tempo.",
      "history.select": "Escolha a exportação anterior para comparar",
      "history.compare": "Comparar",
      "history.note": "Mudanças entre {when} e agora.",
      "history.unfollowedYou": "Deixaram de te seguir",
      "history.newFollowers": "Novos seguidores",
      "history.youUnfollowed": "Você deixou de seguir",
      "history.newlyFollowed": "Você passou a seguir",
      "history.copy": "Copiar",
      "history.nothing": "Nada aqui.",
      "history.reimport":
        "Importe novamente sua exportação atual uma vez para ativar a comparação (as listas completas não foram guardadas no armazenamento local).",

      "verify.title": "Encontrar contas excluídas ou desativadas",
      "verify.badge": "opcional",
      "verify.lede":
        "O Instagram só responde \"esta conta ainda existe?\" para uma sessão logada — todo URL de perfil devolve a mesma página genérica quando você está deslogado. Há duas formas de obter essa resposta abaixo: um serviço verificador compartilhado, ou um script de um clique que roda na sua própria aba.",
      "verify.opt1.title": "Opção 1 — verificação por servidor",
      "verify.opt1.badge": "a mais rápida",
      "verify.opt1.body":
        "Enviamos apenas os nomes desta lista a um pequeno serviço verificador, que pergunta ao Instagram se cada perfil ainda existe. Sua exportação, sua conta e sua sessão nunca saem do seu navegador — o serviço não sabe quem você é, e responde com a própria capacidade dele.",
      "verify.opt1.button": "Verificar estas contas",
      "verify.opt2.title": "Opção 2 — rode você mesmo",
      "verify.opt2.badge": "sempre funciona",
      "verify.opt2.body":
        "Roda na sua própria aba do Instagram, com a sua própria sessão. Mais lento de configurar, mas nunca depende do nosso serviço e funciona mesmo se você estiver limitado em outros lugares.",
      "verify.opt2.step1":
        "Arraste este botão para a barra de favoritos (desktop) — ou use Copiar o script e cole no campo URL de um novo favorito:",
      "verify.opt2.step2":
        "Abra <a href=\"https://www.instagram.com/\" target=\"_blank\" rel=\"noopener\">instagram.com</a> nesse mesmo navegador e verifique se está logado.",
      "verify.opt2.step3":
        "Clique no favorito. Um painel aparece e verifica as contas uma a uma (~1 por segundo).",
      "verify.opt2.step4":
        "Ao terminar, copia os resultados e reabre esta página com eles preenchidos.",
      "verify.pastePrompt": "Tem os resultados como texto? Cole aqui:",
      "verify.apply": "Aplicar resultados",
      "verify.clearGone": "Limpar marcas de sumidas",
      "verify.phoneNote":
        "No celular bookmarklets não funcionam — use o botão de marcar como sumida em qualquer linha depois de abrir um perfil e ver \"Sorry, this page isn't available\".",
      "verify.bm.check": "Verificar {n} contas",
      "verify.bm.copy": "Copiar o script",
      "verify.bm.copied": "Copiado ✓",
      "verify.bm.copiedToast":
        "Script copiado — cole no campo URL de um novo favorito.",
      "verify.bm.copyFailed": "Não foi possível copiar — arraste o botão.",
      "verify.bm.note":
        "Bookmarklets são bloqueados em alguns celulares e no navegador integrado do Instagram — abra este site num navegador real e use o botão manual de marcar no celular.",
      "verify.slot.empty": "Nada para verificar — a lista está vazia.",

      "devices.title": "Mover o progresso entre dispositivos",
      "devices.lede":
        "As marcas ficam só neste navegador. Baixe-as como um arquivo pequeno para continuar em outro dispositivo, ou para guardá-las antes de limpar os dados do navegador.",
      "devices.download": "Baixar progresso",
      "devices.restore": "Restaurar de um arquivo",
      "devices.savedNote": "Salvas {n} marcação(ões) e {m} marca(s) de sumida.",
      "devices.restoredNote": "Restaurado — {n} marcação(ões), {m} sumida(s) ({added} novas).",

      "integrity.title": "Integridade da exportação",
      "integrity.badge.ok": "completa",
      "integrity.badge.warn": "incompleta",
      "integrity.badge.dup": "{n} duplicados",
      "integrity.summary":
        "Lidos {files} arquivo(s) de listas, {rows} linha(s); {dups} duplicada(s) descartada(s), {skipped} linha(s) ilegíveis. Formato: {format}.",
      "integrity.file": "Arquivo",
      "integrity.list": "Lista",
      "integrity.rows": "Linhas",
      "integrity.reported":
        "A página de insights do Instagram reportou {reported} seguidores na exportação; esta exportação lista {listed}.",
      "integrity.noReport":
        "Sem página de insights nesta exportação, então a contagem de seguidores não pôde ser confrontada com o número do Instagram.",

      "toast.importFirst": "Importe uma exportação primeiro.",
      "toast.cannotRead":
        "Não foi possível ler esse arquivo. Confirme que é o .zip que o Instagram enviou.",
      "toast.zipReaderFailed":
        "O leitor ZIP falhou ao carregar. Verifique sua conexão e recarregue a página.",
      "toast.nothingToCheck": "Não há nada para verificar.",
      "toast.contacting": "Contactando o serviço verificador…",
      "toast.unreachable":
        "Não foi possível contactar o serviço. Use a Opção 2 (o bookmarklet).",
      "toast.noSession":
        "O serviço ainda não tem uma sessão do Instagram configurada. Use a Opção 2 — funciona hoje.",
      "toast.serviceDown":
        "O serviço não consegue acessar o Instagram agora. Use a Opção 2.",
      "toast.rateLimited":
        "O serviço está ocupado (limite de requisições). Espere um minuto ou use a Opção 2.",
      "toast.serviceError":
        "O serviço retornou um erro ({code}). Use a Opção 2.",
      "toast.nothingClassified": "O serviço não pôde classificar nada desta vez.",
      "toast.serverProgress": "Verificadas {done} de {total} — {gone} sumidas, {exist} existem, {unknown} desconhecidas.",
      "toast.serverDone": "Pronto — {gone} sumidas, {exist} existem, {unknown} desconhecidas.",
      "toast.allChecked": "Tudo nesta lista está marcado.",
      "toast.openedAndChecked": "Aberto @{u} e marcado.",
      "toast.nothingToCopy": "Nada para copiar.",
      "toast.copiedN": "Copiados {n} nomes.",
      "toast.copyFallback": "Não foi possível copiar — use o CSV.",
      "toast.csvDone": "CSV baixado.",
      "toast.nothingToReset": "Nada para redefinir.",
      "toast.confirmReset":
        "Apagar todas as marcações desta exportação? As marcas de sumidas são mantidas.",
      "toast.resetDone": "Marcações apagadas.",
      "toast.pasteFirst": "Cole primeiro a saída do verificador.",
      "toast.notVerifierOutput": "Isso não parece saída do verificador.",
      "toast.noDeadList": "Sem lista \"dead\" nessa saída.",
      "toast.verifyPending":
        "Resultados salvos — importe sua exportação para aplicá-los.",
      "toast.markedGone": "Marcadas {n} conta(s) como sumidas, {m} confirmadas que existem.",
      "toast.noGoneMarks": "Não há marcas para limpar.",
      "toast.goneCleared": "Marcas limpas.",
      "toast.restoreFirst": "Importe sua exportação primeiro, depois restaure o progresso.",
      "toast.notJson": "Esse arquivo não é JSON válido.",
      "toast.notProgress": "Isso não parece um arquivo de progresso.",
      "toast.confirmMerge":
        "Esse progresso pertence a outra exportação. Mesclar nesta mesmo assim?",
      "toast.restoredN": "Restauradas {n} marcação(ões).",
      "toast.notALink": "Não foi possível ler o resultado do verificador no link.",
    },

    /* ---------------------------------------------------------------
       हिन्दी
    --------------------------------------------------------------- */
    hi: {
      "nav.features": "फ़ीचर्स",
      "nav.tutorials": "ट्यूटोरियल",
      "nav.privacy": "प्राइवेसी",
      "nav.tool": "टूल खोलें",
      "nav.home": "होम",
      "nav.github": "GitHub",

      "hero.eyebrow": "मुफ़्त · ओपन सोर्स · बिना लॉगिन",
      "hero.title": "देखिए ठीक-ठीक कौन आपको फ़ॉलो बैक नहीं करता।",
      "hero.lede":
        "अपनी Instagram डेटा एक्सपोर्ट फ़ाइल डालिए और कुछ ही सेकंड में असली लिस्ट पाइए — साथ में वे फ़ैन्स जिन्हें आपने कभी फ़ॉलो बैक नहीं किया, और वे डेड अकाउंट्स जो अब भी आपकी फ़ॉलोइंग में बैठे हैं। सब कुछ आपके अपने ब्राउज़र टैब के अंदर ही निकाला जाता है।",
      "hero.cta": "टूल खोलें →",
      "hero.getExport": "अपनी एक्सपोर्ट लें (2 मिनट)",
      "hero.check1": "कोई पासवर्ड नहीं, कोई स्क्रैपिंग नहीं, कोई ऑटोमेशन नहीं",
      "hero.check2": "आपकी ZIP फ़ाइल कभी आपके डिवाइस से बाहर नहीं जाती",
      "hero.check3": "फ़ोन पर भी चलता है, और हमेशा मुफ़्त है",

      "features.title": "अपनी फ़ॉलोइंग साफ़ करने के लिए जो कुछ भी चाहिए",
      "features.sub":
        "हिसाब का स्क्रीनशॉट नहीं — असली लिस्टें, साथ में उबाऊ एज-केस भी संभाले हुए।",
      "features.exact.title": "सटीक गिनती",
      "features.exact.body":
        "फ़ॉलोइंग, फ़ॉलोअर्स, म्यूचुअल, फ़ैन्स और नॉट-फ़ॉलोइंग-बैक — नाम छोटे अक्षरों में मिलाकर, डुप्लिकेट पंक्तियाँ हटाकर। बँटी हुई फ़ाइलें, HTML एक्सपोर्ट और पुराने /_u/ लिंक सब पार्स होते हैं।",
      "features.integrity.title": "एक्सपोर्ट इंटीग्रिटी पैनल",
      "features.integrity.body":
        "देखिए कौन-सी फ़ाइलें पढ़ी गईं, हर एक में कितनी पंक्तियाँ थीं, कितने डुप्लिकेट हटाए गए, और क्या Instagram का अपना इनसाइट्स पेज आपकी फ़ॉलोअर लिस्ट से असहमत है।",
      "features.loop.title": "अगला खोलें और मार्क करें",
      "features.loop.body":
        "एक बटन अगला बिना-मार्क किया प्रोफ़ाइल नए टैब में खोलता है और दर्ज करता है, ताकि आपकी जगह कभी न बिगड़े। प्रोग्रेस हर एक्सपोर्ट के हिसाब से सेव होती है।",
      "features.dead.title": "डेड-अकाउंट फ़ाइंडर",
      "features.dead.body":
        "Instagram डिलीट और डीएक्टिवेट किए गए अकाउंट्स को सबकी नज़र में छिपा देता है। अपने ही लॉग-इन टैब में वैकल्पिक वन-क्लिक जाँच चलाइए — वे चिह्नित हो जाएँगे।",
      "features.export.title": "लिस्ट साथ ले जाइए",
      "features.export.body":
        "खोजिए, फ़िल्टर कीजिए, नाम कॉपी कीजिए, या फ़ॉलो डेट और वेरिफ़िकेशन स्थिति वाला CSV डाउनलोड कीजिए। एक्सपोर्ट के लिए किसी अकाउंट की ज़रूरत नहीं।",
      "features.diff.title": "दो एक्सपोर्ट के बीच के बदलाव",
      "features.diff.body":
        "जब चाहें नई एक्सपोर्ट इम्पोर्ट कीजिए और देखिए ठीक-ठीक किसने आपको अनफ़ॉलो किया, किसने फ़ॉलो करना शुरू किया, आपने किसे अनफ़ॉलो किया और किसे फ़ॉलो करना शुरू किया — दोनों स्नैपशॉट से स्थानीय रूप से निकाला गया।",
      "features.local.title": "सचमुच लोकल",
      "features.local.body":
        "कोई बैकएंड नहीं, कोई एनालिटिक्स नहीं, कोई थर्ड-पार्टी स्क्रिप्ट नहीं। ZIP रीडर पेज के साथ बंडल है, इसलिए नेटवर्क बंद करके भी साइट चलती है।",

      "steps.title": "तीन कदम",
      "steps.one.title": "अपनी एक्सपोर्ट डाउनलोड कीजिए",
      "steps.one.body":
        "Accounts Center → Your information and permissions → Download your information. JSON चुनिए और सिर्फ़ Followers और following टिक कीजिए ताकि फ़ाइल छोटी रहे।",
      "steps.one.link": "पूरी गाइड →",
      "steps.two.title": "ZIP डालिए",
      "steps.two.body":
        "पेज इसे मेमोरी में पढ़ता है और दोनों लिस्टें स्थानीय रूप से मिलाता है। 450 MB की एक्सपोर्ट में लगभग पाँच सेकंड; कहीं कुछ भी भेजा नहीं जाता।",
      "steps.two.link": "टूल खोलें →",
      "steps.three.title": "लिस्ट पर काम कीजिए",
      "steps.three.body":
        "Open next & check off दबाइए और लिस्ट नीचे तक देखिए। डेड अकाउंट्स को gone मार्क कीजिए। जब चाहें वापस आइए — आपकी प्रोग्रेस याद रहती है।",
      "steps.three.link": "क्लीनअप लूप कैसे चलता है →",

      "faq.title": "सचमुच पूछे जाने वाले सवाल",
      "faq.q1": "क्या यह जायज़ है? Instagram ब्लॉक तो नहीं करेगा?",
      "faq.a1":
        "आप वही फ़ाइल पढ़ रहे हैं जो Instagram ने आपको दी। कोई ऑटोमेशन नहीं, कोई स्क्रैपिंग नहीं, कोई लॉगिन नहीं — इसलिए उनके पास कोई कार्रवाई का आधार नहीं है। टूल कभी आपकी ओर से अनफ़ॉलो नहीं करता — Unfollow बटन आप खुद दबाते हैं।",
      "faq.q2": "यह लोगों को अपने आप अनफ़ॉलो क्यों नहीं करता?",
      "faq.a2":
        "Instagram का कोई पब्लिक अनफ़ॉलो API नहीं है, और \"मास-अनफ़ॉलो\" देने वाली हर साइट या तो आपका पासवर्ड स्क्रैपर से चला रही है या शर्तें तोड़ रही है। सुरक्षित तरीका: प्रोफ़ाइल खोलिए → Unfollow दबाइए → वापस आइए → अगला।",
      "faq.q3": "मेरी एक्सपोर्ट HTML है। क्या फिर भी चलेगा?",
      "faq.a3":
        "हाँ, लेकिन HTML एक्सपोर्ट लंबी लिस्टों की पुरानी पंक्तियाँ चुपचाप हटा देते हैं, जिससे असली फ़ॉलोअर्स भी नॉट-फ़ॉलोअर जैसे दिख सकते हैं। इंटीग्रिटी पैनल इसकी चेतावनी देता है। सटीक जवाब के लिए JSON में दोबारा डाउनलोड कीजिए।",
      "faq.q4": "कोई नॉट-फ़ॉलोइंग-बैक में दिख रहा है, पर मुझे पक्का यक़ीन है कि वह फ़ॉलो करता है।",
      "faq.a4":
        "तीन ईमानदार कारण: एक्सपोर्ट एक स्नैपशॉट है (बड़े अकाउंट्स पर एक-दो दिन पुराना), वह HTML एक्सपोर्ट है, या दोनों लिस्टें अलग-अलग समय पर ली गईं। इन मामलों में हिसाब में कोई दोष नहीं — ट्रबलशूटिंग देखिए।",
      "faq.q5": "डिलीट किए गए अकाउंट्स कैसे पकड़ में आते हैं?",
      "faq.a5":
        "Instagram सिर्फ़ लॉग-इन विज़िटर से ही \"क्या यह प्रोफ़ाइल मौजूद है?\" का जवाब देता है, इसलिए जाँच आपके ही Instagram टैब में बुकमार्कलेट के रूप में चलती है — केवल पढ़ने के लिए, सेकंड में करीब एक रिक्वेस्ट। नतीजे इसी पेज पर वापस आते हैं। अवैध सेशन पर चलने से मना कर देता है और सत्यापन न हो पाने पर कुछ भी मार्क नहीं करता।",
      "faq.q6": "मेरा डेटा कहाँ सेव होता है?",
      "faq.a6":
        "इसी ब्राउज़र के लोकल स्टोरेज में: आपके मार्क, ठीक उसी एक्सपोर्ट से जुड़े। कुछ भी सिंक नहीं होता, और \"Reset\" उसे मिटा देता है।",
      "faq.more": "पूरी प्राइवेसी नोट्स →",

      "cta.title": "जब तैयार हों, तब शुरू।",
      "cta.body": "मुफ़्त, बिना अकाउंट, फ़ोन पर भी। ZIP से लिस्ट तक करीब पाँच सेकंड।",

      "footer.tagline": "Instagram फ़ॉलोइंग ऑडिट के लिए एक लोकल-फ़र्स्ट टूल। MIT के अंतर्गत मुफ़्त और ओपन सोर्स।",
      "footer.product": "प्रोडक्ट",
      "footer.project": "प्रोजेक्ट",
      "footer.source": "सोर्स कोड",
      "footer.trouble": "ट्रबलशूटिंग",
      "footer.note": "Instagram या Meta से कोई संबंध नहीं। आपकी एक्सपोर्ट आपके डिवाइस पर ही रहती है।",

      "app.title": "एक्सपोर्ट डालिए। लिस्ट पाइए।",
      "app.lede":
        "आपकी ZIP इसी टैब में पढ़ी जाती है — कभी अपलोड नहीं होती। फ़ाइल अभी नहीं है तो <a href=\"tutorials.html#download\">गाइड</a> से 2 मिनट में अपनी एक्सपोर्ट लीजिए।",
      "app.dropBig": "अपनी .zip एक्सपोर्ट यहाँ डालिए",
      "app.dropSmall": "या फ़ाइल चुनने के लिए टैप कीजिए — JSON बेहतर, HTML भी चलता है",
      "app.pill1": "🔒 100% लोकल — कोई अपलोड नहीं, कोई सर्वर नहीं",
      "app.pill2": "⚡ सेकंडों में पार्स",
      "app.pill3": "📱 फ़ोन पर चलता है",
      "app.pill4": "🧾 सटीक गिनती, सत्यापित",
      "app.reading": "एक्सपोर्ट पढ़ी जा रही है…",
      "app.comparing": "लिस्टें मिलाई जा रही हैं…",
      "app.largeExport":
        "बड़ी एक्सपोर्ट ({mb} MB) — फ़ोन पर इसमें एक मिनट लग सकता है। ",
      "app.loadDifferent": "दूसरी एक्सपोर्ट लोड कीजिए",
      "app.search": "यूज़रनेम खोजिए",
      "app.openNext": "अगला खोलें और मार्क करें ↗",
      "app.tab.notFollowingBack": "फ़ॉलो बैक नहीं करते",
      "app.tab.fans": "सिर्फ़ आपको फ़ॉलो करते हैं",
      "app.tab.mutual": "म्यूचुअल",
      "app.hideChecked": "मार्क किए छिपाइए",
      "app.hideGone": "Gone अकाउंट्स छिपाइए",
      "app.checkedOf": "{n} / {m} मार्क किए",
      "app.goneSuffix": "· {n} gone",
      "app.copyList": "यूज़रनेम कॉपी करें",
      "app.csv": "CSV",
      "app.reset": "रीसेट",
      "app.showMore": "{m} में से {n} और दिखाइए",

      "stats.following": "फ़ॉलोइंग",
      "stats.followers": "फ़ॉलोअर्स",
      "stats.notFollowingBack": "फ़ॉलो बैक नहीं करते",
      "stats.fans": "सिर्फ़ आपको फ़ॉलो करते हैं",
      "stats.mutual": "म्यूचुअल",

      "list.noMatch": "इस फ़िल्टर से कुछ नहीं मिला।",
      "list.allGood": "आप जिन्हें फ़ॉलो करते हैं, सब आपको फ़ॉलो बैक करते हैं।",
      "list.empty": "यह लिस्ट खाली है।",

      "row.checkOff": "@{u} मार्क कीजिए",
      "row.openProfile": "प्रोफ़ाइल खोलिए",
      "row.openOn": "Instagram पर @{u} खोलिए",
      "row.markGone": "Gone मार्क कीजिए (डिलीट या डीएक्टिवेट)",
      "row.unmarkGone": "Gone मार्क हटाइए",
      "row.gone": "gone",
      "row.exists": "मौजूद",

      "history.title": "आपकी पिछली एक्सपोर्ट के बाद के बदलाव",
      "history.saved": "{n} सेव",
      "history.lede":
        "इम्पोर्ट की गई एक्सपोर्ट इसी ब्राउज़र में याद रहती हैं (नवीनतम कुछ)। नीचे कोई पुरानी चुनिए और पेज ठीक-ठीक दिखाएगा दोनों स्नैपशॉट के बीच क्या बदला: किसने आपको अनफ़ॉलो किया, किसने फ़ॉलो शुरू किया, आपने किसे अनफ़ॉलो किया और किसे फ़ॉलो करना शुरू किया।",
      "history.noneYet":
        "आपकी एक्सपोर्ट के स्नैपशॉट यहीं सेव रहते हैं। अगली बार नई एक्सपोर्ट इम्पोर्ट करने पर दोनों के बीच के सटीक बदलाव इसी पैनल में दिखेंगे।",
      "history.onlyCurrent":
        "अभी सिर्फ़ मौजूदा एक्सपोर्ट सेव है। अगले महीने इसे फिर इम्पोर्ट कीजिए — या जब भी नई एक्सपोर्ट डाउनलोड हो — और यह पैनल दिखाएगा बीच में किसने फ़ॉलो किया और किसने छोड़ा।",
      "history.select": "तुलना के लिए पुरानी एक्सपोर्ट चुनिए",
      "history.compare": "तुलना करें",
      "history.note": "{when} और अब के बीच के बदलाव।",
      "history.unfollowedYou": "आपको अनफ़ॉलो किया",
      "history.newFollowers": "नए फ़ॉलोअर्स",
      "history.youUnfollowed": "आपने अनफ़ॉलो किया",
      "history.newlyFollowed": "आपने फ़ॉलो करना शुरू किया",
      "history.copy": "कॉपी",
      "history.nothing": "यहाँ कुछ नहीं।",
      "history.reimport":
        "तुलना चालू करने के लिए अपनी मौजूदा एक्सपोर्ट एक बार फिर इम्पोर्ट कीजिए (उसकी पूरी लिस्टें लोकल स्टोरेज में सेव नहीं थीं)।",

      "verify.title": "डिलीट या डीएक्टिवेट अकाउंट्स ढूँढिए",
      "verify.badge": "वैकल्पिक",
      "verify.lede":
        "Instagram सिर्फ़ लॉग-इन सेशन से ही \"क्या यह अकाउंट अब भी मौजूद है?\" बताता है — लॉग-आउट में हर प्रोफ़ाइल URL एक जैसा जेनेरिक पेज दिखाता है। नीचे इसके दो तरीके हैं: शेयर किया चेकर सर्विस, या आपके ही टैब में चलने वाला वन-क्लिक स्क्रिप्ट।",
      "verify.opt1.title": "विकल्प 1 — सर्वर जाँच",
      "verify.opt1.badge": "सबसे तेज़",
      "verify.opt1.body":
        "हम इस लिस्ट के सिर्फ़ यूज़रनेम एक छोटी चेकर सर्विस को भेजते हैं, जो Instagram से पूछती है कि हर प्रोफ़ाइल मौजूद है या नहीं। आपकी एक्सपोर्ट, अकाउंट और सेशन कभी ब्राउज़र से बाहर नहीं जाते — सर्विस को पता नहीं होता कि आप कौन हैं।",
      "verify.opt1.button": "ये अकाउंट्स जाँचिए",
      "verify.opt2.title": "विकल्प 2 — खुद चलाइए",
      "verify.opt2.badge": "हमेशा चलता है",
      "verify.opt2.body":
        "यह आपके ही Instagram टैब में, आपके ही सेशन से चलता है। सेटअप धीमा है, पर हमारी सर्विस पर निर्भर नहीं और रेट-लिमिट होने पर भी चलता है।",
      "verify.opt2.step1":
        "यह बटन अपने बुकमार्क्स बार में खींचिए (डेस्कटॉप) — या Copy the script इस्तेमाल कर नए बुकमार्क के URL फ़ील्ड में पेस्ट कीजिए:",
      "verify.opt2.step2":
        "उसी ब्राउज़र में <a href=\"https://www.instagram.com/\" target=\"_blank\" rel=\"noopener\">instagram.com</a> खोलिए और लॉग-इन सुनिश्चित कीजिए।",
      "verify.opt2.step3":
        "बुकमार्क दबाइए। एक पैनल खुलता है और हर अकाउंट एक-एक करके जाँचता है (~1 प्रति सेकंड)।",
      "verify.opt2.step4":
        "पूरा होने पर नतीजे कॉपी होकर यह पेज भरकर फिर खुल जाता है।",
      "verify.pastePrompt": "नतीजे टेक्स्ट के रूप में मिल गए? यहाँ पेस्ट कीजिए:",
      "verify.apply": "नतीजे लागू करें",
      "verify.clearGone": "Gone मार्क मिटाइए",
      "verify.phoneNote":
        "फ़ोन पर बुकमार्कलेट नहीं चलते — किसी प्रोफ़ाइल को खोलकर \"Sorry, this page isn't available\" देखने के बाद किसी भी पंक्ति के mark as gone बटन का इस्तेमाल कीजिए।",
      "verify.bm.check": "{n} अकाउंट्स जाँचिए",
      "verify.bm.copy": "स्क्रिप्ट कॉपी करें",
      "verify.bm.copied": "कॉपी हो गया ✓",
      "verify.bm.copiedToast":
        "स्क्रिप्ट कॉपी हो गई — नए बुकमार्क के URL फ़ील्ड में पेस्ट कीजिए।",
      "verify.bm.copyFailed": "कॉपी नहीं हो सका — बटन खींचिए।",
      "verify.bm.note":
        "कुछ फ़ोनों और Instagram के इन-ऐप ब्राउज़र में बुकमार्कलेट ब्लॉक रहते हैं — यह साइट असली ब्राउज़र में खोलिए और फ़ोन पर मैनुअल मार्क बटन इस्तेमाल कीजिए।",
      "verify.slot.empty": "जाँचने के लिए कुछ नहीं — लिस्ट खाली है।",

      "devices.title": "प्रोग्रेस को दूसरे डिवाइस पर ले जाइए",
      "devices.lede":
        "मार्क सिर्फ़ इसी ब्राउज़र में रहते हैं। उन्हें छोटी फ़ाइल में डाउनलोड कीजिए ताकि दूसरे डिवाइस पर जारी रख सकें, या ब्राउज़र डेटा मिटाने से पहले सुरक्षित रख सकें।",
      "devices.download": "प्रोग्रेस डाउनलोड करें",
      "devices.restore": "फ़ाइल से रिस्टोर करें",
      "devices.savedNote": "{n} मार्क और {m} gone मार्क सेव हुए।",
      "devices.restoredNote": "रिस्टोर हुआ — {n} मार्क, {m} gone मार्क ({added} नए)।",

      "integrity.title": "एक्सपोर्ट इंटीग्रिटी",
      "integrity.badge.ok": "पूरा",
      "integrity.badge.warn": "अधूरा",
      "integrity.badge.dup": "{n} डुप्लिकेट",
      "integrity.summary":
        "{files} लिस्ट फ़ाइल(ें), {rows} पंक्ति(याँ); {dups} डुप्लिकेट हटाए, {skipped} अपठनीय पंक्ति(याँ)। फ़ॉर्मैट: {format}।",
      "integrity.file": "फ़ाइल",
      "integrity.list": "लिस्ट",
      "integrity.rows": "पंक्तियाँ",
      "integrity.reported":
        "Instagram के अपने इनसाइट्स पेज ने एक्सपोर्ट के समय {reported} फ़ॉलोअर्स बताए; यह एक्सपोर्ट {listed} लिस्ट करता है।",
      "integrity.noReport":
        "इस एक्सपोर्ट में इनसाइट्स पेज नहीं है, इसलिए फ़ॉलोअर गिनती Instagram के अपने आँकड़े से तुलना नहीं हो सकी।",

      "toast.importFirst": "पहले कोई एक्सपोर्ट इम्पोर्ट कीजिए।",
      "toast.cannotRead":
        "वह फ़ाइल नहीं पढ़ी जा सकी। सुनिश्चित कीजिए कि वही .zip है जो Instagram ने ईमेल किया था।",
      "toast.zipReaderFailed":
        "ZIP रीडर लोड नहीं हुआ। कनेक्शन जाँचिए और पेज रीलोड कीजिए।",
      "toast.nothingToCheck": "जाँचने के लिए कुछ नहीं।",
      "toast.contacting": "चेकर सर्विस से संपर्क हो रहा है…",
      "toast.unreachable":
        "चेकर सर्विस तक नहीं पहुँचा जा सका. विकल्प 2 (बुकमार्कलेट) इस्तेमाल कीजिए।",
      "toast.noSession":
        "चेकर सर्विस में अभी कोई Instagram सेशन सेट नहीं है। नीचे विकल्प 2 इस्तेमाल कीजिए — वह आज भी चलता है।",
      "toast.serviceDown":
        "सर्विस इस समय Instagram तक नहीं पहुँच पा रही। विकल्प 2 इस्तेमाल कीजिए।",
      "toast.rateLimited":
        "सर्विस व्यस्त है (रेट लिमिट)। एक मिनट रुकिए या विकल्प 2 इस्तेमाल कीजिए।",
      "toast.serviceError":
        "सर्विस ने त्रुटि दी ({code})। विकल्प 2 इस्तेमाल कीजिए।",
      "toast.nothingClassified": "सर्विस इस बार कुछ भी वर्गीकृत नहीं कर सकी।",
      "toast.serverProgress": "{total} में से {done} जाँचे — {gone} gone, {exist} मौजूद, {unknown} अज्ञात।",
      "toast.serverDone": "हो गया — {gone} gone, {exist} मौजूद, {unknown} अज्ञात।",
      "toast.allChecked": "इस लिस्ट का सब मार्क हो चुका है।",
      "toast.openedAndChecked": "@{u} खोलकर मार्क कर दिया।",
      "toast.nothingToCopy": "कॉपी करने के लिए कुछ नहीं।",
      "toast.copiedN": "{n} यूज़रनेम कॉपी हुए।",
      "toast.copyFallback": "कॉपी नहीं हो सका — CSV इस्तेमाल कीजिए।",
      "toast.csvDone": "CSV डाउनलोड हो गया।",
      "toast.nothingToReset": "रीसेट करने के लिए कुछ नहीं।",
      "toast.confirmReset": "इस एक्सपोर्ट के सारे मार्क मिटा दें? Gone मार्क बने रहेंगे।",
      "toast.resetDone": "मार्क मिटा दिए।",
      "toast.pasteFirst": "पहले वेरिफ़ायर का आउटपुट पेस्ट कीजिए।",
      "toast.notVerifierOutput": "यह वेरिफ़ायर आउटपुट जैसा नहीं लगता।",
      "toast.noDeadList": "उस आउटपुट में कोई \"dead\" लिस्ट नहीं है।",
      "toast.verifyPending":
        "वेरिफ़ायर नतीजे सेव हो गए — लागू करने के लिए अपनी एक्सपोर्ट इम्पोर्ट कीजिए।",
      "toast.markedGone": "{n} अकाउंट gone मार्क हुए, {m} की मौजूदगी पक्की हुई।",
      "toast.noGoneMarks": "मिटाने लायक कोई gone मार्क नहीं।",
      "toast.goneCleared": "Gone मार्क मिटा दिए।",
      "toast.restoreFirst": "पहले अपनी एक्सपोर्ट इम्पोर्ट कीजिए, फिर प्रोग्रेस रिस्टोर कीजिए।",
      "toast.notJson": "वह फ़ाइल मान्य JSON नहीं है।",
      "toast.notProgress": "यह प्रोग्रेस फ़ाइल जैसा नहीं लगता।",
      "toast.confirmMerge":
        "वह प्रोग्रेस किसी और एक्सपोर्ट का है। फिर भी इसमें मिला दें?",
      "toast.restoredN": "{n} मार्क रिस्टोर हुए।",
      "toast.notALink": "लिंक से वेरिफ़ायर का नतीजा नहीं पढ़ा जा सका।",
    },

    /* ---------------------------------------------------------------
       Bahasa Indonesia
    --------------------------------------------------------------- */
    id: {
      "nav.features": "Fitur",
      "nav.tutorials": "Tutorial",
      "nav.privacy": "Privasi",
      "nav.tool": "Buka alatnya",
      "nav.home": "Beranda",
      "nav.github": "GitHub",

      "hero.eyebrow": "Gratis · open source · tanpa login",
      "hero.title": "Lihat dengan tepat siapa yang tidak follow back.",
      "hero.lede":
        "Jatuhkan file export data Instagram-mu dan dapatkan daftar aslinya dalam hitungan detik — termasuk fans yang belum pernah kamu follow back, dan akun-akun mati yang masih nanggung di daftar following-mu. Semuanya dihitung di dalam tab browser-mu sendiri.",
      "hero.cta": "Buka alatnya →",
      "hero.getExport": "Ambil export-mu (2 menit)",
      "hero.check1": "Tanpa password, tanpa scraping, tanpa otomatisasi",
      "hero.check2": "ZIP-mu tidak pernah keluar dari perangkatmu",
      "hero.check3": "Jalan di ponsel, dan gratis selamanya",

      "features.title": "Semua yang kamu butuhkan untuk membereskan daftar following",
      "features.sub":
        "Bukan tangkapan layar dari perhitungannya — daftar yang asli, dengan kasus-kasus menjengkelkan sudah ditangani.",
      "features.exact.title": "Hitungan persis",
      "features.exact.body":
        "Following, followers, mutual, fans, dan tidak-follow-back, direkonsiliasi dengan nama huruf kecil dan baris duplikat dibuang. File terpisah, export HTML, dan link /_u/ lama semua terbaca.",
      "features.integrity.title": "Panel integritas export",
      "features.integrity.body":
        "Lihat persis file mana yang dibaca, berapa baris tiap file, berapa duplikat yang dibuang, dan apakah halaman insights milik Instagram sendiri berbeda dengan daftar followers-mu.",
      "features.loop.title": "Buka berikutnya & centang",
      "features.loop.body":
        "Satu tombol membuka profil berikutnya yang belum dicentang di tab baru dan mencatatnya, jadi posismu tidak pernah hilang. Progres disimpan per export, bukan global.",
      "features.dead.title": "Pendeteksi akun mati",
      "features.dead.body":
        "Instagram menyembunyikan akun yang dihapus dan dinonaktifkan di tempat terbuka. Jalankan pemeriksaan opsional satu-klik di dalam tab Instagram-mu yang sudah login dan mereka ditandai.",
      "features.export.title": "Bawa daftarnya pergi",
      "features.export.body":
        "Cari, saring, salin nama penggunanya, atau unduh CSV yang berisi tanggal follow dan status verifikasi. Tidak perlu akun untuk export.",
      "features.diff.title": "Perubahan antar export",
      "features.diff.body":
        "Impor export yang lebih baru kapan saja dan lihat persis siapa yang berhenti mengikutimu, siapa yang mulai mengikuti, siapa yang kamu unfollow, dan siapa yang baru kamu follow — dihitung lokal dari dua snapshot.",
      "features.local.title": "Benar-benar lokal",
      "features.local.body":
        "Tanpa backend, tanpa analitik, tanpa skrip pihak ketiga. Pembaca ZIP dibundel dengan halaman, jadi situs tetap jalan walau jaringan dimatikan.",

      "steps.title": "Tiga langkah",
      "steps.one.title": "Unduh export-mu",
      "steps.one.body":
        "Accounts Center → Your information and permissions → Download your information. Pilih JSON dan centang hanya Followers dan following supaya filenya kecil.",
      "steps.one.link": "Panduan lengkap →",
      "steps.two.title": "Jatuhkan ZIP-nya",
      "steps.two.body":
        "Halaman membacanya di memori dan membandingkan kedua daftar secara lokal. Export 450 MB butuh sekitar lima detik; tidak ada yang dikirim ke mana pun.",
      "steps.two.link": "Buka alatnya →",
      "steps.three.title": "Kerjakan daftarnya",
      "steps.three.body":
        "Tekan Open next & check off dan turuni daftarnya. Tandai akun mati sebagai gone. Kembali kapan saja — progresmu diingat.",
      "steps.three.link": "Cara kerja siklus bersih-bersih →",

      "faq.title": "Pertanyaan yang benar-benar sering ditanya",
      "faq.q1": "Ini diizinkan? Instagram bakal bantumi?",
      "faq.a1":
        "Kamu membaca file yang Instagram sendiri berikan. Tidak ada otomatisasi, scraping, atau login, jadi tidak ada yang bisa mereka eksekusi. Alat ini tidak pernah unfollow untukmu — tombol Unfollow kamu yang menekannya sendiri.",
      "faq.q2": "Kenapa tidak unfollow otomatis?",
      "faq.a2":
        "Instagram tidak punya API publik untuk unfollow, dan situs mana pun yang menawarkan \"mass unfollow\" sedang menjalankan password-mu lewat scraper atau melanggar ketentuan. Siklus yang aman: buka profil → tekan Unfollow → kembali → berikutnya.",
      "faq.q3": "Export-ku HTML. Tetap jalan?",
      "faq.a3":
        "Jalan, tapi export HTML diam-diam membuang baris lama dari daftar panjang, yang bisa membuat followers asli terlihat seperti tidak mengikuti. Panel integritas menandainya. Unduh ulang dalam JSON untuk jawaban yang persis.",
      "faq.q4": "Seseorang muncul sebagai tidak follow back, padahal aku yakin dia follow.",
      "faq.a4":
        "Tiga alasan yang jujur: export adalah snapshot (umur satu-dua hari di akun besar), itu export HTML, atau kedua daftar diambil pada waktu berbeda. Tidak ada yang salah dengan hitungannya dalam kasus itu — lihat pemecahan masalah.",
      "faq.q5": "Bagaimana akun yang dihapus bisa ditemukan?",
      "faq.a5":
        "Instagram hanya menjawab \"apakah profil ini masih ada?\" untuk pengunjung yang login, jadi pemeriksaannya berjalan sebagai bookmarklet di dalam tab Instagram-mu sendiri, hanya-baca, sekitar satu permintaan per detik. Hasilnya kembali ke halaman ini. Menolak jalan tanpa sesi yang sah dan tidak menandai apa pun kalau tidak bisa memverifikasi.",
      "faq.q6": "Data-ku disimpan di mana?",
      "faq.a6":
        "Di penyimpanan lokal browser ini: tanda-tandamu, terikat ke export spesifik itu. Tidak ada yang disinkronkan, dan \"Reset\" menghapusnya.",
      "faq.more": "Catatan privasi lengkap →",

      "cta.title": "Saat kamu siap.",
      "cta.body": "Gratis, tanpa akun, jalan di ponsel. Sekitar lima detik dari ZIP ke daftar.",

      "footer.tagline": "Alat lokal untuk mengaudit following Instagram-mu. Gratis dan open source di bawah MIT.",
      "footer.product": "Produk",
      "footer.project": "Proyek",
      "footer.source": "Kode sumber",
      "footer.trouble": "Pemecahan masalah",
      "footer.note": "Tidak berafiliasi dengan Instagram atau Meta. Export-mu tetap di perangkatmu.",

      "app.title": "Jatuhkan export-mu. Dapatkan daftarnya.",
      "app.lede":
        "ZIP-mu dibaca di dalam tab ini — tidak pernah diunggah. Belum punya filenya? Ambil export-mu dalam 2 menit lewat <a href=\"tutorials.html#download\">panduannya</a>.",
      "app.dropBig": "Jatuhkan export .zip-mu di sini",
      "app.dropSmall": "atau ketuk untuk memilih file — JSON direkomendasikan, HTML juga didukung",
      "app.pill1": "🔒 100% lokal — tanpa unggahan, tanpa server",
      "app.pill2": "⚡ Diurai dalam hitungan detik",
      "app.pill3": "📱 Jalan di ponsel",
      "app.pill4": "🧾 Hitungan persis, terverifikasi",
      "app.reading": "Membaca export…",
      "app.comparing": "Membandingkan daftar…",
      "app.largeExport":
        "Export besar ({mb} MB) — di ponsel bisa butuh satu menit. ",
      "app.loadDifferent": "Muat export lain",
      "app.search": "Cari nama pengguna",
      "app.openNext": "Buka berikutnya & centang ↗",
      "app.tab.notFollowingBack": "Tidak follow back",
      "app.tab.fans": "Hanya mengikutimu",
      "app.tab.mutual": "Mutual",
      "app.hideChecked": "Sembunyikan yang dicentang",
      "app.hideGone": "Sembunyikan akun gone",
      "app.checkedOf": "{n} / {m} dicentang",
      "app.goneSuffix": "· {n} gone",
      "app.copyList": "Salin nama pengguna",
      "app.csv": "CSV",
      "app.reset": "Reset",
      "app.showMore": "Tampilkan {n} lagi dari {m}",

      "stats.following": "Following",
      "stats.followers": "Followers",
      "stats.notFollowingBack": "Tidak follow back",
      "stats.fans": "Hanya mengikutimu",
      "stats.mutual": "Mutual",

      "list.noMatch": "Tidak ada yang cocok dengan saringan ini.",
      "list.allGood": "Semua yang kamu follow, follow kamu balik.",
      "list.empty": "Daftar ini kosong.",

      "row.checkOff": "Centang @{u}",
      "row.openProfile": "Buka profil",
      "row.openOn": "Buka @{u} di Instagram",
      "row.markGone": "Tandai gone (dihapus atau dinonaktifkan)",
      "row.unmarkGone": "Batalkan tanda gone",
      "row.gone": "gone",
      "row.exists": "ada",

      "history.title": "Perubahan sejak export terakhirmu",
      "history.saved": "{n} tersimpan",
      "history.lede":
        "Export yang kamu impor diingat di browser ini (beberapa terbaru). Pilih yang lebih lama di bawah dan halaman menunjukkan persis apa yang berubah di antara kedua snapshot: siapa yang berhenti mengikutimu, siapa yang mulai mengikuti, siapa yang kamu unfollow, dan siapa yang baru kamu follow.",
      "history.noneYet":
        "Snapshot export-mu disimpan di sini. Lain kali kamu mengimpor export yang lebih baru, perubahan persis di antara keduanya muncul di panel ini.",
      "history.onlyCurrent":
        "Sejauh ini hanya export terkini yang tersimpan. Impor lagi bulan depan — atau setiap kali mengunduh export lebih baru — dan panel ini menunjukkan siapa yang mengikutimu dan berhenti di sela itu.",
      "history.select": "Pilih export lama untuk dibandingkan",
      "history.compare": "Bandingkan",
      "history.note": "Perubahan antara {when} dan sekarang.",
      "history.unfollowedYou": "Berhenti mengikutimu",
      "history.newFollowers": "Pengikut baru",
      "history.youUnfollowed": "Kamu unfollow",
      "history.newlyFollowed": "Baru kamu follow",
      "history.copy": "Salin",
      "history.nothing": "Tidak ada apa pun di sini.",
      "history.reimport":
        "Impor sekali lagi export terkinimu untuk mengaktifkan perbandingan (daftar lengkapnya tidak tersimpan di penyimpanan lokal).",

      "verify.title": "Temukan akun yang dihapus atau dinonaktifkan",
      "verify.badge": "opsional",
      "verify.lede":
        "Instagram hanya menjawab \"apakah akun ini masih ada?\" untuk sesi yang login — setiap URL profil mengembalikan halaman generik yang sama saat kamu logout. Ada dua cara di bawah: layanan pemeriksa bersama, atau skrip satu-klik yang berjalan di tab-mu sendiri.",
      "verify.opt1.title": "Opsi 1 — pemeriksaan lewat server",
      "verify.opt1.badge": "tercepat",
      "verify.opt1.body":
        "Kami hanya mengirim nama pengguna di daftar ini ke layanan pemeriksa kecil, yang menanyakan ke Instagram apakah tiap profil masih ada. Export, akun, dan sesimu tidak pernah keluar dari browser — layanan tidak tahu siapa kamu.",
      "verify.opt1.button": "Periksa akun-akun ini",
      "verify.opt2.title": "Opsi 2 — jalankan sendiri",
      "verify.opt2.badge": "selalu jalan",
      "verify.opt2.body":
        "Berjalan di tab Instagram-mu sendiri dengan sesimu sendiri. Lebih lambat disiapkan, tapi tidak pernah bergantung pada layanan kami dan tetap jalan walau kena rate limit di tempat lain.",
      "verify.opt2.step1":
        "Seret tombol ini ke bar bookmark (desktop) — atau pakai Salin skrip dan tempel ke kolom URL bookmark baru:",
      "verify.opt2.step2":
        "Buka <a href=\"https://www.instagram.com/\" target=\"_blank\" rel=\"noopener\">instagram.com</a> di browser yang sama dan pastikan kamu sudah login.",
      "verify.opt2.step3":
        "Klik bookmarknya. Panel muncul dan memeriksa setiap akun satu per satu (~1 per detik).",
      "verify.opt2.step4":
        "Setelah selesai, hasilnya disalin dan halaman ini terbuka kembali dengan data terisi.",
      "verify.pastePrompt": "Punya hasilnya sebagai teks? Tempel di sini:",
      "verify.apply": "Terapkan hasil",
      "verify.clearGone": "Hapus tanda gone",
      "verify.phoneNote":
        "Di ponsel bookmarklet tidak jalan — pakai tombol tandai gone di baris mana pun setelah membuka profil dan melihat \"Sorry, this page isn't available\".",
      "verify.bm.check": "Periksa {n} akun",
      "verify.bm.copy": "Salin skripnya",
      "verify.bm.copied": "Tersalin ✓",
      "verify.bm.copiedToast":
        "Skrip bookmark tersalin — tempel ke kolom URL bookmark baru.",
      "verify.bm.copyFailed": "Tidak bisa menyalin — seret tombolnya saja.",
      "verify.bm.note":
        "Bookmarklet diblokir di beberapa ponsel dan di browser dalam-aplikasi Instagram — buka situs ini di browser sungguhan, dan pakai tombol tanda manual di ponsel.",
      "verify.slot.empty": "Tidak ada yang perlu diperiksa — daftarnya kosong.",

      "devices.title": "Pindahkan progres antar perangkat",
      "devices.lede":
        "Tanda centang dan gone hanya hidup di browser ini. Unduh sebagai file kecil untuk lanjut di perangkat lain, atau untuk disimpan sebelum membersihkan data browser.",
      "devices.download": "Unduh progres",
      "devices.restore": "Pulihkan dari file",
      "devices.savedNote": "Tersimpan {n} centang dan {m} tanda gone.",
      "devices.restoredNote": "Dipulihkan — {n} centang, {m} tanda gone ({added} baru).",

      "integrity.title": "Integritas export",
      "integrity.badge.ok": "lengkap",
      "integrity.badge.warn": "tidak lengkap",
      "integrity.badge.dup": "{n} duplikat",
      "integrity.summary":
        "Dibaca {files} file daftar, {rows} baris; {dups} baris duplikat dibuang, {skipped} baris tak terbaca. Format: {format}.",
      "integrity.file": "File",
      "integrity.list": "Daftar",
      "integrity.rows": "Baris",
      "integrity.reported":
        "Halaman insights Instagram melaporkan {reported} followers saat export; export ini mencantumkan {listed}.",
      "integrity.noReport":
        "Tidak ada halaman audience-insights di export ini, jadi jumlah followers tidak bisa dicek silang dengan angka milik Instagram.",

      "toast.importFirst": "Impor export dulu.",
      "toast.cannotRead":
        "File itu tidak bisa dibaca. Pastikan itu .zip yang dikirim Instagram lewat email.",
      "toast.zipReaderFailed":
        "Pembaca ZIP gagal dimuat. Periksa koneksi dan muat ulang halaman.",
      "toast.nothingToCheck": "Tidak ada yang perlu diperiksa.",
      "toast.contacting": "Menghubungi layanan pemeriksa…",
      "toast.unreachable":
        "Tidak bisa menghubungi layanan pemeriksa. Pakai Opsi 2 (bookmarklet).",
      "toast.noSession":
        "Layanan pemeriksa belum punya sesi Instagram. Pakai Opsi 2 di bawah — itu jalan hari ini.",
      "toast.serviceDown":
        "Layanan tidak bisa menjangkau Instagram saat ini. Pakai Opsi 2 di bawah.",
      "toast.rateLimited":
        "Layanan sedang sibuk (rate limit). Tunggu semenit, atau pakai Opsi 2.",
      "toast.serviceError":
        "Layanan mengembalikan kesalahan ({code}). Pakai Opsi 2.",
      "toast.nothingClassified": "Layanan tidak bisa mengklasifikasi apa pun kali ini.",
      "toast.serverProgress": "Diperiksa {done} dari {total} — {gone} gone, {exist} ada, {unknown} tidak diketahui.",
      "toast.serverDone": "Selesai — {gone} gone, {exist} ada, {unknown} tidak diketahui.",
      "toast.allChecked": "Semua di daftar ini sudah dicentang.",
      "toast.openedAndChecked": "@{u} dibuka dan dicentang.",
      "toast.nothingToCopy": "Tidak ada yang bisa disalin.",
      "toast.copiedN": "{n} nama pengguna tersalin.",
      "toast.copyFallback": "Tidak bisa menyalin — pakai CSV.",
      "toast.csvDone": "CSV terunduh.",
      "toast.nothingToReset": "Tidak ada yang bisa direset.",
      "toast.confirmReset": "Hapus semua centang di export ini? Tanda gone tetap disimpan.",
      "toast.resetDone": "Centang dihapus.",
      "toast.pasteFirst": "Tempel dulu keluaran verifikatornya.",
      "toast.notVerifierOutput": "Itu tidak terlihat seperti keluaran verifikator.",
      "toast.noDeadList": "Tidak ada daftar \"dead\" di keluaran itu.",
      "toast.verifyPending":
        "Hasil verifikator tersimpan — impor export-mu untuk menerapkannya.",
      "toast.markedGone": "{n} akun ditandai gone, {m} terkonfirmasi masih ada.",
      "toast.noGoneMarks": "Tidak ada tanda gone untuk dihapus.",
      "toast.goneCleared": "Tanda gone dihapus.",
      "toast.restoreFirst": "Impor export-mu dulu, lalu pulihkan progresnya.",
      "toast.notJson": "File itu bukan JSON yang sah.",
      "toast.notProgress": "Itu tidak terlihat seperti file progres.",
      "toast.confirmMerge":
        "Progres itu milik export lain. Tetap gabungkan ke sini?",
      "toast.restoredN": "{n} centang dipulihkan.",
      "toast.notALink": "Tidak bisa membaca hasil verifikator dari tautan.",
    },

    /* ---------------------------------------------------------------
       日本語
    --------------------------------------------------------------- */
    ja: {
      "nav.features": "機能",
      "nav.tutorials": "チュートリアル",
      "nav.privacy": "プライバシー",
      "nav.tool": "ツールを開く",
      "nav.home": "ホーム",
      "nav.github": "GitHub",

      "hero.eyebrow": "無料 · オープンソース · ログイン不要",
      "hero.title": "あなたをフォローし返していない相手を、正確に把握。",
      "hero.lede":
        "Instagram のデータエクスポートをドラッグするだけで、数秒で本物のリストが手に入ります。フォローし返していないファンや、フォローリストに残ったままの消えたアカウントも。すべてはあなたのブラウザタブの中だけで計算されます。",
      "hero.cta": "ツールを開く →",
      "hero.getExport": "エクスポートを取得（2分）",
      "hero.check1": "パスワード不要、スクレイピングなし、自動化なし",
      "hero.check2": "ZIP は端末の外へ決して出ません",
      "hero.check3": "スマホでも動作、ずっと無料",

      "features.title": "フォロー整理に必要なすべて",
      "features.sub":
        "計算結果のスクリーンショットではなく、実際のリスト。面倒なエッジケースまで処理済みです。",
      "features.exact.title": "正確なカウント",
      "features.exact.body":
        "フォロー中・フォロワー・相互・ファン・フォロー返しなしを、小文字化した名前で突き合わせ、重複行は破棄。分割ファイル、HTML エクスポート、古い /_u/ リンクも処理します。",
      "features.integrity.title": "整合性パネル",
      "features.integrity.body":
        "どのファイルが読まれ、各行にいくつのデータがあり、重複がいくつ破棄されたか、さらに Instagram 自身のインサイトページがフォロワーリストと食い違っていないかまで確認できます。",
      "features.loop.title": "次を開いてチェック",
      "features.loop.body":
        "ひとつのボタンで未チェックの次のプロフィールを新規タブで開いて記録。作業位置がずれることはありません。進捗はエクスポートごとに保存されます。",
      "features.dead.title": "消えたアカウント検出",
      "features.dead.body":
        "Instagram は削除・無効化されたアカウントをひょっこり残します。ログイン済みの自分のタブでワンクリック診断を実行すれば検出されます。",
      "features.export.title": "リストを持ち歩く",
      "features.export.body":
        "検索、絞り込み、ユーザー名コピー、フォロー日付と確認状態入りの CSV ダウンロード。エクスポートにアカウントは不要です。",
      "features.diff.title": "エクスポート間の変化",
      "features.diff.body":
        "新しいエクスポートをいつでもインポートして、誰がフォローを外したか、誰がフォローし始めたか、自分が誰を外したか・誰を新たにフォローしたかを正確に確認 — 2 つのスナップショットからローカル計算します。",
      "features.local.title": "完全ローカル",
      "features.local.body":
        "バックエンドなし、アナリティクスなし、サードパーティスクリプトなし。ZIP リーダーはページに同梱されているので、ネットを切っても動きます。",

      "steps.title": "3 ステップ",
      "steps.one.title": "エクスポートをダウンロード",
      "steps.one.body":
        "Accounts Center → Your information and permissions → Download your information。JSON を選び、Followers と following のみチェックしてファイルを小さく保ちます。",
      "steps.one.link": "解説を見る →",
      "steps.two.title": "ZIP をドロップ",
      "steps.two.body":
        "ページがメモリ内で読み込み、両リストをローカルで照合します。450 MB のエクスポートでも約 5 秒。どこにも送信されません。",
      "steps.two.link": "ツールを開く →",
      "steps.three.title": "リストを片付ける",
      "steps.three.body":
        "Open next & check off を押してリストを上から消化。消えたアカウントは gone として印を付けます。いつ戻っても進捗は覚えています。",
      "steps.three.link": "クリーンアップの流れ →",

      "faq.title": "実際によくある質問",
      "faq.q1": "これは許可された使い方？アカウント停止はされない？",
      "faq.a1":
        "読んでいるのは Instagram があなたに渡したファイルです。自動化もスクレイピングもログインもないので、問題になる行為は何もありません。ツールが代わりにフォロー解除することは決してなく、解除ボタンはあなた自身が押します。",
      "faq.q2": "なぜ自動でフォロー解除しないの？",
      "faq.a2":
        "Instagram に公開のフォロー解除 API はなく、「一括解除」を謳うサイトはパスワードをスクレイパーに通しているか規約違反をしています。安全な流れは、プロフィールを開く → 解除をタップ → 戻る → 次へ。",
      "faq.q3": "エクスポートが HTML でも使える？",
      "faq.a3":
        "使えます。ただし HTML エクスポートは長いリストの古い行を黙って落とすため、実際のフォロワーが未フォローに見えることがあります。整合性パネルが警告します。正確な答えには JSON で再ダウンロードを。",
      "faq.q4": "フォローし返していないリストに、間違いなくフォローしてくれている人がいる。",
      "faq.a4":
        "正直な理由は 3 つ：エクスポートはスナップショット（大規模アカウントでは 1〜2 日前のもの）、それが HTML エクスポートである、2 つのリストが別々の時点で取得された。どれも計算の誤りではありません — トラブルシューティングを参照してください。",
      "faq.q5": "削除済みアカウントはどう見つけるの？",
      "faq.a5":
        "Instagram は「このプロフィールは存在するか？」にログイン済みの訪問者にしか答えません。そのため診断はあなた自身の Instagram タブ内でブックマークレットとして、読み取り専用・約 1 リクエスト/秒で動きます。結果はこのページに戻ります。有効なセッションがなければ実行を拒否し、検証できなければ何も印を付けません。",
      "faq.q6": "データはどこに保存されるの？",
      "faq.a6":
        "このブラウザのローカルストレージに、そのエクスポートに紐づく形で保存されます。同期は一切なく、「リセット」で消せます。",
      "faq.more": "プライバシー詳細 →",

      "cta.title": "準備ができたらどうぞ。",
      "cta.body": "無料、アカウント不要、スマホ対応。ZIP からリストまで約 5 秒。",

      "footer.tagline": "Instagram のフォロー監査のためのローカルファーストツール。MIT ライセンスの無料・オープンソース。",
      "footer.product": "プロダクト",
      "footer.project": "プロジェクト",
      "footer.source": "ソースコード",
      "footer.trouble": "トラブルシューティング",
      "footer.note": "Instagram や Meta とは無関係です。エクスポートはあなたの端末に留まります。",

      "app.title": "エクスポートをドロップ。リストを取得。",
      "app.lede":
        "ZIP はこのタブの中で読み込まれ、アップロードは決してされません。ファイルがまだなら、<a href=\"tutorials.html#download\">ガイド</a>で 2 分でエクスポートを取得できます。",
      "app.dropBig": "エクスポート .zip をここにドロップ",
      "app.dropSmall": "またはタップしてファイルを選択 — JSON 推奨、HTML も対応",
      "app.pill1": "🔒 100% ローカル — アップロードなし、サーバーなし",
      "app.pill2": "⚡ 数秒で解析",
      "app.pill3": "📱 スマホ対応",
      "app.pill4": "🧾 正確なカウント、検証済み",
      "app.reading": "エクスポートを読み込み中…",
      "app.comparing": "リストを照合中…",
      "app.largeExport":
        "大きなエクスポート（{mb} MB）— スマホでは 1 分かかることも。 ",
      "app.loadDifferent": "別のエクスポートを読み込む",
      "app.search": "ユーザー名を検索",
      "app.openNext": "次を開いてチェック ↗",
      "app.tab.notFollowingBack": "フォロー返しなし",
      "app.tab.fans": "あなただけをフォロー",
      "app.tab.mutual": "相互フォロー",
      "app.hideChecked": "チェック済みを隠す",
      "app.hideGone": "gone を隠す",
      "app.checkedOf": "{n} / {m} チェック済み",
      "app.goneSuffix": "· {n} gone",
      "app.copyList": "ユーザー名をコピー",
      "app.csv": "CSV",
      "app.reset": "リセット",
      "app.showMore": "さらに {n} / {m} を表示",

      "stats.following": "フォロー中",
      "stats.followers": "フォロワー",
      "stats.notFollowingBack": "フォロー返しなし",
      "stats.fans": "あなただけをフォロー",
      "stats.mutual": "相互フォロー",

      "list.noMatch": "このフィルターに一致するものはありません。",
      "list.allGood": "フォローしている全員がフォローし返しています。",
      "list.empty": "このリストは空です。",

      "row.checkOff": "@{u} をチェック",
      "row.openProfile": "プロフィールを開く",
      "row.openOn": "Instagram で @{u} を開く",
      "row.markGone": "gone にする（削除・無効化）",
      "row.unmarkGone": "gone を解除",
      "row.gone": "gone",
      "row.exists": "存在",

      "history.title": "前回のエクスポートからの変化",
      "history.saved": "{n} 件保存",
      "history.lede":
        "インポートしたエクスポートはこのブラウザに記憶されます（最新のいくつか）。下で古いものを選ぶと、2 つのスナップショットの間に何が変わったか正確に表示されます：誰がフォローを外したか、誰がフォローし始めたか、自分が誰を外したか、誰を新たにフォローしたか。",
      "history.noneYet":
        "エクスポートのスナップショットはここに保存されます。次に新しいエクスポートをインポートすると、2 つの間の正確な変化がこのパネルに現れます。",
      "history.onlyCurrent":
        "現在のエクスポートだけが保存されています。来月もう一度インポートするか、新しいエクスポートをダウンロードしたときに、このパネルがその間のフォローの増減を表示します。",
      "history.select": "比較する過去のエクスポートを選択",
      "history.compare": "比較する",
      "history.note": "{when} から現在までの変化。",
      "history.unfollowedYou": "あなたをフォロー解除",
      "history.newFollowers": "新しいフォロワー",
      "history.youUnfollowed": "あなたがフォロー解除",
      "history.newlyFollowed": "あなたが新規フォロー",
      "history.copy": "コピー",
      "history.nothing": "何もありません。",
      "history.reimport":
        "比較を有効にするには、現在のエクスポートをもう一度インポートしてください（完全なリストがローカルストレージに保存されていませんでした）。",

      "verify.title": "削除・無効化されたアカウントを探す",
      "verify.badge": "任意",
      "verify.lede":
        "Instagram は「このアカウントはまだ存在するか？」にログイン済みセッションにしか答えません。ログアウト状態ではすべてのプロフィール URL が同じ汎用ページを返します。以下の 2 つの方法があります：共有チェッカーサービス、またはあなたのタブで動くワンクリックスクリプト。",
      "verify.opt1.title": "方法 1 — サーバー診断",
      "verify.opt1.badge": "最速",
      "verify.opt1.body":
        "このリストのユーザー名だけを小さなチェッカーサービスに送り、Instagram に各プロフィールが現存するか尋ねさせます。エクスポートもアカウントもセッションもブラウザの外へ出ません — サービスはあなたが誰かを知りません。",
      "verify.opt1.button": "これらのアカウントを診断",
      "verify.opt2.title": "方法 2 — 自分で実行",
      "verify.opt2.badge": "常に動作",
      "verify.opt2.body":
        "あなた自身の Instagram タブで、あなた自身のセッションで動きます。準備は一手間ですが、当方のサービスに依存せず、他でレート制限を受けていても動きます。",
      "verify.opt2.step1":
        "このボタンをブックマークバーへドラッグ（デスクトップ）— または「スクリプトをコピー」で新規ブックマークの URL 欄に貼り付け：",
      "verify.opt2.step2":
        "同じブラウザで <a href=\"https://www.instagram.com/\" target=\"_blank\" rel=\"noopener\">instagram.com</a> を開き、ログインしていることを確認します。",
      "verify.opt2.step3":
        "ブックマークをクリック。パネルが現れ、アカウントを 1 件ずつ（約 1 件/秒）診断します。",
      "verify.opt2.step4":
        "終わると結果をコピーし、このページを結果入力済みで開き直します。",
      "verify.pastePrompt": "結果をテキストで入手した？ここに貼り付け：",
      "verify.apply": "結果を適用",
      "verify.clearGone": "gone 印をクリア",
      "verify.phoneNote":
        "スマホではブックマークレットは使えません — プロフィールを開いて「Sorry, this page isn't available」が出た後、任意の行の gone ボタンをお使いください。",
      "verify.bm.check": "{n} 件を診断",
      "verify.bm.copy": "スクリプトをコピー",
      "verify.bm.copied": "コピーしました ✓",
      "verify.bm.copiedToast":
        "スクリプトをコピーしました — 新規ブックマークの URL 欄に貼り付けてください。",
      "verify.bm.copyFailed": "コピーできませんでした — ボタンをドラッグしてください。",
      "verify.bm.note":
        "一部のスマホや Instagram のアプリ内ブラウザではブックマークレットが使えません — このサイトを通常のブラウザで開き、スマホでは手動の gone ボタンをご利用ください。",
      "verify.slot.empty": "診断するものがありません — リストは空です。",

      "devices.title": "進捗を端末間で移す",
      "devices.lede":
        "チェックと gone の印はこのブラウザにのみ存在します。小さなファイルとしてダウンロードすれば別の端末で続けられ、ブラウザデータを消す前の退避にも使えます。",
      "devices.download": "進捗をダウンロード",
      "devices.restore": "ファイルから復元",
      "devices.savedNote": "{n} 件のチェックと {m} 件の gone 印を保存しました。",
      "devices.restoredNote": "復元しました — チェック {n} 件、gone {m} 件（新規 {added} 件）。",

      "integrity.title": "エクスポート整合性",
      "integrity.badge.ok": "完全",
      "integrity.badge.warn": "不完全",
      "integrity.badge.dup": "{n} 件の重複",
      "integrity.summary":
        "リストファイル {files} 件、行 {rows} 件；重複 {dups} 件破棄、読めない行 {skipped} 件。形式：{format}。",
      "integrity.file": "ファイル",
      "integrity.list": "リスト",
      "integrity.rows": "行",
      "integrity.reported":
        "Instagram のインサイトページはエクスポート時点で {reported} フォロワーと報告。このエクスポートは {listed} を列挙しています。",
      "integrity.noReport":
        "このエクスポートにインサイトページがないため、フォロワー数を Instagram 自身の数値と突き合わせできませんでした。",

      "toast.importFirst": "まずエクスポートをインポートしてください。",
      "toast.cannotRead":
        "そのファイルは読み込めませんでした。Instagram からメールで届いた .zip か確認してください。",
      "toast.zipReaderFailed":
        "ZIP リーダーの読み込みに失敗しました。接続を確認してページを再読み込みしてください。",
      "toast.nothingToCheck": "診断するものがありません。",
      "toast.contacting": "チェッカーサービスに接続中…",
      "toast.unreachable":
        "チェッカーサービスに接続できません。方法 2（ブックマークレット）をお使いください。",
      "toast.noSession":
        "チェッカーサービスにはまだ Instagram セッションが設定されていません。下の方法 2 をお使いください — 今日から動きます。",
      "toast.serviceDown":
        "サービスが今 Instagram に届きません。下の方法 2 をお使いください。",
      "toast.rateLimited":
        "サービスが混み合っています（レート制限）。少し待つか方法 2 をお使いください。",
      "toast.serviceError":
        "サービスがエラーを返しました（{code}）。方法 2 をお使いください。",
      "toast.nothingClassified": "サービスは今回何も判定できませんでした。",
      "toast.serverProgress": "{total} 件中 {done} 件を診断 — gone {gone} 件、存在 {exist} 件、不明 {unknown} 件。",
      "toast.serverDone": "完了 — gone {gone} 件、存在 {exist} 件、不明 {unknown} 件。",
      "toast.allChecked": "このリストはすべてチェック済みです。",
      "toast.openedAndChecked": "@{u} を開いてチェックしました。",
      "toast.nothingToCopy": "コピーするものがありません。",
      "toast.copiedN": "{n} 件のユーザー名をコピーしました。",
      "toast.copyFallback": "コピーできませんでした — CSV をお使いください。",
      "toast.csvDone": "CSV をダウンロードしました。",
      "toast.nothingToReset": "リセットするものがありません。",
      "toast.confirmReset": "このエクスポートのすべてのチェックを消しますか？gone 印は残ります。",
      "toast.resetDone": "チェックを消しました。",
      "toast.pasteFirst": "まず検証結果を貼り付けてください。",
      "toast.notVerifierOutput": "それは検証結果の形式ではありません。",
      "toast.noDeadList": "その出力に \"dead\" リストがありません。",
      "toast.verifyPending":
        "検証結果を保存しました — 適用するにはエクスポートをインポートしてください。",
      "toast.markedGone": "{n} 件を gone に、{m} 件は存在確認済みにしました。",
      "toast.noGoneMarks": "消すべき gone 印がありません。",
      "toast.goneCleared": "gone 印を消しました。",
      "toast.restoreFirst": "まずエクスポートをインポートしてから、進捗を復元してください。",
      "toast.notJson": "そのファイルは有効な JSON ではありません。",
      "toast.notProgress": "それは進捗ファイルの形式ではありません。",
      "toast.confirmMerge":
        "その進捗は別のエクスポートのものです。それでもこちらに統合しますか？",
      "toast.restoredN": "{n} 件のチェックを復元しました。",
      "toast.notALink": "リンクから検証結果を読み取れませんでした。",
    },
  };

  /* ---------------------------------------------------------------- */

  var LANG_KEY = "uc.lang";

  function currentLang() {
    var saved = null;
    try {
      saved = localStorage.getItem(LANG_KEY);
    } catch (e) { /* private mode */ }
    if (saved && DICT[saved]) return saved;
    var candidates = [];
    if (navigator.languages) candidates = candidates.concat(navigator.languages);
    if (navigator.language) candidates.push(navigator.language);
    for (var i = 0; i < candidates.length; i += 1) {
      var code = String(candidates[i] || "").toLowerCase();
      var base = code.split("-")[0];
      if (DICT[code]) return code;
      if (DICT[base]) return base;
    }
    return "en";
  }

  var lang = currentLang();

  function translate(key, params) {
    var text = (DICT[lang] && DICT[lang][key]) || DICT.en[key] || key;
    if (params) {
      Object.keys(params).forEach(function (name) {
        text = text.replace(
          new RegExp("\\{" + name + "\\}", "g"),
          String(params[name]),
        );
      });
    }
    return text;
  }

  function applyToDom(root) {
    var scope = root || document;
    var nodes = scope.querySelectorAll("[data-i18n]");
    for (var i = 0; i < nodes.length; i += 1) {
      var node = nodes[i];
      var key = node.getAttribute("data-i18n");
      var value = translate(key);
      if (node.hasAttribute("data-i18n-html")) node.innerHTML = value;
      else node.textContent = value;
    }
    var phs = scope.querySelectorAll("[data-i18n-placeholder]");
    for (var j = 0; j < phs.length; j += 1) {
      phs[j].setAttribute("placeholder", translate(phs[j].getAttribute("data-i18n-placeholder")));
    }
    var labels = scope.querySelectorAll("[data-i18n-aria-label]");
    for (var k = 0; k < labels.length; k += 1) {
      labels[k].setAttribute("aria-label", translate(labels[k].getAttribute("data-i18n-aria-label")));
    }
    var titles = scope.querySelectorAll("[data-i18n-title]");
    for (var l = 0; l < titles.length; l += 1) {
      titles[l].setAttribute("title", translate(titles[l].getAttribute("data-i18n-title")));
    }
    var selects = scope.querySelectorAll("select[data-i18n-options]");
    for (var m = 0; m < selects.length; m += 1) {
      var select = selects[m];
      var chosen = select.value;
      var keys = JSON.parse(select.getAttribute("data-i18n-options") || "[]");
      select.replaceChildren(keys.map(function (optionKey) {
        var option = document.createElement("option");
        option.value = optionKey;
        option.textContent = translate(optionKey);
        return option;
      }));
      select.value = chosen;
    }
    var html = document.documentElement;
    html.setAttribute("lang", lang);
  }

  function syncSwitchers() {
    document.querySelectorAll(".lang-switch").forEach(function (select) {
      if (select.value !== lang) select.value = lang;
    });
  }

  function setLang(next) {
    if (!DICT[next] || next === lang) return;
    lang = next;
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch (e) { /* private mode */ }
    applyToDom();
    syncSwitchers();
    document.dispatchEvent(new CustomEvent("uc:langchange", { detail: { lang: lang } }));
  }

  window.ucLangs = LANGS;
  window.ucLang = function () { return lang; };
  window.ucT = translate;
  window.ucSetLang = setLang;
  window.ucApplyI18n = function (root) { applyToDom(root); syncSwitchers(); };

  // Language switchers anywhere on the page share one delegated handler.
  document.addEventListener("change", function (event) {
    if (event.target && event.target.classList && event.target.classList.contains("lang-switch")) {
      setLang(event.target.value);
    }
  });

  // Translate the static page as soon as the DOM is ready. (This script is
  // classic and non-deferred, so it is always present before the app module.)
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      applyToDom();
      syncSwitchers();
    });
  } else {
    applyToDom();
    syncSwitchers();
  }
})();
