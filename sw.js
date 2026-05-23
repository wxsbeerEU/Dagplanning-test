const staticCacheName = 'site-static-v3';
const dynamicCacheName = 'site-dynamic-v2';
const assets = [
  './'
];

// cache size limit function
const limitCacheSize = (name, size) => {
  caches.open(name).then(cache => {
    cache.keys().then(keys => {
      if (keys.length > size) {
        cache.delete(keys[0]).then(() => limitCacheSize(name, size));
      }
    });
  });
};

// install event
self.addEventListener('install', evt => {
  //console.log('service worker installed')
  evt.waitUntil(
    caches.open(staticCacheName).then((cache) => {
      console.log('caching shell assets');
      return cache.addAll(assets);
    })
  );
});

// activate event
self.addEventListener('activate', evt => {
  //console.log('service worker activated')
  evt.waitUntil(
    caches.keys().then(keys => {
      // Verwijder oude caches die niet overeenkomen met de huidige versies
      return Promise.all(keys
        .filter(key => key !== staticCacheName && key !== dynamicCacheName)
        .map(key => caches.delete(key))
      );
    })
  );
});

// fetch event (Network-First voor dynamische updates)
self.addEventListener('fetch', evt => {
  //console.log('fetch event', evt)
  evt.respondWith(
    // Haal altijd eerst de allernieuwste versie op via internet
    fetch(evt.request).then(fetchRes => {
      return caches.open(dynamicCacheName).then(cache => {
        // Sla de nieuwste bestanden meteen op in de cache voor offline gebruik
        cache.put(evt.request.url, fetchRes.clone());
        limitCacheSize(dynamicCacheName, 15);
        return fetchRes;
      });
    }).catch(() => {
      // Als er geen internet is (offline op kamp), val dan terug op de cache
      return caches.match(evt.request).then(cacheRes => {
        if (cacheRes) {
          return cacheRes;
        }
        // Als een .html pagina ontbreekt en niet in de cache zit, toon 404
        if (evt.request.url.indexOf('.html') > -1) {
          return caches.match('./404.html');
        }
      });
    })
  );
});
