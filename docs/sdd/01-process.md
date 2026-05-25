# SDD Process

## Fluxo geral

1. Definir problema e objetivo.
2. Definir usuário-alvo.
3. Definir escopo da V1.
4. Registrar fora de escopo e backlog.
5. Definir requisitos funcionais.
6. Definir requisitos não funcionais mínimos.
7. Descrever fluxos principais.
8. Definir modelo de dados inicial.
9. Definir arquitetura mínima.
10. Registrar riscos técnicos.
11. Quebrar implementação em tarefas pequenas.
12. Implementar uma tarefa por vez.
13. Validar contra critérios de aceite.
14. Atualizar documentação quando houver divergência entre spec e implementação.

## Regra principal

Nenhuma implementação relevante deve começar sem:

- objetivo claro;
- requisito ou decisão associada;
- critério de aceite;
- tarefa definida.

## Nível de detalhe esperado

Para este projeto, a documentação deve ser objetiva.

O objetivo não é prever tudo.  
O objetivo é impedir ambiguidades óbvias e evitar crescimento descontrolado de escopo.

## Quando atualizar os documentos

Atualizar a documentação quando:

- um requisito mudar;
- uma feature for movida entre V1, V1.1 e V2;
- uma decisão técnica for tomada;
- uma decisão técnica for revertida;
- uma limitação prática for descoberta;
- um risco técnico for validado ou invalidado;
- a implementação divergir da especificação.

## Ordem de leitura recomendada

```txt
README.md
docs/sdd/00-sdd-guide.md
docs/sdd/01-process.md
docs/sdd/02-agent-rules.md
docs/product/00-product-brief.md
docs/product/01-requirements.md
docs/product/02-user-flows.md
docs/product/03-scope.md
docs/technical/00-architecture.md
docs/technical/01-data-model.md
docs/implementation/01-tasks.md
```
