# Autenticacao e publicacao mobile

## Estado implementado

- Firebase Authentication no cliente com Google e Apple.
- Persistencia de sessao no dispositivo.
- ID token enviado automaticamente ao backend.
- Validacao do token com Firebase Admin e ADC no Cloud Run.
- Consulta de sessao em `GET /auth/session`.
- Eliminacao de conta e dados associados em `DELETE /auth/account`.
- Perfis EAS para development, preview e production.

Google e Apple Sign-In usam modulos nativos. Depois desta alteracao, testa autenticacao numa development build e nao no Expo Go.

## 1. Firebase e Google

1. Adiciona Firebase ao projeto Google Cloud `pricelens-506120`.
2. Em Firebase Console > Authentication > Sign-in method, ativa Google.
3. Regista a app Android com package `com.kelsonflow.pricelens`.
4. Regista a app iOS com bundle ID `com.pricelens.app`.
5. Adiciona ao registo Android o SHA-1 da chave gerida pelo EAS.
6. Copia a configuracao Web da app Firebase para as variaveis `EXPO_PUBLIC_FIREBASE_*`.
7. Cria/identifica os OAuth client IDs Web e iOS. O iOS tambem precisa do reversed client ID em `GOOGLE_IOS_URL_SCHEME`.

Ativa o backend e concede ao service account do Cloud Run permissao para eliminar contas:

```bash
gcloud services enable identitytoolkit.googleapis.com --project pricelens-506120

gcloud projects add-iam-policy-binding pricelens-506120 \
  --member="serviceAccount:707776284799-compute@developer.gserviceaccount.com" \
  --role="roles/firebaseauth.admin"
```

No deploy do Cloud Run, acrescenta:

```text
FIREBASE_AUTH_ENABLED=true
FIREBASE_PROJECT_ID=pricelens-506120
```

## 2. Sign in with Apple

Requer adesao ativa ao Apple Developer Program.

1. Cria o App ID `com.pricelens.app` e ativa Sign in with Apple.
2. Cria uma chave Sign in with Apple e guarda o Key ID, Team ID e ficheiro `.p8` fora do repositorio.
3. No Firebase Authentication, ativa Apple e configura Team ID, Key ID e chave privada.
4. Se usares emails Firebase, configura o Apple Private Email Relay para o dominio Firebase.

## 3. Inicializar EAS

Executa estes comandos dentro de `apps/mobile`:

```bash
cd apps/mobile
npx eas-cli@latest login
npx eas-cli@latest init
npx eas-cli@latest build:configure
```

O `eas init` devolve o `projectId`. Guarda-o como `EAS_PROJECT_ID` e confirma que aparece em `expo.extra.eas.projectId`.

Configura as variaveis do perfil development e production no EAS. As configuracoes Firebase e OAuth client IDs sao identificadores publicos, mas devem ser geridos por ambiente para evitar enganos entre projetos.

## 4. Development build

Android:

```bash
npx eas-cli@latest build --platform android --profile development
```

iOS requer Apple Developer e um dispositivo registado:

```bash
npx eas-cli@latest device:create
npx eas-cli@latest build --platform ios --profile development
```

Depois de instalar a development build, inicia o Metro com:

```bash
pnpm exec expo start --dev-client --lan --clear
```

## 5. Builds das lojas

```bash
npx eas-cli@latest build --platform android --profile production
npx eas-cli@latest build --platform ios --profile production
```

O Android gera `.aab`; o iOS gera uma build de distribuicao para TestFlight/App Store Connect.

## 6. Submissao inicial

Google Play:

```bash
npx eas-cli@latest submit --platform android --profile production
```

Usa primeiro a faixa de teste interno. Completa ficha da loja, Data safety, classificacao etaria, politica de privacidade e URL web para pedido de eliminacao de conta.

Apple/TestFlight:

```bash
npx eas-cli@latest submit --platform ios --profile production
```

Completa App Privacy, screenshots, informacao de revisao e disponibiliza uma conta de teste se o revisor nao puder usar o login normal.

## Bloqueios antes da submissao

- Conta Google Play Developer ativa.
- Conta Apple Developer ativa.
- Nome e titular legais do publicador definidos.
- Icone 1024x1024, adaptive icon Android, splash e screenshots finais.
- URLs publicas de politica de privacidade, termos, suporte e eliminacao de conta.
- Persistencia de utilizadores, favoritos e alertas migrada da memoria do Cloud Run para Cloud SQL ou Firestore.
- Testes Google/Apple em builds assinadas e teste de eliminacao de conta.
- Formulario Data safety e App Privacy revistos com os dados realmente recolhidos pelos SDKs.
