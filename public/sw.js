/**
 * Service worker do WordSound.
 *
 * Escopo do que ele faz de proposito:
 *  - guarda a casca offline (/offline com o JS e o CSS dela) e os icones;
 *  - serve os estaticos com hash (/_next/static, /icons) direto do cache;
 *  - navegacao vai sempre a rede e so cai no /offline quando a rede falha;
 *  - serve o audio que o aluno baixou (cache wordsound-audio), inclusive
 *    respondendo requisicao com Range, que e como o <audio> pede o arquivo.
 *
 * O que ele NAO faz, tambem de proposito: nunca guarda HTML de pagina logada,
 * resposta RSC ou rota de API. Sao respostas por usuario ou por sessao;
 * cachear misturaria conteudo entre contas.
 */

const VERSION = "v1";
const SHELL_CACHE = `wordsound-shell-${VERSION}`;
const ASSET_CACHE = `wordsound-assets-${VERSION}`;
// Sem VERSION: o download do aluno tem que sobreviver a uma atualizacao do app.
// Quem escreve nele e lib/offline-audio.ts, na pagina; aqui so lemos.
const AUDIO_CACHE = "wordsound-audio";
const KEEP_CACHES = [SHELL_CACHE, ASSET_CACHE, AUDIO_CACHE];

const OFFLINE_URL = "/offline";

const SHELL_ASSETS = ["/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png"];

/**
 * Guarda a pagina offline e o JS/CSS que ela precisa.
 *
 * So o HTML nao basta: o Next carrega os chunks da pagina depois, e offline
 * esse pedido falha com ChunkLoadError, que derruba a pagina inteira. Como os
 * nomes dos chunks mudam a cada build, eles sao lidos do proprio HTML em vez de
 * ficarem escritos aqui.
 */
async function precacheShell() {
  const [shell, assets] = await Promise.all([caches.open(SHELL_CACHE), caches.open(ASSET_CACHE)]);

  await Promise.all(
    // cache.addAll e tudo-ou-nada: um 404 derrubaria a instalacao inteira
    SHELL_ASSETS.map((url) =>
      shell.add(new Request(url, { cache: "reload" })).catch(() => undefined),
    ),
  );

  const response = await fetch(new Request(OFFLINE_URL, { cache: "reload" }));
  if (!response.ok) return;

  await shell.put(OFFLINE_URL, response.clone());

  const html = await response.text();
  const referenced = new Set(html.match(/\/_next\/static\/[A-Za-z0-9._/-]+/g) ?? []);
  await Promise.all([...referenced].map((url) => assets.add(url).catch(() => undefined)));
}

self.addEventListener("install", (event) => {
  // instalar sem rede ainda vale a pena: o worker passa a existir e a casca e
  // reguardada no proximo REFRESH_SHELL
  event.waitUntil(precacheShell().catch(() => undefined));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith("wordsound-") && !KEEP_CACHES.includes(key))
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

// A cada build os chunks da pagina offline mudam de nome, mas o sw.js continua
// igual, entao nao ha reinstalacao para reguardar os novos. O cliente pede essa
// atualizacao quando abre o app com rede; uma vez por vida do worker basta.
let shellRefreshed = false;

self.addEventListener("message", (event) => {
  // o cliente pede a troca quando o usuario aceita atualizar
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
    return;
  }

  if (event.data === "REFRESH_SHELL" && !shellRefreshed) {
    shellRefreshed = true;
    event.waitUntil(precacheShell().catch(() => undefined));
  }
});

/** Estatico versionado: o nome do arquivo muda a cada build, entao cache serve. */
function isVersionedAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/apple-icon.png" ||
    /\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff2?)$/.test(url.pathname)
  );
}

/** Audio de licao no storage do Supabase, servido por URL assinada. */
function isLessonAudio(url) {
  return url.pathname.includes("/storage/v1/object/") && url.pathname.includes("/lesson-media/");
}

/**
 * Chave estavel do audio no cache.
 *
 * A URL assinada carrega um token que expira e muda a cada carregamento da
 * pagina. Guardar com a query dentro faria o cache nunca acertar de novo, entao
 * a chave e so o caminho do arquivo no bucket.
 */
function audioCacheKey(url) {
  const key = new URL(url);
  key.search = "";
  return key.toString();
}

/**
 * Recorta a resposta guardada para atender um Range.
 *
 * O <audio> quase sempre pede por faixa de bytes e espera 206. Devolver 200
 * inteiro faz o Safari recusar e quebra o seek nos outros navegadores.
 */
async function sliceForRange(response, rangeHeader) {
  const buffer = await response.arrayBuffer();
  const total = buffer.byteLength;
  const match = /bytes=(\d*)-(\d*)/.exec(rangeHeader);

  const start = match && match[1] ? Number(match[1]) : 0;
  const end = match && match[2] ? Math.min(Number(match[2]), total - 1) : total - 1;

  if (!Number.isFinite(start) || start > end || start >= total) {
    return new Response(null, {
      status: 416,
      headers: { "content-range": `bytes */${total}` },
    });
  }

  const body = buffer.slice(start, end + 1);
  return new Response(body, {
    status: 206,
    statusText: "Partial Content",
    headers: {
      "content-type": response.headers.get("content-type") ?? "audio/mpeg",
      "content-length": String(body.byteLength),
      "content-range": `bytes ${start}-${end}/${total}`,
      "accept-ranges": "bytes",
    },
  });
}

/** Baixado pelo aluno vem do cache; o resto segue para a rede como sempre. */
async function audioFromCache(request) {
  const cache = await caches.open(AUDIO_CACHE);
  const cached = await cache.match(audioCacheKey(request.url));
  if (!cached) return fetch(request);

  const range = request.headers.get("range");
  return range ? sliceForRange(cached.clone(), range) : cached;
}

async function cacheFirst(request) {
  const cache = await caches.open(ASSET_CACHE);
  const hit = await cache.match(request);
  if (hit) return hit;

  const response = await fetch(request);
  if (response.ok && response.type === "basic") {
    cache.put(request, response.clone());
  }
  return response;
}

/**
 * Navegacao sem rede.
 *
 * Redireciona para /offline em vez de devolver o HTML dela na URL pedida: o
 * router do Next compara a rota do payload com a URL da barra e, quando nao
 * batem, refaz a navegacao inteira — que offline falha e cai na tela de erro do
 * navegador. Com o redirect, a URL passa a ser a da propria pagina offline.
 */
async function navigateOrOffline(request) {
  try {
    // request original preserva redirect: "manual", entao o 302 do proxy
    // continua sendo tratado pelo navegador.
    return await fetch(request);
  } catch {
    const requested = new URL(request.url);

    if (requested.pathname !== OFFLINE_URL) {
      const target = new URL(OFFLINE_URL, self.location.origin);
      target.searchParams.set("from", requested.pathname + requested.search);
      return Response.redirect(target.toString(), 302);
    }

    // ignoreSearch por causa do ?from=
    const cached = await caches.match(OFFLINE_URL, {
      cacheName: SHELL_CACHE,
      ignoreSearch: true,
    });
    return (
      cached ??
      new Response("Sem conexao.", {
        status: 503,
        headers: { "content-type": "text/plain; charset=utf-8" },
      })
    );
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // antes do corte por origem e por Range: o audio mora em outro dominio e e
  // justamente ele que chega com Range
  if (isLessonAudio(url)) {
    event.respondWith(audioFromCache(request));
    return;
  }

  if (request.headers.has("range")) return;
  // fontes, telemetria e qualquer outro dominio: deixa a rede resolver
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(navigateOrOffline(request));
    return;
  }

  if (isVersionedAsset(url)) {
    event.respondWith(cacheFirst(request));
  }
});
