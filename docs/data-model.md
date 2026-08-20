# Modelo de Dados

Modelo inicial para PostgreSQL com Prisma.

## Entidades principais

### User

- `id`
- `email`
- `displayName`
- `locale`
- `country`
- `currency`
- `subscriptionTier`
- `createdAt`
- `updatedAt`

### ProductSearch

- `id`
- `userId`
- `sourceType`: `image`, `screenshot`, `gallery`, `text`, `barcode`
- `queryText`
- `imageObjectPath`
- `status`: `created`, `identified`, `confirmed`, `searched`, `failed`
- `createdAt`
- `updatedAt`

### ProductIdentification

- `id`
- `searchId`
- `name`
- `brand`
- `model`
- `category`
- `color`
- `visibleFeatures`
- `barcode`
- `isbn`
- `ean`
- `upc`
- `ocrText`
- `confidence`
- `userCorrectedName`
- `userCorrectedModel`
- `userCorrectedCategory`
- `createdAt`

### Offer

- `id`
- `searchId`
- `provider`
- `storeId`
- `sellerName`
- `title`
- `brand`
- `model`
- `variant`
- `condition`: `new`, `used`, `refurbished`
- `productUrl`
- `imageUrl`
- `currency`
- `itemPrice`
- `shippingPrice`
- `estimatedTax`
- `totalPrice`
- `availability`
- `estimatedDelivery`
- `sellerRating`
- `storeTrustScore`
- `matchConfidence`
- `isSponsored`
- `sponsoredDisclosure`
- `lastUpdatedAt`
- `createdAt`

### Store

- `id`
- `name`
- `domain`
- `country`
- `isApproved`
- `isMarketplace`
- `trustScore`
- `returnPolicyUrl`
- `paymentSecurityNotes`
- `createdAt`
- `updatedAt`

### PriceAlert

- `id`
- `userId`
- `productIdentificationId`
- `targetPrice`
- `currency`
- `condition`
- `isActive`
- `lastCheckedAt`
- `createdAt`
- `updatedAt`

### Favorite

- `id`
- `userId`
- `offerId`
- `createdAt`

### SuspiciousResultReview

- `id`
- `offerId`
- `reason`
- `status`: `pending`, `approved`, `rejected`
- `reviewedByUserId`
- `reviewNotes`
- `createdAt`
- `updatedAt`

## Indices recomendados

- `ProductSearch.userId, createdAt`
- `Offer.searchId, totalPrice`
- `Offer.productUrl`
- `Offer.provider, storeId`
- `PriceAlert.userId, isActive`
- `Store.domain`

## Regras de dados

- `totalPrice = itemPrice + shippingPrice + estimatedTax`, quando todos os valores existirem.
- Ofertas sem `productUrl` valida nao entram nos resultados.
- Ofertas com `availability = out_of_stock` devem ser excluidas da lista principal.
- `storeTrustScore` e `matchConfidence` sao indicadores probabilisticos, nao garantias.
- Dados mockados devem ter `provider = "mock"` e ser assinalados na interface.

