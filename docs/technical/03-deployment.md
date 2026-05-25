# Deployment

## Objetivo

Fazer deploy da V1 inteira dentro da Cloudflare, preferencialmente dentro dos limites do plano gratuito, para uso pessoal.

Compatibilidade com Vercel não é requisito da V1.

## Componentes Cloudflare

- Cloudflare Pages ou Workers Static Assets para frontend.
- Cloudflare Worker com Hono para API.
- Cloudflare D1 para banco.
- Cloudflare Secrets para senha e segredo de sessão.

## Limites relevantes

Para uso pessoal, a V1 deve operar confortavelmente dentro dos limites gratuitos esperados.

Mesmo assim, a implementação deve evitar:

- queries desnecessárias;
- full scans frequentes em tabelas grandes;
- chamadas repetidas no dashboard;
- polling;
- processamento pesado no Worker.

## Variáveis e secrets

### Secrets

```txt
APP_PASSWORD
SESSION_SECRET
```

### Configuração

```txt
USER_HEIGHT_M
```

`USER_HEIGHT_M` pode começar como variável de ambiente ou constante versionada, desde que não represente segredo.

## D1

### Banco

Nome sugerido:

```txt
body_metrics_tracker
```

### Migrations

Migrations devem ser versionadas no repositório.

Exemplo:

```txt
migrations/
  0001_create_measurements.sql
```

## Ambientes

### Local

- Frontend rodando via Vite.
- API Hono rodando via Wrangler local/dev.
- D1 local ou preview.

### Produção

- Deploy Cloudflare.
- Secrets configurados via Wrangler ou painel.
- D1 remoto.

## Estratégia de deploy inicial

Decisão pendente:

### Opção A — Pages + Worker separado

- Frontend em Cloudflare Pages.
- API em Worker separado.
- Mais separação.

### Opção B — Worker único com assets

- Um Worker serve frontend e API.
- Menos peças.
- Pode simplificar deploy.

A decisão deve ser tomada durante o plano técnico final.

## Riscos

### Risco 1 — CSV histórico da planilha

O formato real da planilha pode não bater com os cabeçalhos esperados.

Mitigação:

- Implementar importação com mapeamento mínimo.
- Começar com formato canônico.
- Ajustar depois com base no CSV real.

### Risco 2 — Autenticação simples

Senha única é aceitável para V1 pessoal, mas não é modelo escalável.

Mitigação:

- Proteger todas as rotas.
- Usar cookie seguro.
- Não expor senha no frontend.
- Manter secrets fora do repositório.

### Risco 3 — Migração futura para Postgres serverless

A V2 pretende migrar de D1 para Postgres serverless.

Mitigação na V1:

- Isolar acesso ao banco em camada de repositório.
- Evitar SQL espalhado pela aplicação.
- Manter migrations versionadas.
- Evitar dependência excessiva de detalhes específicos do D1 fora da camada de persistência.
