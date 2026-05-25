# Scope

## V1 — In Scope

- Web app mobile-first.
- PWA instalável.
- TypeScript no frontend.
- TypeScript no backend.
- Hono como framework da API.
- Cloudflare como alvo único de deploy da V1.
- Persistência em Cloudflare D1.
- Autenticação simples com senha única salva como secret.
- Dashboard semanal.
- Registro diário.
- Edição de registro.
- Exclusão de registro.
- Listagem de registros.
- Um único registro por data.
- Data padrão como hoje.
- Ao selecionar data existente, formulário entra em modo edição.
- Ao selecionar data vazia, formulário entra em modo criação.
- Peso obrigatório.
- BF%, músculo% e RM opcionais.
- IMC calculado.
- BF kg calculado.
- Músculo kg calculado.
- Semana começando na segunda-feira.
- Comparação da semana atual parcial contra semana anterior completa.
- Variação absoluta.
- Variação percentual.
- Pontos percentuais para BF% e músculo%.
- Status de direção: subiu, desceu ou estável.
- Ícone indicativo de seta para direção da variação.
- Exportação CSV.
- Importação CSV para dados históricos.

## V1 — Out of Scope

- Observações nos registros.
- Horário da medição.
- Gráficos.
- Interpretação automática de progresso como bom/ruim.
- Recomendações automáticas.
- Metas.
- Integração com Google Sheets.
- Backup automático.
- Offline-first.
- Sincronização posterior.
- App nativo.
- Multiusuário.
- Cadastro.
- Recuperação de senha.
- Roles/permissões.
- UI desktop avançada.
- Dashboard analítico avançado.
- Integração com treino.
- Integração com dieta.
- Importação automática da balança.
- Alertas/notificações.
- Observabilidade avançada.

## V1.1 — Possíveis incrementos

- Campo opcional de observação.
- Campo opcional de horário da medição.
- Gráficos simples de tendência.
- Comparação parcial contra mesmos dias da semana anterior.
- Melhorias no fluxo de importação CSV.
- Tela de configuração da altura.
- Melhorias de usabilidade desktop sem dashboard avançado.
- Exportação em formatos adicionais.

## V2 — Possíveis incrementos

- Backup automático para Google Sheets.
- Integração Google Sheets.
- Migração de D1 para Postgres serverless.
- Offline-first.
- Registro rápido offline.
- Sincronização posterior quando houver conexão.
- Dashboards mais completos.
- Análises desktop-friendly.
- Interpretação configurável de variações.
- Metas por fase: cutting, bulking ou manutenção.
- Notas/contexto da medição.
- Marcação de medição fora do padrão.
- Média móvel de 7 dias.
- Comparação mensal.
