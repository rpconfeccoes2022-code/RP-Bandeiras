const CACHE_NAME = "rp-bandeiras-v10";
const ARQUIVOS_ESSENCIAIS = [
    "./index.html",
    "./manifest.json",
    "./icon-192.png",
    "./icon-512.png"
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ARQUIVOS_ESSENCIAIS)).catch(() => {})
    );
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((nomes) =>
            Promise.all(nomes.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
        )
    );
    self.clients.claim();
});

// Estrategia: tenta a rede primeiro (dados sempre atualizados); se offline, usa o cache do app shell.
self.addEventListener("fetch", (event) => {
    if (event.request.method !== "GET") return;
    event.respondWith(
        fetch(event.request)
            .then((resposta) => {
                const copia = resposta.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copia)).catch(() => {});
                return resposta;
            })
            .catch(() => caches.match(event.request))
    );
});

// Recebe a notificacao push (funciona mesmo com o app fechado) e exibe na tela do celular
self.addEventListener("push", (event) => {
    let dados = { title: "RP Bandeiras", body: "Um pedido foi atualizado." };
    try {
        if (event.data) dados = event.data.json();
    } catch (e) { /* usa o padrao */ }
    event.waitUntil(
        self.registration.showNotification(dados.title || "RP Bandeiras", {
            body: dados.body || "",
            icon: "icon-192.png",
            badge: "icon-192.png",
        })
    );
});

// Ao tocar na notificacao, abre (ou foca) o app
self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true }).then((lista) => {
            for (const cliente of lista) {
                if ("focus" in cliente) return cliente.focus();
            }
            if (clients.openWindow) return clients.openWindow("./index.html");
        })
    );
});
