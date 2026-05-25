# Tasks

## Fase 0 — Validação técnica

### T-001 — Criar base da API Hono em Cloudflare Workers

Relacionado: ADR-014.

#### Acceptance Criteria

- [ ] Criar app mínimo com Hono.
- [ ] Rodar localmente via Wrangler.
- [ ] Fazer deploy em Cloudflare Workers.
- [ ] Criar rota `/api/health`.
- [ ] Confirmar que middleware básico funciona.
- [ ] Confirmar que a estrutura suporta rotas `/api/*`.
- [ ] Registrar comandos mínimos de desenvolvimento e deploy.

---

### T-002 — Validar D1

Relacionado: ADR-016.

#### Acceptance Criteria

- [ ] Criar banco D1 local.
- [ ] Criar banco D1 remoto.
- [ ] Rodar migration inicial.
- [ ] Executar query simples pela API.
- [ ] Documentar comando de migration.

---

### T-003 — Definir estratégia de deploy

Relacionado: `docs/technical/03-deployment.md`.

#### Acceptance Criteria

- [ ] Escolher Pages + Worker separado ou Worker único com assets.
- [ ] Registrar decisão.
- [ ] Criar deploy mínimo.

---

## Fase 1 — Base

### T-004 — Criar estrutura do projeto

#### Acceptance Criteria

- [ ] Criar estrutura frontend/backend.
- [ ] Configurar TypeScript.
- [ ] Configurar scripts principais.
- [ ] Adicionar README técnico inicial.

---

### T-005 — Configurar frontend

#### Acceptance Criteria

- [ ] React + Vite funcionando.
- [ ] TypeScript funcionando.
- [ ] Build funcionando.
- [ ] Página inicial renderiza.

---

### T-006 — Configurar PWA básico

#### Acceptance Criteria

- [ ] Manifest criado.
- [ ] Ícones mínimos configurados.
- [ ] App instalável no smartphone.
- [ ] Offline-first completo não implementado.

---

## Fase 2 — Banco e domínio

### T-007 — Criar migration de measurements

#### Acceptance Criteria

- [ ] Tabela `measurements` criada.
- [ ] Campo `date` único.
- [ ] Índice por data criado.
- [ ] Migration versionada.

---

### T-008 — Implementar cálculos derivados

#### Acceptance Criteria

- [ ] Função calcula IMC.
- [ ] Função calcula BF kg.
- [ ] Função calcula músculo kg.
- [ ] Campos ausentes retornam `null`.
- [ ] Testes unitários criados.

---

### T-009 — Implementar cálculo semanal

#### Acceptance Criteria

- [ ] Semana começa na segunda.
- [ ] Semana termina no domingo.
- [ ] Dias sem registro são ignorados.
- [ ] Contagem de registros é retornada.
- [ ] Testes cobrem semanas parciais.

---

### T-010 — Implementar comparação semanal

#### Acceptance Criteria

- [ ] Semana atual parcial é comparada contra semana anterior completa.
- [ ] Diferença absoluta é calculada.
- [ ] Diferença percentual é calculada quando possível.
- [ ] Pontos percentuais são calculados para BF% e músculo%.
- [ ] Direção `up/down/stable` é retornada.

---

## Fase 3 — Autenticação

### T-011 — Implementar login

#### Acceptance Criteria

- [ ] Endpoint de login criado.
- [ ] Senha validada contra secret.
- [ ] Sessão criada com segurança mínima.
- [ ] Senha não aparece no frontend nem logs.

---

### T-012 — Proteger rotas

#### Acceptance Criteria

- [ ] Rotas de dados exigem sessão válida.
- [ ] Requisições sem sessão retornam 401.
- [ ] Logout remove sessão.

---

## Fase 4 — CRUD

### T-013 — Implementar listagem de medições na API

#### Acceptance Criteria

- [ ] Endpoint retorna registros ordenados por data desc.
- [ ] Resposta inclui derivados disponíveis.
- [ ] Filtros básicos por data são aceitos ou planejados.

---

### T-014 — Implementar busca por data

#### Acceptance Criteria

- [ ] Endpoint retorna registro quando data existe.
- [ ] Endpoint retorna item nulo ou 404 controlado quando data não existe.

---

### T-015 — Implementar upsert por data

#### Acceptance Criteria

- [ ] Data nova cria registro.
- [ ] Data existente atualiza registro.
- [ ] Apenas peso é obrigatório.
- [ ] Validação rejeita valores inválidos.

---

### T-016 — Implementar exclusão

#### Acceptance Criteria

- [ ] Endpoint exclui registro por id.
- [ ] UI pede confirmação.
- [ ] Dashboard/listagem atualizam após exclusão.

---

### T-017 — Criar formulário de registro/edição

#### Acceptance Criteria

- [ ] Data padrão é hoje.
- [ ] Selecionar data existente carrega dados.
- [ ] Selecionar data vazia limpa campos.
- [ ] Peso é obrigatório.
- [ ] BF%, músculo% e RM são opcionais.
- [ ] Salvar chama upsert.

---

### T-018 — Criar listagem

#### Acceptance Criteria

- [ ] Registros aparecem por data desc.
- [ ] Dados principais são exibidos.
- [ ] Derivados são exibidos quando possíveis.
- [ ] Editar e excluir estão disponíveis.

---

## Fase 5 — Dashboard

### T-019 — Criar endpoint de dashboard semanal

#### Acceptance Criteria

- [ ] Retorna semana atual.
- [ ] Retorna semana anterior.
- [ ] Retorna deltas.
- [ ] Indica semana parcial.
- [ ] Indica quantidade de medições.

---

### T-020 — Criar UI de dashboard

#### Acceptance Criteria

- [ ] Dashboard é tela principal.
- [ ] Cards exibem médias.
- [ ] Cards exibem variações.
- [ ] Direção aparece como texto.
- [ ] Direção pode usar seta/ícone.
- [ ] Botão de registrar medição é visível.

---

## Fase 6 — Exportação

### T-021 — Implementar exportação CSV

#### Acceptance Criteria

- [ ] Endpoint gera CSV.
- [ ] CSV contém dados primários.
- [ ] Datas usam formato consistente.
- [ ] Botão de download funciona.

---

## Fase 7 — Importação

### T-022 — Implementar importação CSV

#### Acceptance Criteria

- [ ] Upload CSV funciona.
- [ ] Cabeçalhos são validados.
- [ ] Linhas inválidas são reportadas.
- [ ] Registros são criados ou atualizados por data.
- [ ] Resumo da importação é exibido.

---

## Fase 8 — Fechamento

### T-023 — Validar PWA no smartphone

#### Acceptance Criteria

- [ ] App pode ser instalado.
- [ ] App abre em modo standalone.
- [ ] Fluxo de registro funciona no celular.

---

### T-024 — Validar fluxo completo

#### Acceptance Criteria

- [ ] Login funciona.
- [ ] Registro funciona.
- [ ] Edição funciona.
- [ ] Exclusão funciona.
- [ ] Dashboard atualiza.
- [ ] Exportação funciona.
- [ ] Importação funciona.

---

### T-025 — Atualizar documentação final da V1

#### Acceptance Criteria

- [ ] Decisões técnicas finais registradas.
- [ ] Backlog atualizado.
- [ ] Pendências conhecidas registradas.
