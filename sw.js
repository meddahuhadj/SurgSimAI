// sw.js — Service Worker de GeneralSurg Plan
// =============================================================================
// Objectif : rendre l'app shell (HTML/CSS/JS statiques) installable et
// disponible hors-ligne, SANS jamais mettre en cache une réponse d'API.
//
// Règle de sécurité non négociable pour une appli qui manipule des données
// patients : ce service worker n'intercepte QUE les requêtes GET same-origin
// dont le chemin fait partie de la liste PRECACHE_URLS ci-dessous (le "app
// shell" : HTML/CSS/JS/manifest/icônes/traductions, tous statiques et
// versionnés). Toute autre requête — /patients, /audit, /dicom, /auth/*,
// /chat, /pacs/*, /fhir/*, /hl7/*, /segmentation/*, appels cross-origin
// (Gemini/Groq/CDN Three.js) — n'est PAS interceptée : le navigateur la
// traite normalement, en réseau direct. Mettre en cache une réponse patient
// ou un jeton d'auth serait un risque de sécurité/exactitude clinique, pas
// juste un détail de perf.

const CACHE_VERSION = 'generalsurg-shell-v1';

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/assets/styles.css',
  '/assets/app-part1.js',
  '/assets/app-part2.js',
  '/assets/app-part3.js',
  '/assets/app-bootstrap.js',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png',
  '/i18n/en.json',
  '/i18n/fr.json',
  '/i18n/ar.json',
  '/i18n/nl.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) =>
      // addAll échoue globalement si UNE seule ressource 404 (ex. i18n/*.json
      // absent quand l'app est servie par le backend plutôt qu'un serveur de
      // fichiers) — on précharge donc en best-effort, ressource par ressource.
      Promise.all(
        PRECACHE_URLS.map((url) =>
          cache.add(url).catch((err) => console.warn('[sw] precache ignorée:', url, err))
        )
      )
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

function isPrecachedShellRequest(url) {
  if (url.origin !== self.location.origin) return false;
  return PRECACHE_URLS.includes(url.pathname);
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return; // ne jamais toucher POST/PUT/DELETE (API)

  const url = new URL(req.url);
  if (!isPrecachedShellRequest(url)) return; // laisse passer tout le reste au réseau

  // Réseau d'abord (l'utilisateur en ligne reçoit toujours la dernière version
  // de l'app shell), repli sur le cache si hors-ligne ou réseau indisponible.
  event.respondWith(
    fetch(req)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_VERSION).then((cache) => cache.put(req, copy));
        return response;
      })
      .catch(() => caches.match(req))
  );
});
