import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SubmitEvent,
  type SetStateAction,
} from "react"

import {
  getMeasurementByDate,
  saveMeasurementByDate,
  type Measurement,
} from "../../api/measurements"
import {
  formatDisplayDateFromIso,
  getTodayIsoDate,
  parseDisplayDate,
} from "../../utils/date-format"
import { formatInputNumber, parseDecimalInput } from "../../utils/number-format"

type MeasurementFormProps = {
  initialDate?: string
  onClose: () => void
  onSaved: (measurement: Measurement) => void
}

type MeasurementFields = {
  bodyFatPercentage: string
  date: string
  musclePercentage: string
  restingMetabolismKcal: string
  weightKg: string
}

export function MeasurementForm({
  initialDate,
  onClose,
  onSaved,
}: MeasurementFormProps) {
  const todayIso = getTodayIsoDate()
  const initialIsoDate = initialDate ?? todayIso
  const measurementByDateCache = useRef(new Map<string, Measurement | null>())
  const [fields, setFields] = useState<MeasurementFields>(() =>
    createEmptyFields(formatDisplayDateFromIso(initialIsoDate)),
  )
  const [existingMeasurement, setExistingMeasurement] =
    useState<Measurement | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const dateIso = parseDisplayDate(fields.date)

    if (!dateIso || dateIso > todayIso) {
      setExistingMeasurement(null)
      setIsLoading(false)
      return
    }

    if (measurementByDateCache.current.has(dateIso)) {
      const cachedMeasurement =
        measurementByDateCache.current.get(dateIso) ?? null

      setExistingMeasurement(cachedMeasurement)
      setFields((currentFields) => {
        if (currentFields.date !== fields.date) {
          return currentFields
        }

        return cachedMeasurement
          ? createFieldsFromMeasurement(cachedMeasurement)
          : createEmptyFields(fields.date)
      })
      setErrorMessage(null)
      setIsLoading(false)
      return
    }

    let isCurrentLookup = true

    setIsLoading(true)
    setErrorMessage(null)

    getMeasurementByDate(dateIso)
      .then((measurement) => {
        if (!isCurrentLookup) {
          return
        }

        measurementByDateCache.current.set(dateIso, measurement)
        setExistingMeasurement(measurement)
        setFields((currentFields) => {
          if (currentFields.date !== fields.date) {
            return currentFields
          }

          return measurement
            ? createFieldsFromMeasurement(measurement)
            : createEmptyFields(fields.date)
        })
      })
      .catch(() => {
        if (isCurrentLookup) {
          setErrorMessage("Não foi possível carregar a medida dessa data.")
        }
      })
      .finally(() => {
        if (isCurrentLookup) {
          setIsLoading(false)
        }
      })

    return () => {
      isCurrentLookup = false
    }
  }, [fields.date, todayIso])

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isSubmitting) {
      return
    }

    const parsedFields = parseMeasurementFields(fields, todayIso)

    if (!parsedFields.ok) {
      setErrorMessage(parsedFields.message)
      return
    }

    setErrorMessage(null)
    setIsSubmitting(true)

    try {
      const measurement = await saveMeasurementByDate(
        parsedFields.date,
        parsedFields.value,
      )

      measurementByDateCache.current.set(parsedFields.date, measurement)
      onSaved(measurement)
    } catch {
      setErrorMessage("Não foi possível salvar a medida.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const modeLabel = existingMeasurement ? "Editando" : "Criando"
  const modeClassName = existingMeasurement
    ? "mode-badge mode-badge-editing"
    : "mode-badge mode-badge-creating"

  return (
    <div className="modal-backdrop">
      <section
        aria-labelledby="measurement-form-title"
        aria-modal="true"
        className="measurement-modal"
        role="dialog"
      >
        <header className="modal-header">
          <div>
            <h2 id="measurement-form-title">Medida corporal</h2>
          </div>
          <span className={modeClassName}>{modeLabel}</span>
          <span
            aria-live="polite"
            className="modal-loading-status"
            role={isLoading ? "status" : undefined}
          >
            {isLoading ? "Carregando dados" : ""}
          </span>
        </header>

        <form className="measurement-form" onSubmit={handleSubmit}>
          <label>
            Data
            <input
              autoComplete="off"
              disabled={isSubmitting}
              inputMode="numeric"
              maxLength={10}
              onChange={(event) =>
                updateField(setFields, "date", event.target.value)
              }
              pattern="\d{2}/\d{2}/\d{4}"
              required
              type="text"
              value={fields.date}
            />
          </label>

          <label>
            Peso (kg)
            <input
              autoComplete="off"
              disabled={isLoading || isSubmitting}
              inputMode="decimal"
              onChange={(event) =>
                updateField(setFields, "weightKg", event.target.value)
              }
              required
              value={fields.weightKg}
            />
          </label>

          <label>
            Gordura corporal (%)
            <input
              autoComplete="off"
              disabled={isLoading || isSubmitting}
              inputMode="decimal"
              onChange={(event) =>
                updateField(setFields, "bodyFatPercentage", event.target.value)
              }
              value={fields.bodyFatPercentage}
            />
          </label>

          <label>
            Músculo (%)
            <input
              autoComplete="off"
              disabled={isLoading || isSubmitting}
              inputMode="decimal"
              onChange={(event) =>
                updateField(setFields, "musclePercentage", event.target.value)
              }
              value={fields.musclePercentage}
            />
          </label>

          <label>
            Metabolismo de repouso (kcal)
            <input
              autoComplete="off"
              disabled={isLoading || isSubmitting}
              inputMode="numeric"
              onChange={(event) =>
                updateField(
                  setFields,
                  "restingMetabolismKcal",
                  event.target.value,
                )
              }
              value={fields.restingMetabolismKcal}
            />
          </label>

          {errorMessage ? (
            <p className="form-error" role="alert">
              {errorMessage}
            </p>
          ) : null}

          <div className="modal-actions">
            <button
              className="secondary-action"
              disabled={isSubmitting}
              onClick={onClose}
              type="button"
            >
              Cancelar
            </button>
            <button
              className="primary-action"
              disabled={isLoading || isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Salvando..." : "Salvar medida"}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

function updateField(
  setFields: Dispatch<SetStateAction<MeasurementFields>>,
  field: keyof MeasurementFields,
  value: string,
) {
  setFields((currentFields) => ({
    ...currentFields,
    [field]: value,
  }))
}

function createEmptyFields(date: string): MeasurementFields {
  return {
    bodyFatPercentage: "",
    date,
    musclePercentage: "",
    restingMetabolismKcal: "",
    weightKg: "",
  }
}

function createFieldsFromMeasurement(
  measurement: Measurement,
): MeasurementFields {
  return {
    bodyFatPercentage: formatInputNumber(measurement.bodyFatPercentage),
    date: formatDisplayDateFromIso(measurement.date),
    musclePercentage: formatInputNumber(measurement.musclePercentage),
    restingMetabolismKcal: formatInputNumber(measurement.restingMetabolismKcal),
    weightKg: formatInputNumber(measurement.weightKg),
  }
}

function parseMeasurementFields(fields: MeasurementFields, todayIso: string) {
  const dateIso = parseDisplayDate(fields.date)

  if (!dateIso || dateIso > todayIso) {
    return {
      message: "Informe a data no formato DD/MM/AAAA.",
      ok: false as const,
    }
  }

  const weightKg = parseRequiredDecimal(fields.weightKg)
  const bodyFatPercentage = parseOptionalDecimal(fields.bodyFatPercentage)
  const musclePercentage = parseOptionalDecimal(fields.musclePercentage)
  const restingMetabolismKcal = parseOptionalDecimal(
    fields.restingMetabolismKcal,
  )

  if (weightKg === null) {
    return {
      message: "Informe o peso.",
      ok: false as const,
    }
  }

  if (
    bodyFatPercentage === undefined ||
    musclePercentage === undefined ||
    restingMetabolismKcal === undefined
  ) {
    return {
      message: "Use apenas números válidos nos campos opcionais.",
      ok: false as const,
    }
  }

  return {
    date: dateIso,
    ok: true as const,
    value: {
      bodyFatPercentage,
      musclePercentage,
      restingMetabolismKcal,
      weightKg,
    },
  }
}

function parseRequiredDecimal(value: string): number | null {
  const parsedValue = parseDecimalInput(value)

  return parsedValue === undefined ? null : parsedValue
}

function parseOptionalDecimal(value: string): number | null | undefined {
  return value.trim() === "" ? null : parseDecimalInput(value)
}
