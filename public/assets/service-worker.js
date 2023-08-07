// service-worker.js
const CACHE_NAME = 'demon-feller';
const addResourcesToCache = async (resources) => {
  const cache = await caches.open(CACHE_NAME);
  await cache.addAll(resources);
};

const putInCache = async (request, response) => {
  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, response);
};

const cacheFirst = async ({ request, preloadResponsePromise, fallbackUrl }) => {
  // First try to get the resource from the cache
  const responseFromCache = await caches.match(request);
  if (responseFromCache) {
    return responseFromCache;
  }

  // Next try to use the preloaded response, if it's there
  const preloadResponse = await preloadResponsePromise;
  if (preloadResponse) {
    console.info('using preload response', preloadResponse);
    putInCache(request, preloadResponse.clone());
    return preloadResponse;
  }

  // Next try to get the resource from the network
  try {
    const responseFromNetwork = await fetch(request.clone());
    // response may be used only once
    // we need to save clone to put one copy in cache
    // and serve second one
    putInCache(request, responseFromNetwork.clone());
    return responseFromNetwork;
  } catch (error) {
    const fallbackResponse = await caches.match(fallbackUrl);
    if (fallbackResponse) {
      return fallbackResponse;
    }
    // when even the fallback response is not available,
    // there is nothing we can do, but we must always
    // return a Response object
    return new Response('Network error happened', {
      status: 408,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
};

const enableNavigationPreload = async () => {
  if (self.registration.navigationPreload) {
    // Enable navigation preloads!
    await self.registration.navigationPreload.enable();
  }
};

self.addEventListener('activate', (event) => {
  event.waitUntil(enableNavigationPreload());
  console.log('activate')
});

self.addEventListener('install', (event) => {
  event.waitUntil(
    addResourcesToCache([
      './assets/music/actg-pentarchy.ogg',
      './assets/music/smoke_access-back_into_the_cracks.ogg',
      './assets/music/smoke_access-faithless_predator.ogg',
      './assets/music/cor_serpentis-fate.ogg',
      './assets/music/deep_soy-haunt.ogg',
      './assets/music/i_sekuin-heat.ogg',
      './assets/music/dirac_sea-armiger.ogg',
      './assets/music/inner_worlds-ouroboros.ogg',
      './assets/music/razorrhead-remains_of_a_diary.ogg',
      './assets/music/smoke_access-clouds_of_smoke.ogg',
      './assets/music/arrus-hyssop.ogg',
      './assets/music/system_ready-captains_of_industry.ogg',
      './assets/music/dj-meeting_miseria.ogg',
      './assets/music/portals-sunshine_revolver_(with_ACTG).ogg',
      './assets/music/albireo_achernar-death_and_resurrection.ogg'      
    ])
  );
  console.log('install')
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    cacheFirst({
      request: event.request,
      preloadResponsePromise: event.preloadResponse,
      fallbackUrl: './assets/music/dj-meeting_miseria.ogg'
    })
  );
  console.log('fetch')
});
