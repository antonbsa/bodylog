# API Contract

## Base

Todas as rotas de dados exigem autenticação.

## Auth

### POST /api/auth/login

Autentica o usuário único.

#### Request

```json
{
  "password": "string"
}
```

#### Response 200

```json
{
  "ok": true
}
```

#### Response 401

```json
{
  "ok": false,
  "error": "INVALID_PASSWORD"
}
```

---

### POST /api/auth/logout

Encerra sessão.

#### Response 200

```json
{
  "ok": true
}
```

---

### GET /api/auth/session

Verifica sessão.

#### Response 200

```json
{
  "authenticated": true
}
```

#### Response 401

```json
{
  "authenticated": false
}
```

## Measurements

### GET /api/measurements

Lista medições.

#### Query params opcionais

```txt
from=YYYY-MM-DD
to=YYYY-MM-DD
limit=number
offset=number
```

#### Response 200

```json
{
  "items": [
    {
      "id": "string",
      "date": "YYYY-MM-DD",
      "weightKg": 72.9,
      "bodyFatPercentage": 14.46,
      "musclePercentage": 43.72,
      "restingMetabolismKcal": 1700,
      "derived": {
        "bmi": 25.22,
        "bodyFatKg": 10.54,
        "muscleKg": 31.87
      },
      "createdAt": "string",
      "updatedAt": "string"
    }
  ]
}
```

---

### GET /api/measurements/by-date/:date

Busca registro por data.

#### Response 200

```json
{
  "item": {
    "id": "string",
    "date": "YYYY-MM-DD",
    "weightKg": 72.9,
    "bodyFatPercentage": null,
    "musclePercentage": null,
    "restingMetabolismKcal": null,
    "createdAt": "string",
    "updatedAt": "string"
  }
}
```

#### Response 404

```json
{
  "item": null
}
```

---

### PUT /api/measurements/by-date/:date

Cria ou atualiza medição da data.

#### Request

```json
{
  "weightKg": 72.9,
  "bodyFatPercentage": 14.46,
  "musclePercentage": 43.72,
  "restingMetabolismKcal": 1700
}
```

#### Regras

- `weightKg` é obrigatório.
- Demais campos aceitam `number` ou `null`.
- Se a data já existir, atualizar.
- Se a data não existir, criar.

#### Response 200

```json
{
  "item": {
    "id": "string",
    "date": "YYYY-MM-DD",
    "weightKg": 72.9,
    "bodyFatPercentage": 14.46,
    "musclePercentage": 43.72,
    "restingMetabolismKcal": 1700,
    "createdAt": "string",
    "updatedAt": "string"
  }
}
```

---

### DELETE /api/measurements/:id

Exclui medição.

#### Response 200

```json
{
  "ok": true
}
```

## Dashboard

### GET /api/dashboard/weekly

Retorna resumo semanal da semana atual e comparação contra semana anterior.

#### Response 200

```json
{
  "current": {
    "weekStartDate": "YYYY-MM-DD",
    "weekEndDate": "YYYY-MM-DD",
    "measurementCount": 4,
    "isCurrentWeek": true,
    "isPartialWeek": true,
    "averages": {
      "weightKg": 72.9,
      "bmi": 25.22,
      "bodyFatPercentage": 14.46,
      "bodyFatKg": 10.54,
      "musclePercentage": 43.72,
      "muscleKg": 31.87,
      "restingMetabolismKcal": 1700
    }
  },
  "previous": {
    "weekStartDate": "YYYY-MM-DD",
    "weekEndDate": "YYYY-MM-DD",
    "measurementCount": 7,
    "isCurrentWeek": false,
    "isPartialWeek": false,
    "averages": {}
  },
  "deltas": {
    "weightKg": {
      "absolute": 1.15,
      "percentage": 1.6,
      "direction": "up"
    },
    "bodyFatPercentage": {
      "absolute": -1.74,
      "percentage": -10.74,
      "percentagePoints": -1.74,
      "direction": "down"
    }
  }
}
```

## Import/export

### GET /api/export/measurements.csv

Exporta todos os registros em CSV.

---

### POST /api/import/measurements.csv

Importa CSV.

#### Response 200

```json
{
  "imported": 30,
  "updated": 5,
  "failed": 2,
  "errors": [
    {
      "row": 10,
      "error": "INVALID_DATE"
    }
  ]
}
```

## Erros comuns

```json
{
  "error": "VALIDATION_ERROR",
  "message": "weightKg is required"
}
```

```json
{
  "error": "UNAUTHORIZED"
}
```

```json
{
  "error": "NOT_FOUND"
}
```
