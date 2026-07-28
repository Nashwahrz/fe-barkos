self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(clients.claim());
});

self.addEventListener('fetch', (e) => {
  // Pass-through fetch handler is required for PWA beforeinstallprompt to fire
});

self.addEventListener('push', function (e) {
  if (!(self.Notification && self.Notification.permission === 'granted')) {
    return;
  }

  if (e.data) {
    const data = e.data.json();
    const title = data.title || 'Pemberitahuan Baru';
    const options = {
      body: data.body,
      icon: data.icon || '/icon-192x192.png',
      badge: '/icon-192x192.png',
      vibrate: [200, 100, 200, 100, 200, 100, 200],
      data: data.data || {}
    };

    e.waitUntil(self.registration.showNotification(title, options));
  }
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
