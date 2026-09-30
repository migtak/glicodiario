/*
 * Service worker do GlicoDiário (PROJETO.md §7: PWA offline-first).
 *
 * - Arquivos estáticos (_next/static, ícones): guardados na primeira vez (cache-first).
 * - Páginas e dados de navegação: sempre tenta a internet primeiro; sem conexão,
 *   usa a última versão guardada; se nunca foi aberta, mostra /offline.
 * - Nada que venha de outro endereço (ex.: Supabase) passa por aqui.
 * - Ao sair da conta, o app pede para apagar as páginas guardadas (dados de saúde).
 *
 * Ao mudar este arquivo, aumente VERSAO para os aparelhos trocarem os caches antigos.
 */
const VERSAO = "v1";
const CACHE_ESTATICO = `glicodiario-estatico-${VERSAO}`;
const CACHE_PAGINAS = `glicodiario-paginas-${VERSAO}`;
const OFFLINE_URL = "/offline";
const MAX_PAGINAS = 80;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_ESTATICO)
      .then((cache) => cache.addAll([OFFLINE_URL, "/icons/icon-192.png"]))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((nomes) =>
        Promise.all(
          nomes
            .filter((n) => n.startsWith("glicodiario-") && n !== CACHE_ESTATICO && n !== CACHE_PAGINAS)
            .map((n) => caches.delete(n)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "limpar-dados") {
    event.waitUntil(caches.delete(CACHE_PAGINAS));
  }
});

/** Rotas que nunca devem ficar guardadas (login, links de e-mail, download de dados). */
function naoGuardar(url) {
  return (
    url.pathname.startsWith("/auth/") ||
    url.pathname.startsWith("/login") ||
    url.pathname.startsWith("/cadastro") ||
    url.pathname.startsWith("/recuperar-senha") ||
    url.pathname.startsWith("/redefinir-senha") ||
    url.pathname.startsWith("/configuracoes/exportar")
  );
}

async function limitar(cache) {
  const chaves = await cache.keys();
  for (const chave of chaves.slice(0, Math.max(0, chaves.length - MAX_PAGINAS))) await cache.delete(chave);
}

async function redePrimeiro(request, navegacao) {
  const cache = await caches.open(CACHE_PAGINAS);
  try {
    const resposta = await fetch(request);
    // só guarda páginas de verdade (não redirecionamentos para o login, nem erros)
    if (resposta.ok && resposta.type === "basic" && !resposta.redirected) {
      await cache.put(request, resposta.clone());
      await limitar(cache);
    }
    return resposta;
  } catch {
    const guardada = await cache.match(request);
    if (guardada) return guardada;
    if (navegacao) return (await caches.match(OFFLINE_URL)) || Response.error();
    return Response.error();
  }
}

async function cachePrimeiro(request) {
  const guardado = await caches.match(request);
  if (guardado) return guardado;
  const resposta = await fetch(request);
  if (resposta.ok) (await caches.open(CACHE_ESTATICO)).put(request, resposta.clone());
  return resposta;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || naoGuardar(url)) return;

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(cachePrimeiro(request));
    return;
  }

  const navegacao = request.mode === "navigate";
  // navegação entre telas do Next (dados RSC) também vale guardar
  const dadosDeTela = request.headers.get("RSC") === "1" || url.searchParams.has("_rsc");
  if (navegacao || dadosDeTela) event.respondWith(redePrimeiro(request, navegacao));
});
