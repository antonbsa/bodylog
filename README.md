# Body Metrics Tracker — SDD Base

Este pacote contém a documentação-base para desenvolvimento da V1 do projeto pessoal de registro e análise de métricas corporais.

## Objetivo

Criar um app pessoal, mobile-first e instalável como PWA, para registrar medições diárias de bioimpedância, listar histórico, calcular médias semanais e comparar a semana atual parcial contra a semana anterior completa.

Stack definida para V1:

- Frontend: React + Vite + TypeScript.
- Backend: Hono + TypeScript em Cloudflare Workers.
- Banco: Cloudflare D1.
- Deploy: Cloudflare completo, sem compatibilidade com Vercel como requisito.
- V2: migração planejada para Postgres serverless.

## Estrutura

```txt
docs/
  sdd/
  product/
  technical/
  implementation/
```

## Como usar com agentes

1. Leia `docs/sdd/00-sdd-guide.md`.
2. Leia `docs/sdd/01-process.md`.
3. Leia `docs/sdd/02-agent-rules.md`.
4. Leia os documentos em `docs/product/`.
5. Antes de implementar, leia `docs/technical/00-architecture.md`, `docs/technical/01-data-model.md` e `docs/implementation/01-tasks.md`.

## Estado

Base de especificação inicial para V1.  
Ainda não é plano fechado de implementação detalhado por código.
