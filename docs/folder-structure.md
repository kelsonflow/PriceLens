# Estrutura de Pastas

Estrutura proposta para a monorepo:

```txt
PriceLens/
  apps/
    web/
      src/
        app/
        components/
        features/
        lib/
        styles/
    mobile/
      app/
      src/
        components/
        features/
        lib/
    api/
      src/
        app.module.ts
        main.ts
        auth/
        product-identifications/
        searches/
        offers/
        shopping-providers/
        stores/
        alerts/
        favorites/
        admin/
        common/
      test/
  packages/
    shared/
      src/
        types/
        validators/
        constants/
    ui/
      src/
        components/
        tokens/
  prisma/
    schema.prisma
    migrations/
    seed.ts
  infra/
    google-cloud/
      cloud-run/
      cloud-sql/
      storage/
      tasks/
  docs/
  .env.example
  package.json
  pnpm-workspace.yaml
  README.md
```

## Responsabilidades

- `apps/web`: experiencia web responsiva e painel administrativo.
- `apps/mobile`: app Expo para iOS e Android.
- `apps/api`: API NestJS e integracoes Google Cloud.
- `packages/shared`: tipos, schemas de validacao e contratos partilhados.
- `packages/ui`: componentes visuais partilhados quando fizer sentido.
- `prisma`: schema, migracoes e seed.
- `infra/google-cloud`: configuracao de infraestrutura e notas de deploy.

