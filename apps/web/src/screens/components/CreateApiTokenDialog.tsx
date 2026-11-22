import { useState, type FormEvent } from "react"
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
  onOpenChange: (open: boolean) => void
  open: boolean
}

/** Asks for a name, then shows the new token once, since the API never returns it again. */
export function CreateApiTokenDialog({
  onOpenChange,
  open,
}: CreateApiTokenDialogProps) {
  const queryClient = useQueryClient()
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [createdToken, setCreatedToken] = useState<string | null>(null)
  const [copyStatus, setCopyStatus] = useState<"copied" | "failed" | null>(null)

  function handleOpenChange(nextOpen: boolean) {
    if (isCreating) {
      return
    }

    if (!nextOpen) {
      setName("")
      setError(null)
      setCreatedToken(null)
      setCopyStatus(null)
    }

    onOpenChange(nextOpen)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const normalizedName = normalizeApiTokenName(name)

    if (normalizedName === null) {
      setError("Informe um nome para o token.")
      return
    }

    setIsCreating(true)
    setError(null)

    createApiToken(normalizedName)
      .then(async (created) => {
        setCreatedToken(created.token)
        await queryClient.invalidateQueries({ queryKey: queryKeys.apiTokens })
      })
      .catch((createError: unknown) =>
        setError(formatApiErrorMessage(createError)),
      )
      .finally(() => setIsCreating(false))
  }

  function handleCopy() {
    if (!createdToken) {
      return
    }

    navigator.clipboard
      .writeText(createdToken)
      .then(() => setCopyStatus("copied"))
      .catch(() => setCopyStatus("failed"))
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
            <textarea
              aria-label="Token"
              className="token-value"
              onFocus={(event) => event.target.select()}
              readOnly
              rows={2}
              spellCheck={false}
              value={createdToken}
            />
            {/* Feedback stays inside the dialog: the modal hides the page's toasts from screen readers. */}
            <p
              className={
                copyStatus === "failed" ? "form-error" : "token-copied"
              }
              role="status"
            >
              {copyStatus === "copied" && "Token copiado."}
              {copyStatus === "failed" &&
                "Não foi possível copiar. Selecione o token e copie manualmente."}
            </p>
            <Flex className="dialog-actions" direction="column" gap="2" mt="4">
              <Button fullWidth onClick={handleCopy} type="button">
                Copiar token
              </Button>
              <Dialog.Close>
                <Button fullWidth type="button" variant="secondary">
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
              aria-describedby={error ? "token-name-error" : undefined}
              aria-invalid={error ? true : undefined}
              autoComplete="off"
              className="token-input"
              disabled={isCreating}
              id="token-name"
              maxLength={API_TOKEN_NAME_MAX_LENGTH}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ex.: Agente de IA"
              value={name}
            />
            {error && (
              <p className="form-error" id="token-name-error" role="alert">
                {error}
              </p>
            )}
            <Flex className="dialog-actions" direction="column" gap="2" mt="4">
              <Button disabled={isCreating} fullWidth type="submit">
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
