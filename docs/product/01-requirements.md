# Requirements

## Functional Requirements

### FR-001 — Registrar medição diária

O sistema deve permitir registrar uma medição corporal para uma data específica.

#### Campos

- Data.
- Peso.
- BF%.
- Músculo%.
- RM / metabolismo em repouso.

#### Regras

- Apenas peso é obrigatório na V1.
- Data deve vir preenchida com o dia atual por padrão.
- Não deve existir mais de um registro para a mesma data.
- Se a data selecionada não tiver registro, o formulário deve ficar vazio para adição.
- Se a data selecionada já tiver registro, o formulário deve carregar os dados existentes para edição.

#### Acceptance Criteria

- [ ] Ao abrir o formulário, a data padrão é hoje.
- [ ] É possível salvar registro contendo apenas peso.
- [ ] É possível salvar registro contendo peso, BF%, músculo% e RM.
- [ ] Ao selecionar uma data sem registro, os campos editáveis ficam vazios.
- [ ] Ao selecionar uma data com registro, os campos são preenchidos com os dados existentes.
- [ ] Salvar novamente uma data existente atualiza o registro em vez de duplicar.

---

### FR-002 — Editar medição

O sistema deve permitir editar uma medição existente.

#### Acceptance Criteria

- [ ] O usuário consegue abrir um registro existente.
- [ ] O usuário consegue alterar os campos.
- [ ] O usuário consegue salvar alterações.
- [ ] As médias semanais são recalculadas após edição.
- [ ] A listagem reflete o dado atualizado.

---

### FR-003 — Excluir medição

O sistema deve permitir excluir uma medição existente.

#### Acceptance Criteria

- [ ] O usuário consegue acionar exclusão a partir da listagem ou detalhe.
- [ ] O sistema solicita confirmação antes de excluir.
- [ ] Após exclusão, o registro deixa de aparecer na listagem.
- [ ] Médias e variações são recalculadas após exclusão.

---

### FR-004 — Listar medições

O sistema deve exibir as medições registradas.

#### Acceptance Criteria

- [ ] Registros aparecem em ordem decrescente por data.
- [ ] Cada item mostra a data.
- [ ] Cada item mostra o peso.
- [ ] Quando disponíveis, BF%, músculo% e RM são exibidos.
- [ ] BF kg e músculo kg são exibidos quando houver dados suficientes.
- [ ] O usuário consegue acessar edição de um registro pela listagem.

---

### FR-005 — Calcular métricas derivadas

O sistema deve calcular métricas derivadas a partir dos dados registrados.

#### Fórmulas

```txt
IMC = peso / altura²
BF kg = peso * BF% / 100
Músculo kg = peso * músculo% / 100
```

#### Regras

- IMC deve ser calculado, não registrado manualmente.
- BF kg só deve ser calculado quando peso e BF% existirem.
- Músculo kg só deve ser calculado quando peso e músculo% existirem.
- Altura deve ser configurável em constante/configuração inicial.

#### Acceptance Criteria

- [ ] IMC é exibido a partir do peso e altura configurada.
- [ ] BF kg é exibido quando peso e BF% existem.
- [ ] Músculo kg é exibido quando peso e músculo% existem.
- [ ] Campos derivados não são salvos como fonte primária obrigatória.

---

### FR-006 — Calcular médias semanais

O sistema deve agrupar registros por semana e calcular médias.

#### Regras

- Semana começa na segunda-feira.
- Semana termina no domingo.
- Dias sem registro não entram na média.
- O sistema deve mostrar quantos registros foram usados na média.

#### Acceptance Criteria

- [ ] Registros são agrupados de segunda a domingo.
- [ ] Média semanal usa apenas dias registrados.
- [ ] O dashboard mostra a semana atual.
- [ ] O dashboard indica quantas medições existem na semana atual.
- [ ] Métricas opcionais são calculadas apenas com os registros que possuem o campo.

---

### FR-007 — Comparar semana atual com semana anterior

O sistema deve comparar a média parcial da semana atual contra a média completa da semana anterior.

#### Regras

- A semana atual deve aparecer mesmo incompleta.
- É esperado que alguns dias não tenham registro.
- A comparação da V1 é contra a semana anterior completa, não contra os mesmos dias da semana anterior.
- O sistema deve indicar que a semana atual está em andamento quando for o caso.

#### Acceptance Criteria

- [ ] Dashboard mostra médias da semana atual.
- [ ] Dashboard mostra variação contra semana anterior.
- [ ] Variações em kg são exibidas como diferença absoluta e percentual.
- [ ] Variações de BF% e músculo% exibem pontos percentuais e variação percentual.
- [ ] O sistema indica se a métrica subiu, desceu ou está estável.
- [ ] O sistema pode usar ícone de seta para indicar direção.
- [ ] A interpretação “bom” ou “ruim” não é feita na V1.

---

### FR-008 — Exportar dados

O sistema deve permitir exportar os registros.

#### Regras

- Exportação deve ser suficiente como backup manual da V1.
- Formato inicial: CSV.

#### Acceptance Criteria

- [ ] O usuário consegue exportar todos os registros.
- [ ] O arquivo exportado contém os dados primários.
- [ ] O arquivo exportado contém data em formato consistente.
- [ ] O arquivo pode ser usado para backup manual.

---

### FR-009 — Importar dados históricos via CSV

O sistema deve permitir importar dados históricos vindos da planilha atual.

#### Regras

- Importação CSV é a última feature da V1.
- O objetivo é popular o banco inicial sem cadastrar tudo manualmente.
- Deve haver validação mínima de cabeçalhos e tipos.
- Datas duplicadas devem atualizar ou ser rejeitadas de forma previsível.

#### Decisão inicial

Na V1, importar uma data já existente deve atualizar o registro existente, mantendo a regra de um registro por dia.

#### Acceptance Criteria

- [ ] O usuário consegue fazer upload de um arquivo CSV.
- [ ] O sistema valida cabeçalhos esperados.
- [ ] O sistema importa registros válidos.
- [ ] O sistema informa quantos registros foram importados.
- [ ] O sistema informa quantos registros falharam.
- [ ] Datas já existentes são atualizadas, não duplicadas.

---

### FR-010 — Autenticação simples

O sistema deve ter autenticação simples para impedir acesso indevido básico.

#### Regras

- A V1 terá um único usuário.
- A senha será armazenada como secret no ambiente de deploy.
- Não haverá cadastro de usuários.
- Não haverá recuperação de senha.
- Todas as rotas de dados devem exigir autenticação.

#### Acceptance Criteria

- [ ] Usuário precisa autenticar antes de acessar dashboard.
- [ ] Senha não é exposta no frontend.
- [ ] Rotas de API rejeitam requisições não autenticadas.
- [ ] Sessão expira ou pode ser invalidada.
- [ ] Segredos ficam fora do repositório.

---

### FR-011 — PWA instalável

O sistema deve ser instalável como PWA.

#### Acceptance Criteria

- [ ] App possui manifest.
- [ ] App possui ícones mínimos.
- [ ] App pode ser instalado no smartphone.
- [ ] App possui comportamento mobile-first.
- [ ] Offline-first completo não entra na V1.

## Non-functional Requirements

### NFR-001 — Simplicidade

A solução deve priorizar entrega da V1, evitando features não essenciais.

### NFR-002 — TypeScript

Frontend e backend devem usar TypeScript.

### NFR-003 — Mobile-first

A UI deve ser desenhada priorizando uso no smartphone.

### NFR-004 — Deploy gratuito

A V1 deve ser planejada para rodar dentro dos limites do plano gratuito da Cloudflare, enquanto o uso for pessoal.

### NFR-005 — Segurança mínima

A aplicação deve proteger dados pessoais contra acesso casual indevido, mas não precisa implementar segurança corporativa na V1.

### NFR-006 — Manutenibilidade

O código deve ser simples o suficiente para ser retomado, entendido e evoluído futuramente.

### NFR-007 — Dados confiáveis

O sistema deve preservar dados primários inseridos pelo usuário e calcular derivados de forma consistente.
