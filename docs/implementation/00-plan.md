# Implementation Plan

## Objetivo

Implementar a V1 do Body Metrics Tracker com foco em entrega funcional, mobile-first e deploy simples na Cloudflare.

## Fases

### Fase 0 — Validação técnica

Objetivo: remover riscos que poderiam inviabilizar arquitetura.

Tarefas principais:

- Criar base da API com Hono em Cloudflare Workers.
- Validar D1 local e remoto.
- Validar autenticação simples com cookie.
- Definir estratégia final de deploy: Pages + Worker ou Worker único com assets.

Resultado esperado:

- API Hono mínima funcionando.
- Projeto base inicial criado.
- Deploy mínimo funcionando.

---

### Fase 1 — Base do projeto

Objetivo: criar estrutura mínima de app.

Tarefas principais:

- Criar monorepo ou estrutura simples.
- Configurar TypeScript.
- Configurar frontend React/Vite.
- Configurar backend Hono.
- Configurar lint/typecheck.
- Configurar PWA básico.
- Configurar variáveis/secrets esperados.

Resultado esperado:

- App abre.
- API responde healthcheck.
- Typecheck passa.

---

### Fase 2 — Banco e domínio

Objetivo: implementar persistência e regras centrais.

Tarefas principais:

- Criar migration de measurements.
- Implementar repositório de measurements.
- Implementar cálculos derivados.
- Implementar agrupamento semanal.
- Implementar comparação semanal.
- Criar testes para fórmulas e semanas.

Resultado esperado:

- Cálculos centrais funcionam independentemente da UI.

---

### Fase 3 — Autenticação

Objetivo: proteger dados.

Tarefas principais:

- Criar tela de login.
- Criar endpoint de login.
- Criar sessão assinada.
- Proteger rotas de API.
- Criar logout.

Resultado esperado:

- Usuário só acessa dashboard autenticado.

---

### Fase 4 — CRUD de medições

Objetivo: permitir uso diário.

Tarefas principais:

- Criar endpoint para listar registros.
- Criar endpoint para buscar por data.
- Criar endpoint para upsert por data.
- Criar endpoint para excluir.
- Criar formulário mobile-first.
- Implementar comportamento de data existente vs data vazia.
- Criar listagem.

Resultado esperado:

- Usuário registra, edita, exclui e lista medições.

---

### Fase 5 — Dashboard semanal

Objetivo: entregar o principal valor analítico da V1.

Tarefas principais:

- Criar endpoint de dashboard semanal.
- Criar cards de médias.
- Criar cards de variação.
- Exibir direção com texto e ícone.
- Indicar semana parcial.
- Indicar quantidade de registros usados.

Resultado esperado:

- Usuário entende evolução semanal sem abrir planilha.

---

### Fase 6 — Exportação CSV

Objetivo: oferecer backup manual.

Tarefas principais:

- Criar endpoint de exportação CSV.
- Criar botão de exportação.
- Validar formato exportado.

Resultado esperado:

- Usuário baixa CSV com registros.

---

### Fase 7 — Importação CSV

Objetivo: popular histórico da planilha atual.

Tarefas principais:

- Criar endpoint de upload CSV.
- Validar cabeçalhos.
- Validar linhas.
- Fazer upsert por data.
- Retornar resumo da importação.
- Criar UI de importação.

Resultado esperado:

- Usuário importa histórico sem cadastrar manualmente.

---

### Fase 8 — Ajuste final e validação

Objetivo: fechar V1 usável.

Tarefas principais:

- Revisar UX mobile.
- Testar instalação PWA.
- Testar deploy.
- Testar fluxos completos.
- Atualizar documentação.
- Registrar pendências para V1.1/V2.

Resultado esperado:

- V1 pronta para uso pessoal diário.
