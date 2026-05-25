# Technical Decisions

## ADR-001 — Usar SDD leve

### Status

Aceita.

### Decisão

O projeto usará SDD leve, com spec-first e spec-anchored, sem spec-as-source rígido.

### Motivo

O objetivo é entregar uma V1 funcional e usar o projeto como aprendizado, sem transformar documentação em burocracia.

---

## ADR-002 — V1 mobile-first

### Status

Aceita.

### Decisão

A V1 será desenhada principalmente para smartphone.

### Motivo

O registro acontece quase sempre logo após a medição na balança, e o celular é o dispositivo mais prático nesse contexto.

---

## ADR-003 — Desktop não é foco da V1

### Status

Aceita.

### Decisão

Desktop deve funcionar minimamente, mas dashboards desktop-friendly ficam para versões futuras.

### Motivo

O valor principal da V1 está no registro rápido e visualização semanal simples.

---

## ADR-004 — Sem Google Sheets na V1

### Status

Aceita.

### Decisão

A V1 não terá integração automática com Google Sheets.

### Motivo

Integração adicionaria complexidade e risco de atraso. Exportação CSV resolve backup inicial.

---

## ADR-005 — Exportação CSV na V1

### Status

Aceita.

### Decisão

A V1 terá exportação CSV.

### Motivo

Permite backup manual simples sem depender de integração externa.

---

## ADR-006 — Importação CSV na V1

### Status

Aceita.

### Decisão

A V1 terá importação CSV como última feature, para popular dados históricos da planilha atual.

### Motivo

Evita cadastrar histórico manualmente.

---

## ADR-007 — Um registro por data

### Status

Aceita.

### Decisão

O sistema terá no máximo um registro por data.

### Motivo

O workflow atual é uma medição diária em condições semelhantes.

---

## ADR-008 — Formulário por data cria ou edita

### Status

Aceita.

### Decisão

Ao selecionar uma data com registro existente, o formulário carrega os dados para edição. Ao selecionar data sem registro, o formulário fica vazio para criação.

### Motivo

Reduz duplicidade e simplifica UX.

---

## ADR-009 — Apenas peso obrigatório na V1

### Status

Aceita.

### Decisão

Na V1, apenas peso é obrigatório.

### Motivo

Permite registrar parcialmente quando a balança ou rotina não fornecer todos os dados.

---

## ADR-010 — Semana começa na segunda-feira

### Status

Aceita.

### Decisão

Todas as médias semanais usam semana de segunda a domingo.

### Motivo

Alinha o app com o modelo de acompanhamento semanal desejado.

---

## ADR-011 — Comparar semana atual parcial contra semana anterior completa

### Status

Aceita.

### Decisão

A V1 compara a semana atual, mesmo incompleta, contra a semana anterior completa.

### Motivo

Fornece feedback contínuo durante a semana, mesmo que a comparação não seja perfeitamente equivalente.

---

## ADR-012 — Interpretação neutra da variação

### Status

Aceita.

### Decisão

Na V1, o sistema mostra se subiu, desceu ou está estável, sem dizer se é bom ou ruim.

### Motivo

A interpretação depende do objetivo atual, contexto fisiológico e fase de dieta/treino.

---

## ADR-013 — TypeScript em tudo

### Status

Aceita.

### Decisão

Frontend e backend serão implementados em TypeScript.

### Motivo

Melhora consistência, segurança de tipos e aprendizado técnico.

---

## ADR-014 — Hono como framework da API

### Status

Aceita.

### Decisão

A V1 usará Hono + TypeScript como framework da API em Cloudflare Workers.

### Motivo

Hono é mais compatível com Cloudflare Workers e reduz risco técnico em comparação com frameworks Node tradicionais. A prioridade da V1 é entrega funcional dentro da Cloudflare.

### Consequência

Fastify não será usado na V1.

---

## ADR-015 — Cloudflare como alvo da V1

### Status

Aceita.

### Decisão

A V1 deve ser planejada para deploy na Cloudflare dentro do plano gratuito.

### Motivo

Uso pessoal, baixo volume e alinhamento com interesse técnico do projeto.

---

## ADR-016 — D1 como persistência da V1

### Status

Aceita.

### Decisão

Usar Cloudflare D1 como banco da V1.

### Motivo

Permite persistência SQL integrada ao ecossistema Cloudflare sem operar banco externo na V1.

---

## ADR-017 — Autenticação simples com senha única

### Status

Aceita.

### Decisão

A V1 terá login simples com senha única salva como secret.

### Motivo

O app é pessoal, mas os dados não devem ficar publicamente acessíveis.


---

## ADR-018 — Migração para Postgres serverless na V2

### Status

Planejada.

### Decisão

A V2 deverá migrar de Cloudflare D1 para Postgres serverless.

### Motivo

Postgres serverless tende a ser mais adequado para evolução futura do projeto, especialmente dashboards mais avançados, análises, integrações e maior portabilidade.

### Consequência para V1

A V1 deve isolar acesso ao banco em uma camada de repositório para facilitar a migração futura, mas não deve implementar Postgres agora.
