import { Check } from "@phosphor-icons/react/dist/csr/Check"
import { Copy } from "@phosphor-icons/react/dist/csr/Copy"

import { useCopyFeedback } from "../../hooks/useCopyFeedback"
import { ApiTokenList } from "./ApiTokenList"
import { ConnectAgentDialog } from "./ConnectAgentDialog"

/** Ajustes group with everything an AI agent needs to read the user's measurements: the MCP URL, the API tokens and the setup guide. */
export function AiAgentsSection() {
  const mcpUrl = `${window.location.origin}/mcp`
  const { copy, copyStatus, isFading, isJustCopied } = useCopyFeedback()

  return (
    <>
      <h2 className="sec-title" id="ai-agents-title">
        Agentes de IA
      </h2>
      <section aria-labelledby="ai-agents-title" className="card tokens-card">
        <p className="tokens-intro">
          Conecte um agente com esta URL e um token. Ele só lê suas medidas.
        </p>
        <div className="token-value-field">
          <input
            aria-label="URL do servidor MCP"
            className="token-value"
            onFocus={(event) => event.target.select()}
            readOnly
            spellCheck={false}
            value={mcpUrl}
          />
          <button
            aria-label="Copiar URL"
            className="token-copy"
            onClick={() => copy(mcpUrl)}
            type="button"
          >
            {isJustCopied ? (
              <Check aria-hidden size={20} />
            ) : (
              <Copy aria-hidden size={20} />
            )}
          </button>
        </div>
        <div className="token-message">
          <p
            className={
              copyStatus === "failed"
                ? "form-error"
                : `token-copied${isFading ? " is-fading" : ""}`
            }
            role="status"
          >
            {copyStatus === "copied" && "URL copiada."}
            {copyStatus === "failed" &&
              "Não foi possível copiar. Selecione a URL e copie."}
          </p>
        </div>

        <ApiTokenList />
        <ConnectAgentDialog mcpUrl={mcpUrl} />
      </section>
    </>
  )
}
