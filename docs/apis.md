# APIs Necessarias

## API publica da aplicacao

### Autenticacao

- `POST /auth/session`
- `GET /me`
- `PATCH /me/preferences`

Se for usado Firebase Auth ou Identity Platform, o cliente envia o ID token e a API valida-o no backend.

### Identificacao de produto

- `POST /product-identifications/image`
  - Recebe imagem em base64.
  - Chama Google Cloud Vision para OCR, logos, labels e objetos.
  - Chama Gemini com a imagem e os sinais do Vision para identificacao visual.
  - Futuramente guarda a imagem no Cloud Storage.
  - Devolve identificacao preliminar.

- `POST /product-identifications/text`
  - Recebe pesquisa textual.
  - Cria identificacao preliminar sem imagem.

- `PATCH /product-identifications/:id/confirm`
  - Guarda correcoes do utilizador antes de pesquisar ofertas.

### Comparacao de ofertas

- `POST /searches/:id/offers`
  - Consulta providers.
  - Normaliza, valida, deduplica e ordena resultados.

- `GET /searches/:id/offers`
  - Devolve resultados existentes.

- `GET /offers/:id`
  - Detalhe de uma oferta.

### Historico, favoritos e alertas

- `GET /user-data?type=favorite`
- `POST /user-data`
- `DELETE /user-data/:id`
- `GET /searches`
- `GET /searches/:id`
- `DELETE /searches/:id`
- `POST /favorites`
- `DELETE /favorites/:id`
- `GET /price-alerts`
- `POST /price-alerts`
- `PATCH /price-alerts/:id`
- `DELETE /price-alerts/:id`

### Administracao

- `GET /admin/stores`
- `POST /admin/stores`
- `PATCH /admin/stores/:id`
- `GET /admin/suspicious-results`
- `PATCH /admin/suspicious-results/:id`

## APIs Google Cloud

- Cloud Storage API: upload e leitura controlada de imagens.
- Vision API: OCR, labels, logotipos e pistas visuais.
- Cloud SQL: PostgreSQL gerido.
- Secret Manager API: leitura de chaves externas.
- Cloud Tasks API: verificacao de alertas e revalidacao de ofertas.
- Cloud Logging/Monitoring: observabilidade.

## APIs externas de compras

Prioridade para o MVP:

- Google Shopping Content API ou Merchant Center quando aplicavel.
- APIs oficiais de lojas/parceiros.
- APIs de redes de afiliados.
- Marketplaces com API oficial.

Nao usar scraping que viole termos de servico. Quando nao houver API real configurada, usar `MockShoppingProvider` com dados claramente simulados.
