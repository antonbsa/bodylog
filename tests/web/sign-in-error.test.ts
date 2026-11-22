import { describe, expect, it } from "vitest"

import {
  getSignInErrorMessage,
  withoutSignInError,
} from "../../apps/web/src/utils/sign-in-error"

describe("getSignInErrorMessage", () => {
  it("maps each callback error code to its message", () => {
    expect(getSignInErrorMessage("?error=declined")).toBe(
      "Você cancelou o login. Tente de novo quando quiser.",
    )
    expect(getSignInErrorMessage("?error=state")).toBe(
      "O login expirou ou foi aberto em outra janela. Tente entrar de novo.",
    )
    expect(getSignInErrorMessage("?error=failed")).toBe(
      "Não foi possível entrar. Tente novamente em instantes.",
    )
  })

  it("shows nothing without a code or for an unknown one", () => {
    expect(getSignInErrorMessage("")).toBeNull()
    expect(getSignInErrorMessage("?error=toString")).toBeNull()
    expect(getSignInErrorMessage("?other=1")).toBeNull()
  })
})

describe("withoutSignInError", () => {
  it("drops only the error parameter", () => {
    expect(withoutSignInError("https://app.example/?error=state")).toBe("/")
    expect(
      withoutSignInError("https://app.example/historico?a=1&error=failed#x"),
    ).toBe("/historico?a=1#x")
  })
})
