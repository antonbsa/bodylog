import { describe, expect, it } from "vitest"

import {
  EMPTY_FORM,
  buildMeasurementInput,
  deriveFromForm,
  formFromMeasurement,
  isSameForm,
  stepSleepDigits,
  validateField,
  validateForm,
  type FormValues,
} from "../../apps/web/src/utils/measurement-form"
import type { Measurement } from "../../types/measurements"

function formWith(digits: Partial<FormValues["digits"]>): FormValues {
  return { ...EMPTY_FORM, digits: { ...EMPTY_FORM.digits, ...digits } }
}

const storedMeasurement: Measurement = {
  bodyFatPercentage: 14.5,
  createdAt: "2026-06-09T12:00:00.000Z",
  date: "2026-06-10",
  disposition: 4,
  id: "stored",
  musclePercentage: 43.7,
  notes: "Slept well",
  restingMetabolismKcal: 1700,
  sleepHours: 7.5,
  updatedAt: "2026-06-09T12:00:00.000Z",
  waistCm: 80.5,
  weightKg: 72.9,
}

describe("measurement form validation", () => {
  it("requires only the weight", () => {
    expect(validateForm(EMPTY_FORM)).toEqual({ weightKg: "Informe o peso." })
    expect(validateForm(formWith({ weightKg: "725" }))).toEqual({})
  })

  it("blocks values outside the hard limits with a message that names the range", () => {
    expect(validateField("weightKg", formWith({ weightKg: "199" }))).toBe(
      "Use um valor entre 20 e 300 kg.",
    )
    expect(validateField("weightKg", formWith({ weightKg: "3001" }))).toBe(
      "Use um valor entre 20 e 300 kg.",
    )
    expect(
      validateField("bodyFatPercentage", formWith({ bodyFatPercentage: "9" })),
    ).toBe("Use um valor entre 1 e 80 %.")
    expect(
      validateField("musclePercentage", formWith({ musclePercentage: "801" })),
    ).toBe("Use um valor entre 1 e 80 %.")
    expect(
      validateField(
        "restingMetabolismKcal",
        formWith({ restingMetabolismKcal: "499" }),
      ),
    ).toBe("Use um valor entre 500 e 5000 kcal.")
    expect(validateField("waistCm", formWith({ waistCm: "2999" }))).toBe(
      "Use um valor entre 30 e 250 cm.",
    )
    expect(validateField("sleepHours", formWith({ sleepHours: "241" }))).toBe(
      "Use um valor entre 0 e 24 h.",
    )
  })

  it("accepts the limits themselves and zero hours of sleep", () => {
    expect(validateField("weightKg", formWith({ weightKg: "200" }))).toBe("")
    expect(validateField("weightKg", formWith({ weightKg: "3000" }))).toBe("")
    expect(validateField("sleepHours", formWith({ sleepHours: "0" }))).toBe("")
    expect(validateField("sleepHours", formWith({ sleepHours: "240" }))).toBe(
      "",
    )
  })
})

describe("measurement form values", () => {
  it("round-trips a stored measurement into the form", () => {
    const form = formFromMeasurement(storedMeasurement)

    expect(form.digits).toEqual({
      bodyFatPercentage: "145",
      musclePercentage: "437",
      restingMetabolismKcal: "1700",
      sleepHours: "75",
      waistCm: "805",
      weightKg: "729",
    })
    expect(buildMeasurementInput(form)).toEqual({
      bodyFatPercentage: 14.5,
      disposition: 4,
      musclePercentage: 43.7,
      notes: "Slept well",
      restingMetabolismKcal: 1700,
      sleepHours: 7.5,
      waistCm: 80.5,
      weightKg: 72.9,
    })
  })

  it("sends null for fields the user emptied so stored values are cleared", () => {
    const form: FormValues = {
      ...formFromMeasurement(storedMeasurement),
      disposition: null,
      notes: "   ",
    }

    form.digits.waistCm = ""
    form.digits.sleepHours = ""

    expect(buildMeasurementInput(form)).toMatchObject({
      disposition: null,
      notes: null,
      sleepHours: null,
      waistCm: null,
    })
  })

  it("trims notes and refuses to build input without a weight", () => {
    expect(
      buildMeasurementInput({
        ...formWith({ weightKg: "725" }),
        notes: " ok ",
      }),
    ).toMatchObject({ notes: "ok", weightKg: 72.5 })
    expect(buildMeasurementInput(EMPTY_FORM)).toBeNull()
  })

  it("compares forms field by field", () => {
    const stored = formFromMeasurement(storedMeasurement)

    expect(isSameForm(stored, formFromMeasurement(storedMeasurement))).toBe(
      true,
    )
    expect(isSameForm(stored, { ...stored, notes: "changed" })).toBe(false)
    expect(isSameForm(stored, { ...stored, disposition: null })).toBe(false)
    expect(
      isSameForm(stored, {
        ...stored,
        digits: { ...stored.digits, weightKg: "730" },
      }),
    ).toBe(false)
  })
})

describe("derived values from the form", () => {
  it("computes BMI and masses from the typed weight and percentages", () => {
    expect(
      deriveFromForm(
        formWith({
          bodyFatPercentage: "200",
          musclePercentage: "400",
          weightKg: "720",
        }),
        180,
      ),
    ).toEqual({ bmi: 22.22, bodyFatKg: 14.4, muscleKg: 28.8 })
  })

  it("leaves masses empty when a percentage is missing or out of range", () => {
    expect(
      deriveFromForm(
        formWith({ bodyFatPercentage: "9", weightKg: "720" }),
        180,
      ),
    ).toEqual({ bmi: 22.22, bodyFatKg: null, muscleKg: null })
  })

  it("returns null while the weight is missing or out of range", () => {
    expect(deriveFromForm(EMPTY_FORM, 180)).toBeNull()
    expect(deriveFromForm(formWith({ weightKg: "100" }), 180)).toBeNull()
  })
})

describe("sleep stepper", () => {
  it("fills the previous value on the first tap, or 7 h when there is none", () => {
    expect(stepSleepDigits("", 1, 6.5)).toBe("65")
    expect(stepSleepDigits("", -1, 6.5)).toBe("65")
    expect(stepSleepDigits("", 1, null)).toBe("70")
  })

  it("steps by half an hour within 0 to 24 h", () => {
    expect(stepSleepDigits("70", 1, null)).toBe("75")
    expect(stepSleepDigits("70", -1, null)).toBe("65")
    expect(stepSleepDigits("240", 1, null)).toBe("240")
    expect(stepSleepDigits("0", -1, null)).toBe("0")
    expect(stepSleepDigits("5", -1, null)).toBe("0")
  })
})
