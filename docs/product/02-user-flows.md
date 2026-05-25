# User Flows

## UF-001 — Abrir dashboard semanal

1. Usuário acessa o app.
2. Se não estiver autenticado, informa a senha.
3. Sistema exibe dashboard da semana atual.
4. Dashboard mostra:
   - médias da semana atual;
   - quantidade de registros usados;
   - comparação contra semana anterior;
   - direção da variação: subiu, desceu ou estável.

## UF-002 — Registrar medição de hoje

1. Usuário abre dashboard.
2. Usuário clica em "Registrar medição".
3. Sistema abre formulário com data de hoje.
4. Se não houver registro para hoje, campos editáveis aparecem vazios.
5. Usuário preenche peso e opcionalmente BF%, músculo% e RM.
6. Usuário salva.
7. Sistema persiste o registro.
8. Sistema volta para dashboard ou mostra feedback de sucesso.
9. Médias e variações são recalculadas.

## UF-003 — Editar registro existente por data

1. Usuário abre formulário de registro.
2. Usuário altera a data para uma data que já possui registro.
3. Sistema carrega automaticamente os dados existentes.
4. Usuário altera os valores.
5. Usuário salva.
6. Sistema atualiza o registro existente.

## UF-004 — Criar registro em data passada

1. Usuário abre formulário de registro.
2. Usuário seleciona uma data passada sem registro.
3. Sistema mantém campos vazios.
4. Usuário preenche os dados.
5. Usuário salva.
6. Sistema cria novo registro.

## UF-005 — Listar registros

1. Usuário acessa a tela de listagem.
2. Sistema mostra registros em ordem decrescente por data.
3. Usuário visualiza dados primários e derivados disponíveis.
4. Usuário pode escolher editar ou excluir um registro.

## UF-006 — Excluir registro

1. Usuário acessa listagem.
2. Usuário seleciona excluir.
3. Sistema pede confirmação.
4. Usuário confirma.
5. Sistema remove o registro.
6. Médias e variações são recalculadas.

## UF-007 — Exportar dados

1. Usuário acessa opção de exportação.
2. Usuário solicita exportar registros.
3. Sistema gera CSV.
4. Usuário baixa o arquivo.

## UF-008 — Importar dados históricos

1. Usuário exporta dados atuais da planilha para CSV.
2. Usuário acessa importação no app.
3. Usuário envia o CSV.
4. Sistema valida cabeçalhos e dados.
5. Sistema importa registros válidos.
6. Sistema atualiza registros com datas duplicadas.
7. Sistema mostra resumo da importação.
