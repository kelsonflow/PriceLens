# Docker e Google Cloud

Este projeto esta preparado para instalar dependencias e compilar dentro de Docker na Google Cloud.

## Servicos recomendados

- `pricelens-api`: NestJS em Cloud Run.
- `pricelens-web`: Next.js em Cloud Run.
- PostgreSQL: Cloud SQL.
- Imagens: Cloud Storage.
- Segredos: Secret Manager.

## Build local das imagens

API:

```bash
docker build -f apps/api/Dockerfile -t pricelens-api .
docker run --rm -p 4000:4000 --env-file .env pricelens-api
```

Web:

```bash
docker build -f apps/web/Dockerfile -t pricelens-web .
docker run --rm -p 3000:3000 --env-file .env pricelens-web
```

## Artifact Registry

Cria o repositorio Docker uma vez:

```bash
gcloud artifacts repositories create pricelens \
  --repository-format=docker \
  --location="$REGION" \
  --description="PriceLens containers"
```

## Build e deploy com Cloud Build

Define primeiro as variaveis:

```bash
export PROJECT_ID="o-teu-project-id"
export REGION="europe-west1"
gcloud config set project "$PROJECT_ID"
```

API:

```bash
gcloud builds submit \
  --config cloudbuild.api.yaml \
  --substitutions _REGION="$REGION",_TAG="latest" \
  .

gcloud run deploy pricelens-api \
  --image "$REGION-docker.pkg.dev/$PROJECT_ID/pricelens/pricelens-api:latest" \
  --region "$REGION" \
  --platform managed \
  --allow-unauthenticated \
  --port 4000
```

Web:

```bash
gcloud builds submit \
  --config cloudbuild.web.yaml \
  --substitutions _REGION="$REGION",_TAG="latest" \
  .

gcloud run deploy pricelens-web \
  --image "$REGION-docker.pkg.dev/$PROJECT_ID/pricelens/pricelens-web:latest" \
  --region "$REGION" \
  --platform managed \
  --allow-unauthenticated \
  --port 3000
```

## Variaveis de ambiente

No Cloud Run, configura pelo menos:

- `WEB_APP_URL`
- `API_BASE_URL`
- `DATABASE_URL`
- `GOOGLE_CLOUD_PROJECT_ID`
- `GOOGLE_CLOUD_REGION`
- `GCS_PRODUCT_IMAGES_BUCKET`
- `REDIS_URL`, quando Memorystore estiver ligado
- `SENTRY_DSN`, quando Sentry estiver ligado

Usa Secret Manager para valores sensiveis, como `DATABASE_URL`, chaves de providers, Stripe e credenciais de servicos externos.

## Notas importantes

- O Docker instala dependencias com `pnpm install --frozen-lockfile`.
- O build compila primeiro `@pricelens/shared` e depois a app alvo.
- A API e a web devem ser dois servicos Cloud Run separados.
- A app mobile Expo nao deve ser publicada em Cloud Run; deve seguir o fluxo Expo/EAS.
