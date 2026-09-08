This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## PWA

O WordSound e instalavel e sobrevive a queda de rede.

| Peca | Onde |
| --- | --- |
| Manifesto (`/manifest.webmanifest`) | [`app/manifest.ts`](app/manifest.ts) |
| Icones 192/512 + maskable + apple-touch | `public/icons/`, `app/apple-icon.png` |
| Service worker | [`public/sw.js`](public/sw.js) |
| Registro + aviso de nova versao | [`components/service-worker.tsx`](components/service-worker.tsx) |
| Faixa de "sem conexao" | [`components/offline-banner.tsx`](components/offline-banner.tsx) |
| Pagina servida offline | [`app/offline/page.tsx`](app/offline/page.tsx) |
| Convite de instalacao | [`components/install-prompt.tsx`](components/install-prompt.tsx) |
| Download de audio | [`lib/offline-audio.ts`](lib/offline-audio.ts), [`components/download-lesson-audio.tsx`](components/download-lesson-audio.tsx) |
| Lista do que foi baixado | [`components/offline-audio-list.tsx`](components/offline-audio-list.tsx) |

O `experimental.useOffline` (em `next.config.ts`) faz o Next segurar navegacao,
prefetch e Server Action quando a rede cai e repetir sozinho quando ela volta.

O service worker guarda a casca offline (o HTML de `/offline` e os chunks que
ela usa, lidos do proprio HTML porque mudam de nome a cada build) e os estaticos
com hash. HTML de pagina logada, resposta RSC e rota de API ficam de fora de
proposito: sao respostas por usuario ou por sessao.

Navegacao que falha nao recebe o HTML de `/offline` na URL pedida, e sim um
redirect para `/offline?from=...`. Servir uma rota no lugar de outra faz o
router do Next refazer a navegacao inteira, que offline termina na tela de erro
do navegador.

### Audio offline

Dentro de uma licao com audio existe **Baixar o audio**. O arquivo vai para o
Cache Storage e fica listado no perfil e na propria pagina offline, onde toca
sem rede.

A URL do Supabase e assinada e expira, entao a chave no cache e a URL **sem a
query** — o service worker faz o mesmo corte ao procurar, e por isso o audio
continua sendo encontrado no dia seguinte, com outro token. O worker tambem
responde `206` recortando o arquivo guardado, que e o que o `<audio>` espera ao
pedir por faixa de bytes.

O download fica preso a conta: se outro aluno entra no mesmo aparelho, o cache e
apagado ([`components/offline-audio-guard.tsx`](components/offline-audio-guard.tsx)).

Abrir uma licao continua exigindo internet — o que esta guardado e o audio, nao
a pagina.

### Testar

O worker so e registrado em producao, senao ele serviria chunks velhos e
quebraria o hot reload:

```bash
npm run build && npm start
```

Depois, no Chrome: **DevTools > Application > Service Workers / Manifest**, e
**Network > Offline** para ver a pagina offline e a faixa de conexao.

### Icones

```bash
npm run icons
```

Regenera tudo a partir do traco da marca com o sharp. Rode quando a identidade
mudar.
