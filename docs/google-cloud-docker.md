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

Ativa tambem as APIs necessarias:

```bash
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  vision.googleapis.com \
  aiplatform.googleapis.com \
  secretmanager.googleapis.com
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
API_URL="$(gcloud run services describe pricelens-api --region "$REGION" --format='value(status.url)')"

gcloud builds submit \
  --config cloudbuild.web.yaml \
  --substitutions _REGION="$REGION",_TAG="latest",_API_BASE_URL="$API_URL" \
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
- `GOOGLE_CLOUD_PROJECT`
- `GOOGLE_CLOUD_REGION`
- `GOOGLE_CLOUD_LOCATION`
- `GCS_PRODUCT_IMAGES_BUCKET`
- `GEMINI_MODEL`
- `GOOGLE_VISION_ENABLED`
- `REDIS_URL`, quando Memorystore estiver ligado
- `SENTRY_DSN`, quando Sentry estiver ligado

Usa Secret Manager para valores sensiveis, como `DATABASE_URL`, chaves de providers, Stripe e credenciais de servicos externos. Se a organizacao bloquear chaves de API, deixa `GEMINI_API_KEY` vazio e usa Vertex AI com a service account do Cloud Run.

Para Gemini via Vertex AI no Cloud Run, ativa `aiplatform.googleapis.com`, atribui `roles/aiplatform.user` a service account do servico e configura:

```bash
GOOGLE_CLOUD_PROJECT=pricelens-506120
GOOGLE_CLOUD_LOCATION=europe-west1
GEMINI_MODEL=gemini-2.5-flash
```

Para Google Cloud Vision no Cloud Run, ativa `vision.googleapis.com` e deixa o servico correr com uma service account do projeto. Nao uses `roles/cloudvision.user`: esse role nao existe para este caso. Para testes locais fora do Cloud Shell, autentica Application Default Credentials:

```bash
gcloud auth application-default login
```

## Notas importantes

- O Docker instala dependencias com `pnpm install --frozen-lockfile`.
- O build compila primeiro `@pricelens/shared` e depois a app alvo.
- A API e a web devem ser dois servicos Cloud Run separados.
- A app mobile Expo nao deve ser publicada em Cloud Run; deve seguir o fluxo Expo/EAS.
