# Plano de Implementacao do MVP

## Fase 0 - Base tecnica

- Criar monorepo.
- Configurar Next.js para web.
- Configurar Expo para mobile.
- Configurar NestJS para backend.
- Configurar Prisma e PostgreSQL.
- Criar variaveis de ambiente e exemplos.
- Adicionar lint, formatacao e testes.

Verificacao:

- Apps arrancam localmente.
- Backend responde a `/health`.
- Prisma liga a uma base PostgreSQL local.

## Fase 1 - Identificacao por imagem e texto

- Upload de imagem para backend.
- Armazenamento em Cloud Storage.
- Integracao com Vision API.
- Extracao de OCR, labels e sinais de marca/modelo.
- Ecra de confirmacao do produto identificado.

Verificacao:

- Upload valido cria `ProductSearch`.
- Resultado da Vision API e guardado.
- Utilizador consegue corrigir nome, modelo e categoria.

## Fase 2 - Shopping Providers com mocks

- Criar interface `ShoppingProvider`.
- Criar `MockShoppingProvider`.
- Normalizar ofertas.
- Calcular `totalPrice`.
- Deduplicar resultados.
- Ordenar por preco total.
- Mostrar ate 10 ofertas.

Verificacao:

- Testes unitarios para normalizacao.
- Testes unitarios para deduplicacao.
- Testes unitarios para ordenacao.
- Interface mostra claramente dados simulados.

## Fase 3 - Historico, favoritos e alertas

- Guardar historico de pesquisas.
- Criar favoritos.
- Criar alertas de preco.
- Agendar verificacao de alertas com Cloud Tasks ou Cloud Scheduler.

Verificacao:

- Utilizador ve pesquisas anteriores.
- Favoritos persistem.
- Alerta dispara quando oferta mockada cai abaixo do preco alvo.

## Fase 4 - Primeiras integracoes reais

- Integrar 1 provider real via API oficial.
- Validar URLs, disponibilidade e moeda.
- Separar novo, usado e recondicionado.
- Adicionar pontuacao inicial de confianca da loja.

Verificacao:

- Resultados reais nao aparecem sem URL valida.
- Disponibilidade e ultima atualizacao sao visiveis.
- Resultados mockados e reais ficam distinguiveis.

## Fase 5 - Painel administrativo

- Gerir lojas aprovadas.
- Rever resultados suspeitos.
- Ver erros por provider.
- Ajustar trust score manualmente.

Verificacao:

- Admin consegue aprovar/rejeitar loja.
- Resultado suspeito pode ser marcado como aprovado ou rejeitado.

