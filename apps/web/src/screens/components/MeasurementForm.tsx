import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SubmitEvent,
  type SetStateAction,
} from "react"
import { Badge, Dialog, Flex, TextField } from "@radix-ui/themes"

import { formatApiErrorMessage } from "../../../../../infra/errors"
import { Button } from "../../components/Button"
import {
  getMeasurementByDate,
  saveMeasurementByDate,
} from "../../api/measurements"
import {
  formatDisplayDateFromIso,
  getTodayIsoDate,
  parseDisplayDate,
} from "../../utils/date-format"
import { formatInputNumber, parseDecimalInput } from "../../utils/number-format"
import type { Measurement } from "../../../../../types/measurements"

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
      .catch((error: unknown) => {
        if (isCurrentLookup) {
          setErrorMessage(formatApiErrorMessage(error))
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
      // The form has no inputs for the new fields yet; resend the stored
      // values so editing a day does not clear them.
      const stored = measurementByDateCache.current.get(parsedFields.date)
      const measurement = await saveMeasurementByDate(parsedFields.date, {
        ...parsedFields.value,
        disposition: stored?.disposition ?? null,
        notes: stored?.notes ?? null,
        sleepHours: stored?.sleepHours ?? null,
        waistCm: stored?.waistCm ?? null,
      })

      measurementByDateCache.current.set(parsedFields.date, measurement)
      onSaved(measurement)
    } catch (error) {
      setErrorMessage(formatApiErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  const modeLabel = existingMeasurement ? "Editando" : "Criando"
  const modeColor = existingMeasurement ? "amber" : "green"

  return (
    <Dialog.Root
      onOpenChange={(open) => {
        if (!open) {
          onClose()
        }
      }}
      open
    >
      <Dialog.Content maxWidth="520px">
        <Flex align="start" gap="4" justify="between" mb="4">
          <Dialog.Title mb="0">Medida corporal</Dialog.Title>
          <Badge color={modeColor} variant="outline" radius="full">
            {modeLabel}
          </Badge>
        </Flex>
        <span
          aria-live="polite"
          className="modal-loading-status"
          role={isLoading ? "status" : undefined}
        >
          {isLoading ? "Carregando dados" : ""}
        </span>

        <form className="measurement-form" onSubmit={handleSubmit}>
          <label>
            Data
            <TextField.Root
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
            <TextField.Root
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
            <TextField.Root
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
            <TextField.Root
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
            <TextField.Root
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

          <Flex className="modal-actions" gap="3">
            <Button
              disabled={isSubmitting}
              onClick={onClose}
              type="button"
              variant="secondary"
            >
              Cancelar
            </Button>
            <Button disabled={isLoading || isSubmitting} type="submit">
              {isSubmitting ? "Salvando..." : "Salvar medida"}
            </Button>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
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
