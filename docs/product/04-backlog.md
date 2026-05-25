# Backlog

## Dados e contexto

- Campo de observação por registro.
- Campo opcional de horário da medição.
- Marcação de status da medição:
  - normal;
  - fora do horário;
  - pós-refeição;
  - pós-treino;
  - sono ruim;
  - hidratação atípica;
  - outro.
- Configuração de altura via UI.
- Registro de fase atual:
  - cutting;
  - bulking;
  - manutenção;
  - recomposição;
  - indefinido.

## Análises

- Gráficos de tendência por métrica.
- Média móvel de 7 dias.
- Comparação mensal.
- Comparação entre períodos personalizados.
- Comparação parcial contra os mesmos dias da semana anterior.
- Detecção visual de outliers.
- Mostrar aderência de registro por semana.
- Separar tendência de peso, BF kg e músculo kg.
- Destacar divergências úteis:
  - BF% caiu, mas BF kg ficou estável;
  - músculo% subiu, mas músculo kg caiu;
  - peso subiu com BF kg estável.

## Interpretação

- Definir regras configuráveis para dizer se uma variação é positiva, negativa ou neutra.
- Considerar objetivo atual antes de classificar variação como boa ou ruim.
- Comentários automáticos simples baseados em tendência.
- Sinais de alerta para variações muito bruscas.

## Backup e integração

- Backup automático para Google Sheets.
- Importação/exportação Google Sheets.
- Sincronização bidirecional com Google Sheets.
- Exportação JSON.
- Exportação XLSX.
- Agendamento automático de backup.
- Histórico de backups.

## Offline e PWA

- Offline-first.
- Registro rápido offline.
- Sync posterior.
- Tratamento de conflito entre dados locais e remotos.
- Indicador de conexão/sincronização.
- Cache de dashboard e listagem.

## UI/UX

- UI desktop-friendly.
- Dashboard analítico avançado.
- Filtros na listagem.
- Busca por data.
- Paginação ou infinite scroll.
- Animações discretas.
- Melhorias visuais nos cards semanais.
- Indicadores com setas.
- Temas claro/escuro.

## Segurança

- Sessão com expiração configurável.
- Rate limit básico.
- Rotação de senha.
- Troca de senha via UI.
- Proteção adicional para rotas de importação/exportação.
- Auditoria simples de operações críticas.

## Técnico

- Migração de Cloudflare D1 para Postgres serverless.
- Abstração do repositório para facilitar troca de banco na V2.
- Testes unitários para cálculo de métricas.
- Testes de integração da API.
- Testes E2E dos fluxos principais.
- Validação mais forte de CSV.
- Camada de domínio isolada.
- CI com lint, typecheck e testes.
- Estratégia de migrations.
- Estratégia de seed local.
