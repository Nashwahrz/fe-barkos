self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(clients.claim());
});

self.addEventListener('fetch', (e) => {
  // Pass-through fetch handler is required for PWA beforeinstallprompt to fire
});

const CONFIG_CACHE = 'lapak-kos-sw-config';
const API_URL_KEY = 'https://sw-config.local/api-url';

self.addEventListener('message', (e) => {
  if (e.data?.type === 'SET_API_URL' && e.data.url) {
    e.waitUntil(
      caches.open(CONFIG_CACHE).then((cache) => cache.put(API_URL_KEY, new Response(e.data.url)))
    );
  }
});

async function getApiUrl() {
  const cache = await caches.open(CONFIG_CACHE);
  const res = await cache.match(API_URL_KEY);
  return res ? res.text() : null;
}

self.addEventListener('push', function (e) {
  if (!(self.Notification && self.Notification.permission === 'granted')) {
    return;
  }

  if (e.data) {
    const data = e.data.json();
    const title = data.title || 'Pemberitahuan Baru';
    const tag = data.data?.url || title;
    const options = {
      body: data.body,
      icon: data.icon || '/logo-lapak-kos.png',
      badge: '/logo-lapak-kos.png',
      tag, // Notif baru dengan konteks sama akan menggantikan yang lama, bukan menumpuk
      renotify: true, // Tetap alert (getar/suara) walau tag-nya sama
      data: data.data || {}
    };

    e.waitUntil(self.registration.showNotification(title, options));
  }
});

// Dengarkan perubahan token dari browser untuk menghindari token kadaluarsa
self.addEventListener('pushsubscriptionchange', function(event) {
  event.waitUntil(
    (async () => {
      const oldEndpoint = event.oldSubscription?.endpoint;
      const newSubscription = await self.registration.pushManager.subscribe(
        event.oldSubscription?.options || { userVisibleOnly: true, applicationServerKey: event.oldSubscription?.options?.applicationServerKey }
      );

      if (!oldEndpoint) return;

      const apiUrl = await getApiUrl();
      if (!apiUrl) return; // Belum pernah sync — akan disinkronkan saat web dibuka (via Navbar.tsx)

      const json = newSubscription.toJSON();
      try {
        await fetch(`${apiUrl}/push-resubscribe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ old_endpoint: oldEndpoint, endpoint: json.endpoint, keys: json.keys }),
        });
      } catch (e) {
        // Offline saat rotasi terjadi — fallback resync tetap terjadi saat web dibuka berikutnya
      }
    })()
  );
});

self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  const urlToOpen = new URL(e.notification.data?.url || '/', self.location.origin).href;
  
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there is already a window/tab open with the target URL
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, open a new window/tab
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
