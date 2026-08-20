# Arquitetura do Projeto

## Visao geral

PriceLens sera uma monorepo com tres superficies principais:

- Web app: Next.js, TypeScript e Tailwind CSS.
- Mobile app: React Native com Expo.
- Backend: NestJS em Google Cloud Run.

O backend sera a fonte de verdade para utilizadores, historico, alertas, normalizacao de ofertas, deduplicacao, pontuacao de confianca e auditoria administrativa.

## Componentes Google Cloud

### Cloud Run

Executa a API NestJS em containers. E adequado para o MVP porque escala automaticamente, simplifica deploys e permite expor endpoints HTTP para web, mobile e webhooks.

### Cloud SQL for PostgreSQL

Guarda utilizadores, pesquisas, produtos identificados, ofertas normalizadas, lojas, alertas, favoritos e eventos de auditoria.

### Cloud Storage

Armazena imagens submetidas pelo utilizador. Os ficheiros devem usar nomes nao previsiveis e URLs assinadas quando necessario.

### Vision API

Extrai labels, texto visivel na embalagem, logotipos, possiveis categorias e sinais OCR. O resultado da Vision API nao deve ser apresentado como verdade final sem confirmacao/correcao do utilizador.

### Cloud Tasks ou Pub/Sub

Executa tarefas demoradas fora do pedido principal:

- Atualizacao de ofertas.
- Verificacao periodica de alertas de preco.
- Reprocessamento de resultados suspeitos.
- Envio de notificacoes.

Para o MVP, Cloud Tasks e suficiente. Pub/Sub pode entrar quando houver varios consumidores/eventos.

### Memorystore for Redis

Cache para pesquisas recentes, respostas de providers, limites de uso e deduplicacao temporaria.

### Secret Manager

Armazena chaves de APIs externas, credenciais de afiliados, tokens de Sentry, Stripe e configuracoes sensiveis.

### Cloud Logging e Monitoring

Logs estruturados, metricas de latencia, erros por provider, falhas de identificacao e taxa de resultados sem stock.

## Fluxo principal

1. O cliente envia imagem ou pesquisa textual para a API.
2. A API guarda a imagem no Cloud Storage.
3. A API chama a Vision API para OCR, labels e sinais visuais.
4. O backend cria um `ProductIdentification` com nome, marca, modelo, categoria, atributos e confianca.
5. O cliente mostra a confirmacao ao utilizador.
6. O utilizador corrige ou aprova a identificacao.
7. A API consulta a camada `Shopping Providers`.
8. Cada provider devolve ofertas normalizadas.
9. A API valida URL, disponibilidade, confianca, variantes, duplicados e preco total.
10. O cliente recebe ate 10 ofertas ordenadas por `totalPrice`.

## Shopping Providers

Todas as integracoes de lojas e marketplaces devem implementar a mesma interface:

```ts
export interface ShoppingProvider {
  readonly provider: string;

  search(input: ProductSearchInput): Promise<NormalizedOffer[]>;
  getOfferAvailability?(offerId: string): Promise<OfferAvailability>;
}
```

Formato normalizado:

```ts
export interface NormalizedOffer {
  provider: string;
  storeName: string;
  sellerName?: string;
  title: string;
  brand?: string;
  model?: string;
  variant?: string;
  condition: "new" | "used" | "refurbished";
  productUrl: string;
  imageUrl?: string;
  currency: string;
  itemPrice: number;
  shippingPrice: number;
  totalPrice: number;
  availability: "in_stock" | "out_of_stock" | "limited" | "unknown";
  estimatedDelivery?: string;
  sellerRating?: number;
  storeTrustScore: number;
  matchConfidence: number;
  lastUpdatedAt: string;
}
```

## Seguranca e confianca

- Autenticacao com Firebase Auth ou Google Cloud Identity Platform.
- Validacao de input com DTOs e schemas.
- Rate limiting por utilizador e IP.
- URLs de imagem assinadas ou privadas.
- Chaves externas apenas em Secret Manager.
- Resultados patrocinados claramente marcados.
- A ordenacao por preco nao deve ser adulterada por patrocinio.

