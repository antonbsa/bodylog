# Validation

## Objetivo

Definir como validar se a V1 está pronta para uso pessoal diário.

## Checklist funcional

### Autenticação

- [ ] Usuário não autenticado não acessa dashboard.
- [ ] Login com senha correta funciona.
- [ ] Login com senha errada falha.
- [ ] Logout funciona.

### Registro

- [ ] Formulário abre com data de hoje.
- [ ] Registro com apenas peso funciona.
- [ ] Registro com todos os campos funciona.
- [ ] Selecionar data existente carrega dados.
- [ ] Selecionar data sem registro limpa campos.
- [ ] Salvar data existente atualiza, não duplica.

### Listagem

- [ ] Registros aparecem em ordem decrescente.
- [ ] Dados opcionais ausentes não quebram UI.
- [ ] Derivados aparecem quando há dados suficientes.
- [ ] Editar funciona.
- [ ] Excluir pede confirmação.
- [ ] Excluir remove registro.

### Cálculos

- [ ] IMC é calculado corretamente.
- [ ] BF kg é calculado corretamente.
- [ ] Músculo kg é calculado corretamente.
- [ ] Semana começa na segunda.
- [ ] Semana termina no domingo.
- [ ] Dias sem registro são ignorados.
- [ ] Semana parcial é indicada.
- [ ] Semana atual parcial compara contra semana anterior completa.
- [ ] BF% e músculo% mostram pontos percentuais.
- [ ] Métricas mostram variação absoluta.
- [ ] Métricas mostram variação percentual quando possível.
- [ ] Direção up/down/stable funciona.

### Exportação

- [ ] CSV é baixado.
- [ ] CSV contém todos os registros.
- [ ] CSV preserva dados primários.
- [ ] CSV pode ser aberto em planilha.

### Importação

- [ ] CSV válido é importado.
- [ ] CSV inválido reporta erros.
- [ ] Datas duplicadas atualizam registros.
- [ ] Resumo informa importados, atualizados e falhas.

### PWA

- [ ] Manifest existe.
- [ ] App é instalável.
- [ ] App abre corretamente no smartphone.
- [ ] UI é usável no celular.

## Casos de teste importantes

### CT-001 — Registro incompleto

Entrada:

```txt
Data: hoje
Peso: 72.9
BF%: vazio
Músculo%: vazio
RM: vazio
```

Esperado:

- Registro salvo.
- IMC calculado.
- BF kg nulo.
- Músculo kg nulo.
- RM nulo.

### CT-002 — Data duplicada

1. Criar registro para uma data.
2. Selecionar a mesma data no formulário.
3. Alterar peso.
4. Salvar.

Esperado:

- Mesmo registro atualizado.
- Nenhuma duplicidade criada.

### CT-003 — Semana parcial

Cenário:

- Semana atual tem registros segunda, terça e quarta.
- Semana anterior tem registros de segunda a domingo.

Esperado:

- Semana atual aparece.
- Sistema indica semana parcial.
- Comparação usa média parcial atual contra média completa anterior.

### CT-004 — Pontos percentuais

Entrada:

```txt
Semana anterior BF%: 16.20
Semana atual BF%: 14.46
```

Esperado:

```txt
Diferença: -1.74 pontos percentuais
```

### CT-005 — Export/import

1. Criar registros.
2. Exportar CSV.
3. Limpar banco local de teste.
4. Importar CSV.

Esperado:

- Registros restaurados.
- Datas preservadas.
- Valores preservados.

## Critério de pronto da V1

A V1 está pronta quando:

- todos os fluxos principais funcionam;
- o app pode ser usado no smartphone;
- dados ficam persistidos;
- dashboard semanal substitui a leitura da planilha;
- exportação CSV permite backup;
- importação CSV permite carregar histórico inicial;
- documentação reflete as decisões implementadas.
