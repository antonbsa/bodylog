import { useEffect, useMemo, useRef, useState, type SubmitEvent } from "react"
import { useLocation, useSearchParams } from "react-router"
import { useQueryClient } from "@tanstack/react-query"

import { formatApiErrorMessage } from "../../../../infra/errors"
import { deleteMeasurement, saveMeasurementByDate } from "../api/measurements"
import { invalidateMeasurementData } from "../api/queryKeys"
import {
  useRegistrationData,
  type RegistrationData,
} from "../hooks/useRegistrationData"
import { useKeyboardOpenFlag } from "../hooks/useKeyboardOpenFlag"
import { useToast } from "../hooks/useToast"
import { readOrigin, useTabNavigate } from "../hooks/useTabNavigate"
import { ConfirmationDialog } from "./components/ConfirmationDialog"
import { DispositionField } from "./components/DispositionField"
import { NumberField } from "./components/NumberField"
import { RegistrationDateBar } from "./components/RegistrationDateBar"
import {
  formatDayMonth,
  getTodayIsoDate,
  isPastOrTodayIsoDate,
} from "../utils/date-format"
import {
  EMPTY_FORM,
  NUMERIC_FIELDS,
  NUMERIC_FIELD_ORDER,
  buildMeasurementInput,
  deriveFromForm,
  formFromMeasurement,
  isSameForm,
  stepSleepDigits,
  validateForm,
  type FormValues,
  type NumericFieldKey,
} from "../utils/measurement-form"
import { formatOneDecimal } from "../utils/number-format"
import { formatMaskedDigits, numberToMaskedDigits } from "../utils/numeric-mask"
import type { ListedMeasurement } from "../types"

type Dialog = { kind: "delete" } | { kind: "discard"; proceed: () => void }

const BALANCE_FIELDS: readonly NumericFieldKey[] = [
  "weightKg",
  "bodyFatPercentage",
  "musclePercentage",
  "restingMetabolismKcal",
]

function formatPreviousValue(
  previous: ListedMeasurement | null,
  key: NumericFieldKey,
): string {
  const value = previous?.[key] ?? null

  if (value === null) {
    return ""
  }

  const { decimals } = NUMERIC_FIELDS[key]

  return `anterior: ${formatMaskedDigits(numberToMaskedDigits(value, decimals), decimals)}`
}

export function RegistrationScreen() {
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()
  const { navigate, replace } = useTabNavigate()
  const queryClient = useQueryClient()
  const today = getTodayIsoDate()
  const requestedDate = searchParams.get("data")
  const date = isPastOrTodayIsoDate(requestedDate) ? requestedDate : today

  const { data, error: loadError, reload } = useRegistrationData(date)
  const toast = useToast()
  const [form, setForm] = useState<FormValues>(EMPTY_FORM)
  const [touched, setTouched] = useState<
    Partial<Record<NumericFieldKey, true>>
  >({})
  const [showAllErrors, setShowAllErrors] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [dialog, setDialog] = useState<Dialog | null>(null)
  const [syncedData, setSyncedData] = useState<RegistrationData | null>(null)
  const footerRef = useRef<HTMLElement | null>(null)
  const changedFields = useRef<Set<NumericFieldKey>>(new Set())
  const inputRefs = useRef<
    Partial<Record<NumericFieldKey, HTMLInputElement | null>>
  >({})

  useKeyboardOpenFlag(footerRef)

  // Scopes the document-level scroll padding to this screen so the tab screens are unaffected.
  useEffect(() => {
    document.documentElement.classList.add("reg-page")

    return () => document.documentElement.classList.remove("reg-page")
  }, [])

  // Reset before paint when another date's data arrives (or loads), so its values never show;
  // a background refetch of the same date resets only a pristine form, never edits in progress.
  if (data !== syncedData) {
    const isSameDate =
      data !== null && syncedData !== null && data.date === syncedData.date
    const hasEdits =
      syncedData !== null &&
      !isSameForm(form, formFromMeasurement(syncedData.measurement))

    setSyncedData(data)

    if (!isSameDate || !hasEdits) {
      setForm(formFromMeasurement(data?.measurement ?? null))
      setTouched({})
      changedFields.current.clear()
      setShowAllErrors(false)
    }
  }

  const baseline = useMemo(
    () => formFromMeasurement(data?.measurement ?? null),
    [data],
  )
  const isDirty = data !== null && !isSameForm(form, baseline)
  const isLoading = data === null && loadError === null
  const isEditing = data?.measurement != null
  const isBusy = isLoading || isSubmitting || isDeleting
  const errors = validateForm(form)
  const previous = data?.previous ?? null
  const heightCm = isEditing ? (data?.heightCm ?? null) : null
  const showDerived = heightCm !== null
  const derived = heightCm === null ? null : deriveFromForm(form, heightCm)

  function visibleError(key: NumericFieldKey): string {
    return touched[key] || showAllErrors ? (errors[key] ?? "") : ""
  }

  function updateDigits(key: NumericFieldKey, digits: string) {
    changedFields.current.add(key)
    setForm((current) => ({
      ...current,
      digits: { ...current.digits, [key]: digits },
    }))
  }

  function leave() {
    // The origin entry was replaced, so history back can't reach it; a deep link has no origin and lands on Início.
    navigate(readOrigin(location.state))
  }

  /** Runs `action` now, or after the user confirms discarding unsaved changes. */
  function afterDiscardCheck(action: () => void) {
    if (isDirty) {
      setDialog({ kind: "discard", proceed: action })
      return
    }

    action()
  }

  function changeDate(next: string) {
    if (next === date || !isPastOrTodayIsoDate(next)) {
      return
    }

    // Keeps the origin state, which setSearchParams would otherwise drop, so Cancelar still finds the tab.
    afterDiscardCheck(() =>
      setSearchParams({ data: next }, { replace, state: location.state }),
    )
  }

  function fieldProps(key: NumericFieldKey) {
    return {
      config: NUMERIC_FIELDS[key],
      digits: form.digits[key],
      error: visibleError(key),
      hint: formatPreviousValue(previous, key),
      id: `field-${key}`,
      inputRef: (element: HTMLInputElement | null) => {
        inputRefs.current[key] = element
      },
      onBlur: () => {
        // Leaving an untouched field shows nothing; once shown, an error stays live while retyping.
        if (changedFields.current.has(key)) {
          setTouched((current) => ({ ...current, [key]: true }))
        }
      },
      onDigitsChange: (digits: string) => updateDigits(key, digits),
    }
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isBusy) {
      return
    }

    setShowAllErrors(true)

    const firstInvalid = NUMERIC_FIELD_ORDER.find((key) => errors[key])

    if (firstInvalid) {
      const input = inputRefs.current[firstInvalid]

      input?.focus()
      input?.scrollIntoView({ block: "center" })
      return
    }

    const input = buildMeasurementInput(form)

    if (!input) {
      return
    }

    setIsSubmitting(true)

    try {
      await saveMeasurementByDate(date, input)
      invalidateMeasurementData(queryClient)
      toast.showSuccess(`Medida de ${formatDayMonth(date)} salva`)
      navigate("/")
    } catch (error) {
      toast.showError(formatApiErrorMessage(error))
      setIsSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!data?.measurement) {
      return
    }

    setIsDeleting(true)

    try {
      await deleteMeasurement(data.measurement.id)
      invalidateMeasurementData(queryClient)
      toast.showSuccess(`Medida de ${formatDayMonth(date)} excluída`)
      navigate("/")
    } catch (error) {
      toast.showError(formatApiErrorMessage(error))
      setIsDeleting(false)
      setDialog(null)
    }
  }

  const badgeText = isLoading
    ? "Carregando…"
    : isEditing
      ? `Editando medida de ${formatDayMonth(date)}`
      : "Nova medida"

  return (
    <div className="reg-screen">
      <header className="reg-head gut">
        <h1 className="visually-hidden">Registrar medida</h1>
        <button
          className="reg-cancel"
          disabled={isSubmitting || isDeleting}
          onClick={() => afterDiscardCheck(leave)}
          type="button"
        >
          Cancelar
        </button>
        <RegistrationDateBar
          date={date}
          onDateChange={changeDate}
          today={today}
        />
      </header>

      <main className="reg-main gut">
        <form id="registration-form" noValidate onSubmit={handleSubmit}>
          <fieldset className="reg-fieldset" disabled={isBusy}>
            <div className="reg-status">
              {loadError ? (
                <>
                  <p className="reg-error" role="alert">
                    {loadError}
                  </p>
                  <button className="reg-link" onClick={reload} type="button">
                    Tentar novamente
                  </button>
                </>
              ) : (
                <span className="badge" role="status">
                  {badgeText}
                </span>
              )}
            </div>

            <h2 className="sec-title">Balança</h2>
            <div className="card reg-card">
              {BALANCE_FIELDS.map((key) => (
                <NumberField key={key} {...fieldProps(key)} />
              ))}
            </div>

            {showDerived ? (
              <>
                <h2 className="sec-title">Calculados</h2>
                <div className="card reg-card">
                  <div
                    aria-label="Valores calculados, somente leitura"
                    className="derived"
                    role="group"
                  >
                    <div>
                      <span className="k">IMC</span>
                      <DerivedValue value={derived?.bmi ?? null} />
                    </div>
                    <div>
                      <span className="k">Gordura</span>
                      <DerivedValue
                        unit="kg"
                        value={derived?.bodyFatKg ?? null}
                      />
                    </div>
                    <div>
                      <span className="k">Músculo</span>
                      <DerivedValue
                        unit="kg"
                        value={derived?.muscleKg ?? null}
                      />
                    </div>
                  </div>
                </div>
              </>
            ) : null}

            <h2 className="sec-title">Medidas</h2>
            <div className="card reg-card">
              <NumberField {...fieldProps("waistCm")} />
            </div>

            <h2 className="sec-title">Como você está</h2>
            <div className="card reg-card">
              <NumberField
                {...fieldProps("sleepHours")}
                caption="noite passada"
                onStep={(direction) => {
                  updateDigits(
                    "sleepHours",
                    stepSleepDigits(
                      form.digits.sleepHours,
                      direction,
                      previous?.sleepHours ?? null,
                    ),
                  )
                  setTouched((current) => ({ ...current, sleepHours: true }))
                }}
              />
              <DispositionField
                hint={
                  previous?.disposition != null
                    ? `anterior: ${previous.disposition}`
                    : ""
                }
                onChange={(disposition) =>
                  setForm((current) => ({ ...current, disposition }))
                }
                value={form.disposition}
              />
            </div>

            <h2 className="sec-title">
              <label htmlFor="field-notes">Notas</label>
            </h2>
            <div className="card reg-card">
              <textarea
                id="field-notes"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    notes: event.target.value,
                  }))
                }
                placeholder="Opcional"
                rows={3}
                value={form.notes}
              />
            </div>

            {isEditing ? (
              <div className="del-wrap">
                <button
                  className="reg-delete"
                  onClick={() => setDialog({ kind: "delete" })}
                  type="button"
                >
                  Excluir medida
                </button>
              </div>
            ) : null}
          </fieldset>
        </form>
      </main>

      <footer className="reg-foot gut" ref={footerRef}>
        <button
          className="reg-save"
          disabled={isBusy || data === null}
          form="registration-form"
          type="submit"
        >
          {isSubmitting
            ? isEditing
              ? "Atualizando…"
              : "Salvando…"
            : isEditing
              ? "Atualizar"
              : "Salvar"}
        </button>
      </footer>

      <ConfirmationDialog
        cancelLabel="Continuar editando"
        confirmLabel="Descartar"
        description="Os valores digitados nesta medida serão perdidos."
        onConfirm={() => {
          if (dialog?.kind === "discard") {
            dialog.proceed()
          }

          setDialog(null)
        }}
        onOpenChange={(open) => {
          if (!open) {
            setDialog(null)
          }
        }}
        open={dialog?.kind === "discard"}
        title="Descartar alterações?"
      />
      <ConfirmationDialog
        confirmLabel="Excluir"
        confirmingLabel="Excluindo…"
        description="Esta medida será removida do histórico."
        isConfirming={isDeleting}
        onConfirm={handleDelete}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setDialog(null)
          }
        }}
        open={dialog?.kind === "delete"}
        title={
          <>
            Excluir medida de <strong>{formatDayMonth(date)}</strong>?
          </>
        }
      />
    </div>
  )
}

function DerivedValue({
  unit,
  value,
}: {
  unit?: string
  value: number | null
}) {
  return (
    <span className="v num">
      {value === null ? (
        "—"
      ) : (
        <>
          {formatOneDecimal(value)}
          {unit ? <small>{unit}</small> : null}
        </>
      )}
    </span>
  )
}
