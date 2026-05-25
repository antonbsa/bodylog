# Product Brief

## Nome provisório

Body Metrics Tracker

## Problema

O usuário registra diariamente métricas corporais vindas de uma balança de bioimpedância em uma planilha Google.

A planilha funciona para armazenar dados e calcular médias semanais, mas a experiência de uso é pouco amigável, especialmente no smartphone. O registro diário exige fricção manual e a leitura da evolução semanal poderia ser mais clara.

## Objetivo da V1

Criar um app pessoal, mobile-first e instalável como PWA, para:

- registrar medições diárias;
- listar registros existentes;
- editar e excluir registros;
- calcular métricas derivadas;
- calcular médias semanais;
- comparar a semana atual parcial contra a semana anterior completa;
- exportar os dados;
- importar dados históricos via CSV.

## Usuário-alvo

Inicialmente, apenas o próprio usuário.

Não há objetivo de atender múltiplos usuários na V1.

## Contexto de uso

O registro deve acontecer quase sempre pelo smartphone, logo após a medição na balança.

O desktop não é o foco da V1, mas a aplicação não deve ser inutilizável em telas maiores. Dashboards e análises desktop-friendly ficam para versões futuras.

## Métricas registradas

- Peso.
- BF%.
- Músculo%.
- RM / metabolismo em repouso.

## Métricas calculadas

- IMC.
- BF em kg.
- Músculo em kg.
- Médias semanais.
- Variações semanais absolutas.
- Variações semanais percentuais.
- Variações em pontos percentuais para BF% e músculo%.

## Critério de sucesso da V1

A V1 será considerada bem-sucedida se o usuário conseguir substituir o registro manual na planilha pelo app no dia a dia, mantendo a capacidade de:

- registrar dados rapidamente pelo celular;
- revisar dados antigos;
- corrigir erros;
- excluir registros incorretos;
- enxergar comparação semanal;
- exportar os dados;
- importar histórico inicial da planilha.

## Não objetivo principal

O app não deve interpretar fisiologicamente os dados como verdade absoluta.

Exemplo: o sistema pode dizer que a massa muscular medida subiu, mas não deve afirmar categoricamente que o usuário ganhou músculo real naquela proporção.
