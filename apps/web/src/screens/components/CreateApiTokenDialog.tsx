import { useRef, useState, type FormEvent } from "react"
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

const COPIED_FEEDBACK_MS = 2500
// Keep in agreement with the `.token-copied` opacity transition in settings.css.
const COPIED_FADE_MS = 300

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
  const [isFading, setIsFading] = useState(false)
  const copiedTimeout = useRef<number | undefined>(undefined)
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
      window.clearTimeout(copiedTimeout.current)
      setName("")
      setError(null)
      setCreatedToken(null)
      setCopyStatus(null)
      setIsCopiedByIcon(false)
      setIsFading(false)
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

  /** Copies the token; with `fromIcon`, the icon also turns into a check until the feedback fades. */
  function copyToken(token: string, fromIcon = false) {
    window.clearTimeout(copiedTimeout.current)

    // Can fail after the request (e.g. Safari drops the click's activation), so the copy button stays.
    navigator.clipboard.writeText(token).then(
      () => {
        setCopyStatus("copied")
        setIsCopiedByIcon(fromIcon)
        setIsFading(false)
        copiedTimeout.current = window.setTimeout(() => {
          setIsCopiedByIcon(false)
          setIsFading(true)
          // Cleared after the fade so a later copy changes the text and is announced again.
          copiedTimeout.current = window.setTimeout(() => {
            setCopyStatus(null)
            setIsFading(false)
          }, COPIED_FADE_MS)
        }, COPIED_FEEDBACK_MS)
      },
      () => {
        setCopyStatus("failed")
        setIsCopiedByIcon(false)
        setIsFading(false)
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
                onClick={() => copyToken(createdToken, true)}
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
            <div className="token-message">
              <p
                className={
                  copyStatus === "failed"
                    ? "form-error"
                    : `token-copied${isFading ? " is-fading" : ""}`
                }
                role="status"
              >
                {copyStatus === "copied" && "Token copiado."}
                {copyStatus === "failed" &&
                  "Não foi possível copiar. Toque no ícone."}
              </p>
            </div>
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
            <div className="token-message">
              {nameError && (
                <p className="form-error" id="token-name-error" role="alert">
                  {nameError}
                </p>
              )}
            </div>
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
