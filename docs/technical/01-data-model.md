# Data Model

## Entidade principal: Measurement

Representa uma medição corporal em uma data específica.

```ts
type Measurement = {
  id: string;
  date: string; // YYYY-MM-DD
  weightKg: number;
  bodyFatPercentage: number | null;
  musclePercentage: number | null;
  restingMetabolismKcal: number | null;
  createdAt: string;
  updatedAt: string;
};
```

## Campos obrigatórios

Na V1, apenas `weightKg` é obrigatório.

## Campos opcionais

- `bodyFatPercentage`.
- `musclePercentage`.
- `restingMetabolismKcal`.

## Campos fora da V1

- Observação.
- Horário da medição.
- Status/contexto da medição.

## Restrições

- Deve existir no máximo um registro por data.
- `date` deve ser única.
- Datas devem ser armazenadas como `YYYY-MM-DD`.
- O sistema deve usar semana começando na segunda-feira.

## Métricas derivadas

```ts
type MeasurementDerived = {
  bmi: number | null;
  bodyFatKg: number | null;
  muscleKg: number | null;
};
```

## Fórmulas

```txt
IMC = peso / altura²
BF kg = peso * BF% / 100
Músculo kg = peso * músculo% / 100
```

## Altura

A altura deve ser configurada inicialmente como constante/configuração.

Futuramente, pode virar configuração editável via UI.

## Agregado semanal

```ts
type WeeklySummary = {
  weekStartDate: string; // Monday, YYYY-MM-DD
  weekEndDate: string;   // Sunday, YYYY-MM-DD
  measurementCount: number;
  isCurrentWeek: boolean;
  isPartialWeek: boolean;

  averages: {
    weightKg: number | null;
    bmi: number | null;
    bodyFatPercentage: number | null;
    bodyFatKg: number | null;
    musclePercentage: number | null;
    muscleKg: number | null;
    restingMetabolismKcal: number | null;
  };
};
```

## Comparação semanal

```ts
type WeeklyComparison = {
  current: WeeklySummary;
  previous: WeeklySummary | null;
  deltas: {
    weightKg: MetricDelta | null;
    bmi: MetricDelta | null;
    bodyFatPercentage: MetricDelta | null;
    bodyFatKg: MetricDelta | null;
    musclePercentage: MetricDelta | null;
    muscleKg: MetricDelta | null;
    restingMetabolismKcal: MetricDelta | null;
  };
};
```

```ts
type MetricDelta = {
  absolute: number;
  percentage: number | null;
  percentagePoints?: number;
  direction: "up" | "down" | "stable";
};
```

## Direção da variação

A V1 deve indicar apenas direção:

- `up`: subiu.
- `down`: desceu.
- `stable`: estável.

A definição exata de tolerância para "estável" deve ser tomada no plano técnico.

Sugestão inicial:

- considerar estável quando a diferença arredondada para a unidade exibida for 0.


## Portabilidade futura para Postgres

A V1 usa Cloudflare D1. Como a V2 planeja migração para Postgres serverless, a aplicação deve evitar acesso direto ao banco espalhado por handlers HTTP.

Recomendação:

- handlers chamam services/use cases;
- services chamam repositories;
- repositories concentram SQL e detalhes do D1;
- tipos de domínio não devem depender de tipos específicos do D1.

## SQL inicial sugerido

```sql
CREATE TABLE measurements (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL UNIQUE,
  weight_kg REAL NOT NULL,
  body_fat_percentage REAL,
  muscle_percentage REAL,
  resting_metabolism_kcal INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_measurements_date ON measurements(date);
```

## Importação CSV

Cabeçalhos esperados inicialmente:

```txt
date,weight_kg,body_fat_percentage,muscle_percentage,resting_metabolism_kcal
```

Cabeçalhos alternativos vindos da planilha atual podem ser mapeados posteriormente, se necessário.
