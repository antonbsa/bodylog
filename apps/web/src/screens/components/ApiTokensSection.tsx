import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"

import { formatApiErrorMessage } from "../../../../../infra/errors"
import { MAX_API_TOKENS_PER_USER } from "../../../../../domain/api-token"
import type { ApiTokenSummary } from "../../../../../types/api-tokens"
import { listApiTokens, revokeApiToken } from "../../api/api-tokens"
import { queryKeys } from "../../api/queryKeys"
import { useToast } from "../../hooks/useToast"
import { formatApiTokenDetails } from "../../utils/api-tokens"
import { ConfirmationDialog } from "./ConfirmationDialog"
import { CreateApiTokenDialog } from "./CreateApiTokenDialog"

/** Ajustes section where the user lists, creates and revokes personal API tokens. */
export function ApiTokensSection() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const tokensQuery = useQuery({
    queryFn: listApiTokens,
    queryKey: queryKeys.apiTokens,
  })
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [pendingRevoke, setPendingRevoke] = useState<ApiTokenSummary | null>(
    null,
  )
  const [isRevoking, setIsRevoking] = useState(false)
  const tokens = tokensQuery.data ?? []
  const isAtLimit = tokens.length >= MAX_API_TOKENS_PER_USER

  function handleConfirmRevoke() {
    if (!pendingRevoke) {
      return
    }

    setIsRevoking(true)

    revokeApiToken(pendingRevoke.id)
      .then(async () => {
        await queryClient.invalidateQueries({ queryKey: queryKeys.apiTokens })
        toast.showSuccess("Token revogado")
      })
      .catch((error: unknown) => toast.showError(formatApiErrorMessage(error)))
      .finally(() => {
        setIsRevoking(false)
        setPendingRevoke(null)
      })
  }

  return (
    <>
      <h2 className="sec-title" id="tokens-title">
        Tokens de API
      </h2>
      <section aria-labelledby="tokens-title" className="card tokens-card">
        <p className="tokens-intro">
          Permitem que apps e agentes externos leiam suas medidas.
        </p>

        {tokensQuery.isPending && <p className="tokens-note">Carregando...</p>}
        {tokensQuery.isError && (
          <p className="form-error" role="alert">
            {formatApiErrorMessage(tokensQuery.error)}
          </p>
        )}

        {tokens.length > 0 && (
          <ul className="token-list">
            {tokens.map((token) => (
              <li className="token-row" key={token.id}>
                <span className="token-text">
                  <strong>{token.name}</strong>
                  <span className="token-details">
                    {formatApiTokenDetails(token)}
                  </span>
                </span>
                <button
                  aria-label={`Revogar ${token.name}`}
                  className="token-revoke"
                  onClick={() => setPendingRevoke(token)}
                  type="button"
                >
                  Revogar
                </button>
              </li>
            ))}
          </ul>
        )}

        {tokensQuery.isSuccess &&
          (isAtLimit ? (
            <p className="tokens-note">
              Você já tem {MAX_API_TOKENS_PER_USER} tokens. Revogue um para
              criar outro.
            </p>
          ) : (
            <button
              className="set-row token-create"
              onClick={() => setIsCreateOpen(true)}
              type="button"
            >
              Criar token
            </button>
          ))}
      </section>

      <CreateApiTokenDialog
        onOpenChange={setIsCreateOpen}
        open={isCreateOpen}
      />

      <ConfirmationDialog
        confirmLabel="Revogar"
        confirmingLabel="Revogando..."
        description={`Clientes que usam "${pendingRevoke?.name ?? ""}" perdem o acesso na hora. Esta ação não pode ser desfeita.`}
        isConfirming={isRevoking}
        onConfirm={handleConfirmRevoke}
        onOpenChange={(open) => {
          if (!open && !isRevoking) {
            setPendingRevoke(null)
          }
        }}
        open={pendingRevoke !== null}
        title="Revogar token"
      />
    </>
  )
}
