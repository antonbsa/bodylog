# SDD Guide

## Definição adotada

SDD, neste projeto, significa **Spec-Driven Development**.

A especificação deve funcionar como fonte principal de contexto para transformar uma ideia em software funcional com menos ambiguidade, especialmente quando agentes de IA forem usados para implementação.

## Objetivo do processo

- Reduzir ambiguidade antes do código.
- Controlar escopo.
- Garantir rastreabilidade mínima entre requisito, tarefa, implementação e validação.
- Facilitar retomada do projeto no futuro.
- Permitir que outros agentes entendam o contexto sem reexplicação manual.

## Princípios

- Entrega acima de perfeição.
- Especificação suficiente, não exaustiva.
- Cada requisito importante deve ser validável.
- Toda tarefa deve estar associada a um requisito, decisão técnica ou preparação necessária.
- O que está fora da V1 deve ser registrado explicitamente.
- Decisões importantes devem ser documentadas de forma curta.
- A documentação deve reduzir trabalho, não criar burocracia.

## Nível de SDD adotado

Este projeto usa:

- **Spec-first**: a especificação vem antes da implementação relevante.
- **Spec-anchored**: a especificação continua sendo referência viva durante o desenvolvimento.

Este projeto não usa, neste momento:

- **Spec-as-source rígido**: a spec não é a única fonte editável do sistema, e o código não precisa ser completamente gerado a partir dela.

## Critério de boa especificação

Uma especificação é boa quando permite responder:

- O que será construído?
- Para quem?
- Por quê?
- O que entra na V1?
- O que fica fora?
- Quais dados existem?
- Quais fluxos principais existem?
- Como saber se está pronto?
- Quais riscos técnicos precisam ser validados?

## Antipadrões

Evitar:

- Documentar arquitetura futura sem necessidade.
- Incluir segurança, escala ou multiusuário antes do tempo.
- Criar documentos longos sem relação direta com entrega.
- Escrever requisitos que não possam ser testados.
- Adicionar features úteis, mas não necessárias para a V1.
