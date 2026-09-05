# PriceLens

PriceLens e uma aplicacao mobile e web para identificar produtos a partir de uma fotografia, screenshot, imagem da galeria ou pesquisa por texto, e comparar ofertas de lojas online confiaveis.

## Decisao de backend

O backend sera desenvolvido sobre Google Cloud:

- API principal em Node.js/NestJS, publicada em Cloud Run.
- Base de dados PostgreSQL em Cloud SQL.
- Imagens em Cloud Storage.
- Identificacao visual com Google Cloud Vision API, com possibilidade futura de combinar OpenAI Vision.
- Trabalhos assincronos com Cloud Tasks ou Pub/Sub.
- Cache com Memorystore for Redis.
- Segredos em Secret Manager.
- Observabilidade com Cloud Logging, Cloud Monitoring e Sentry.

## Documentacao inicial

- [Arquitetura](./docs/architecture.md)
- [Modelo de dados](./docs/data-model.md)
- [APIs necessarias](./docs/apis.md)
- [Plano do MVP](./docs/mvp-plan.md)
- [Estrutura de pastas](./docs/folder-structure.md)
- [Docker e Google Cloud](./docs/google-cloud-docker.md)

## Como executar localmente

```bash
pnpm install
pnpm dev:web
pnpm dev:api
```

Tambem podes usar Docker para instalar dependencias e compilar dentro do container:

```bash
docker build -f apps/api/Dockerfile -t pricelens-api .
docker build -f apps/web/Dockerfile --build-arg NEXT_PUBLIC_API_BASE_URL=http://localhost:4000 -t pricelens-web .
```

Aplicacoes:

- Web: http://localhost:3000
- API: http://localhost:4000/health
- Mobile: `pnpm --filter @pricelens/mobile dev`

## Estado atual do MVP

- Web app com scanner/upload/pesquisa por texto, confirmacao do produto, resultados, detalhes, favoritos, historico, alertas, perfil e painel admin.
- Mobile app Expo com o mesmo fluxo principal em versao mobile-first.
- API NestJS com healthcheck, seguranca basica, rate limit, identificacao por texto/imagem via Gemini + Google Vision, confirmacao, pesquisa de ofertas reais via SerpApi, cache de pesquisas, dados por utilizador e alertas de preco.
- Pacote partilhado com normalizacao, validacao, deduplicacao e ordenacao de ofertas.
- A camada atual usa memoria do processo para dados de utilizador e alertas; para producao final deve ser trocada por Cloud SQL ou Firestore.

## Gemini e Google Vision

Configura no backend:

```bash
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.5-flash
GOOGLE_VISION_ENABLED=true
SERPAPI_API_KEY=...
ENABLE_MOCK_SHOPPING=false
```

Na identificacao por imagem, a API usa Google Cloud Vision para OCR, logos, labels e objetos, e passa esses sinais para o Gemini identificar melhor o produto. Em Cloud Run, o Gemini pode usar Vertex AI/ADC com a service account do servico, sem chave de API. A pesquisa de precos usa SerpApi Google Shopping quando `SERPAPI_API_KEY` esta configurada.

## Principios do produto

- Nunca inventar precos, produtos ou disponibilidade.
- Mostrar apenas ofertas com URL valida.
- Separar dados reais de dados simulados.
- Ordenar por preco total, incluindo portes e impostos estimados quando disponiveis.
- Indicar sempre confianca da correspondencia e confianca da loja como indicadores, nao garantias.
- Preparar todas as integracoes externas atraves da camada `Shopping Providers`.
