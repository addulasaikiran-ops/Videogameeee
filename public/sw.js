const CACHE_VERSION='v3';
const CACHE_NAME=`our-little-world-${CACHE_VERSION}`;
const BASE_PATH='/Videogameeee/';
const INDEX_URL=`${BASE_PATH}index.html`;
const OPTIONAL_ASSETS=[`${BASE_PATH}manifest.webmanifest`,`${BASE_PATH}icons/icon.svg`];
self.addEventListener('install',(event)=>{event.waitUntil((async()=>{const cache=await caches.open(CACHE_NAME);await cache.add(INDEX_URL);await Promise.allSettled(OPTIONAL_ASSETS.map((url)=>cache.add(url)));await self.skipWaiting();})());});
self.addEventListener('activate',(event)=>{event.waitUntil((async()=>{const names=await caches.keys();await Promise.all(names.filter((name)=>name.startsWith('our-little-world-')&&name!==CACHE_NAME).map((name)=>caches.delete(name)));await self.clients.claim();})());});
self.addEventListener('fetch',(event)=>{const request=event.request;if(request.method!=='GET')return;if(request.headers.has('range'))return;const url=new URL(request.url);if(url.origin!==self.location.origin||!url.pathname.startsWith(BASE_PATH))return;if(request.mode==='navigate'){event.respondWith((async()=>{const cache=await caches.open(CACHE_NAME);try{const response=await fetch(request);if(response.ok)await cache.put(INDEX_URL,response.clone());return response;}catch{return(await cache.match(INDEX_URL))||Response.error();}})());return;}event.respondWith((async()=>{const cached=await caches.match(request);if(cached)return cached;try{const response=await fetch(request);if(response.ok)(await caches.open(CACHE_NAME)).put(request,response.clone());return response;}catch{return Response.error();}})());});
