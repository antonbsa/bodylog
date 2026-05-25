# Agent Rules

## Papel do agente

O agente deve ajudar a desenvolver o projeto seguindo as especificações existentes, preservando escopo e simplicidade.

## Regras gerais

- Ler os documentos relevantes antes de propor implementação.
- Não adicionar escopo não solicitado.
- Não transformar a V1 em um produto genérico de fitness.
- Não criar multiusuário.
- Não criar login complexo.
- Não adicionar gráficos na V1.
- Não adicionar integração com Google Sheets na V1.
- Não introduzir dependências sem justificar.
- Manter mudanças pequenas e revisáveis.
- Atualizar documentação quando a implementação divergir da spec.
- Preferir a solução mais simples que atenda os requisitos atuais.
- Preservar TypeScript em frontend e backend.

## Ordem de prioridade

1. Requisitos explícitos do usuário.
2. Escopo da V1.
3. Critérios de aceite.
4. Decisões técnicas registradas.
5. Simplicidade e manutenibilidade.
6. Boas práticas gerais.

## Tratamento de ambiguidade

Se a ambiguidade bloquear implementação, o agente deve registrar a dúvida.

Se a ambiguidade não bloquear, o agente deve assumir a opção mais simples, documentar a decisão e seguir.

## Restrições importantes

- V1 deve ser mobile-first.
- V1 deve ser instalável como PWA.
- V1 deve ter autenticação simples.
- V1 deve ter exportação de dados.
- V1 deve ter importação CSV para popular dados históricos.
- V1 deve permitir edição e exclusão.
- V1 deve aceitar registro incompleto: apenas peso é obrigatório.
- V1 não deve depender de conexão offline-first. Offline-first fica para versão futura.
- Backend da V1 deve usar Hono + TypeScript em Cloudflare Workers.
- Persistência da V1 deve usar Cloudflare D1.
- Não introduzir compatibilidade com Vercel na V1.
- Migração para Postgres serverless é planejamento de V2, não requisito da V1.
