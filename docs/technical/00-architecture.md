# Architecture

## Visão geral

A V1 será um web app mobile-first com frontend em React/Vite/TypeScript, backend em Hono/TypeScript rodando em Cloudflare Workers e persistência em Cloudflare D1.

A V1 será Cloudflare-only. Compatibilidade com Vercel não é requisito.

## Componentes

```txt
[PWA React/Vite]
      |
      | HTTPS
      v
[Cloudflare Worker API — Hono]
      |
      v
[Cloudflare D1]
```

## Frontend

### Stack

- React.
- Vite.
- TypeScript.
- PWA.
- UI mobile-first.

### Responsabilidades

- Renderizar dashboard semanal.
- Renderizar formulário de registro/edição.
- Renderizar listagem.
- Acionar importação CSV.
- Acionar exportação CSV.
- Controlar estado de sessão no cliente.
- Consumir API autenticada.

## Backend

### Stack definida para V1

- TypeScript.
- Hono.
- Cloudflare Workers.
- Cloudflare D1.

### Justificativa

Hono é mais compatível com Cloudflare Workers do que frameworks Node tradicionais, pois trabalha bem com runtimes baseados em Web Standards. Isso reduz risco técnico e simplifica o deploy completo na Cloudflare.

Fastify não será usado na V1.

## Banco de dados

### Stack definida para V1

- Cloudflare D1.

### Justificativa

- Integrado ao ecossistema Cloudflare.
- SQL simples.
- Suficiente para uso pessoal.
- Evita operar banco externo na V1.
- Compatível com o objetivo de deploy completo na Cloudflare.

### Observação

Embora D1 tenha semelhanças com SQLite, a V1 deve tratar D1 como banco serverless gerenciado da Cloudflare, não como arquivo `.sqlite` local tradicional.

## Planejamento para V2

Na V2, o projeto deverá migrar de Cloudflare D1 para Postgres serverless.

Motivos esperados:

- maior portabilidade;
- melhor ecossistema de ferramentas;
- maior flexibilidade para consultas e integrações futuras;
- evolução para dashboards e análises mais avançadas.

A V1 deve isolar o acesso ao banco em uma camada de repositório para reduzir custo de migração futura.

## Autenticação

### Modelo

- Usuário único.
- Senha única definida como secret.
- Sem cadastro.
- Sem recuperação de senha.
- Sem roles.

### Estratégia recomendada

- Login valida a senha informada contra secret do ambiente.
- API cria sessão assinada.
- Sessão armazenada em cookie `HttpOnly`, `Secure`, `SameSite=Strict`.
- Todas as rotas de dados exigem sessão válida.

### Fora da V1

- OAuth.
- Magic link.
- Multiusuário.
- Recuperação de senha.
- RBAC.

## Deploy

### Alvo

- Cloudflare dentro do plano gratuito enquanto o uso for pessoal.

### Possível distribuição

- Frontend: Cloudflare Pages ou Workers Static Assets.
- API: Cloudflare Worker com Hono.
- DB: Cloudflare D1.

A escolha exata entre Pages + Worker separado ou um único Worker com assets deve ser tomada no plano técnico final.

## Cálculos

Cálculos podem ser implementados em camada de domínio compartilhável ou no backend.

Recomendação:

- Backend retorna dados primários e derivados principais.
- Frontend pode formatar e exibir.
- Fórmulas devem ter testes unitários.

## Importação CSV

Importação deve ser feita no backend.

Fluxo:

1. Frontend envia arquivo.
2. Backend valida cabeçalhos.
3. Backend normaliza dados.
4. Backend valida tipos.
5. Backend faz upsert por data.
6. Backend retorna resumo.

## Exportação CSV

Exportação pode ser gerada no backend.

O CSV deve conter dados primários, e opcionalmente derivados calculados para conveniência.

## Offline

V1 será PWA instalável, mas não offline-first.

Offline-first fica para V2.

## Segurança mínima

- Secrets fora do repositório.
- Autenticação exigida em todas as rotas de dados.
- Cookies seguros.
- Validação de input.
- Confirmação antes de exclusão.
- Importação CSV com validação.
