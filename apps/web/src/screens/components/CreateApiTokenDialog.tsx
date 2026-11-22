import { useState, type FormEvent } from "react"
import { Check } from "@phosphor-icons/react/dist/csr/Check"
import { Copy } from "@phosphor-icons/react/dist/csr/Copy"
import { Dialog, Flex } from "@radix-ui/themes"
import { useQueryClient } from "@tanstack/react-query"

import { formatApiErrorMessage } from "../../../../../infra/errors"
import {
  API_TOKEN_NAME_MAX_LENGTH,
  normalizeApiTokenName,
} from "../../../../../domain/api-token"
import { Button } from "../../components/Button"
import { createApiToken } from "../../api/api-tokens"
import { queryKeys } from "../../api/queryKeys"

type CreateApiTokenDialogProps = {
  existingNames: string[]
  onOpenChange: (open: boolean) => void
  open: boolean
}

/** Asks for a name, then shows the new token once, already copied, since the API never returns it again. */
export function CreateApiTokenDialog({
  existingNames,
  onOpenChange,
  open,
}: CreateApiTokenDialogProps) {
  const queryClient = useQueryClient()
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [createdToken, setCreatedToken] = useState<string | null>(null)
  const [copyStatus, setCopyStatus] = useState<"copied" | "failed" | null>(null)
  const [isCopiedByIcon, setIsCopiedByIcon] = useState(false)
  const normalizedName = normalizeApiTokenName(name)
  const isDuplicateName =
    normalizedName !== null && existingNames.includes(normalizedName)
  const nameError = isDuplicateName
    ? "Já existe um token com esse nome."
    : error

  function handleOpenChange(nextOpen: boolean) {
    if (isCreating) {
      return
    }

    if (!nextOpen) {
      setName("")
      setError(null)
      setCreatedToken(null)
      setCopyStatus(null)
      setIsCopiedByIcon(false)
    }

    onOpenChange(nextOpen)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isDuplicateName) {
      return
    }

    if (normalizedName === null) {
      setError("Informe um nome para o token.")
      return
    }

    setIsCreating(true)
    setError(null)

    createApiToken(normalizedName)
      .then(async (created) => {
        setCreatedToken(created.token)
        copyToken(created.token)
        await queryClient.invalidateQueries({ queryKey: queryKeys.apiTokens })
      })
      .catch((createError: unknown) =>
        setError(formatApiErrorMessage(createError)),
      )
      .finally(() => setIsCreating(false))
  }

  /** Resolves to whether the token reached the clipboard. */
  function copyToken(token: string) {
    // Can fail after the request (e.g. Safari drops the click's activation), so the copy button stays.
    return navigator.clipboard.writeText(token).then(
      () => {
        setCopyStatus("copied")
        return true
      },
      () => {
        setCopyStatus("failed")
        return false
      },
    )
  }

  return (
    <Dialog.Root onOpenChange={handleOpenChange} open={open}>
      <Dialog.Content
        aria-describedby={undefined}
        className="token-dialog"
        maxWidth="420px"
      >
        {createdToken ? (
          <>
            <Dialog.Title>Token criado</Dialog.Title>
            <p className="token-warning">
              Copie o token agora. Ele não será mostrado novamente.
            </p>
            <div className="token-value-field">
              <textarea
                aria-label="Token"
                className="token-value"
                onFocus={(event) => event.target.select()}
                readOnly
                rows={2}
                spellCheck={false}
                value={createdToken}
              />
              <button
                aria-label="Copiar token"
                className="token-copy"
                onClick={() => copyToken(createdToken).then(setIsCopiedByIcon)}
                type="button"
              >
                {isCopiedByIcon ? (
                  <Check aria-hidden size={20} />
                ) : (
                  <Copy aria-hidden size={20} />
                )}
              </button>
            </div>
            {/* Feedback stays inside the dialog: the modal hides the page's toasts from screen readers. */}
            <p
              className={
                copyStatus === "failed" ? "form-error" : "token-copied"
              }
              role="status"
            >
              {copyStatus === "copied" && "Token copiado."}
              {copyStatus === "failed" &&
                "Não foi possível copiar. Toque no ícone ou selecione o token."}
            </p>
            <Flex className="dialog-actions" direction="column" gap="2" mt="4">
              <Dialog.Close>
                <Button fullWidth type="button">
                  Concluir
                </Button>
              </Dialog.Close>
            </Flex>
          </>
        ) : (
          <form noValidate onSubmit={handleSubmit}>
            <Dialog.Title>Novo token</Dialog.Title>
            <label className="token-label" htmlFor="token-name">
              Nome
            </label>
            <input
              aria-describedby={nameError ? "token-name-error" : undefined}
              aria-invalid={nameError ? true : undefined}
              autoComplete="off"
              className="token-input"
              disabled={isCreating}
              id="token-name"
              maxLength={API_TOKEN_NAME_MAX_LENGTH}
              onChange={(event) => {
                setName(event.target.value)
                setError(null)
              }}
              placeholder="Ex.: Agente de IA"
              value={name}
            />
            {nameError && (
              <p className="form-error" id="token-name-error" role="alert">
                {nameError}
              </p>
            )}
            <Flex className="dialog-actions" direction="column" gap="2" mt="4">
              <Button
                disabled={isCreating || isDuplicateName}
                fullWidth
                type="submit"
              >
                {isCreating ? "Criando..." : "Criar token"}
              </Button>
              <Dialog.Close>
                <Button
                  disabled={isCreating}
                  fullWidth
                  type="button"
                  variant="secondary"
                >
                  Cancelar
                </Button>
              </Dialog.Close>
            </Flex>
          </form>
        )}
      </Dialog.Content>
    </Dialog.Root>
  )
}
