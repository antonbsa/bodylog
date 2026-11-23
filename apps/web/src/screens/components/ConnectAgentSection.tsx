import { useEffect, useRef, useState } from "react"
import { Check } from "@phosphor-icons/react/dist/csr/Check"
import { Copy } from "@phosphor-icons/react/dist/csr/Copy"

const COPIED_FEEDBACK_MS = 2500
// Keep in agreement with the `.token-copied` opacity transition in settings.css.
const COPIED_FADE_MS = 300

/** Ajustes section with the MCP endpoint URL and how to connect an agent to it with a personal API token. */
export function ConnectAgentSection() {
  const mcpUrl = `${window.location.origin}/mcp`
  const [copyStatus, setCopyStatus] = useState<"copied" | "failed" | null>(null)
  const [isFading, setIsFading] = useState(false)
  const timeout = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timeout.current), [])

  function handleCopy() {
    window.clearTimeout(timeout.current)

    // Can fail (e.g. Safari drops the click's activation), so the button stays.
    Promise.resolve()
      .then(() => navigator.clipboard.writeText(mcpUrl))
      .then(
        () => {
          setCopyStatus("copied")
          setIsFading(false)
          timeout.current = window.setTimeout(() => {
            setIsFading(true)
            // Cleared after the fade so a later copy changes the text and is announced again.
            timeout.current = window.setTimeout(() => {
              setCopyStatus(null)
              setIsFading(false)
            }, COPIED_FADE_MS)
          }, COPIED_FEEDBACK_MS)
        },
        () => {
          setCopyStatus("failed")
          setIsFading(false)
        },
      )
  }

  return (
    <>
      <h2 className="sec-title" id="connect-agent-title">
        Conectar um agente
      </h2>
      <section
        aria-labelledby="connect-agent-title"
        className="card tokens-card"
      >
        <p className="tokens-intro">
          Agentes de IA com este endereço e um token acima leem suas medidas,
          sem alterar nada.
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
            onClick={handleCopy}
            type="button"
          >
            {copyStatus === "copied" && !isFading ? (
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

        <h3 className="connect-step-title">Claude.ai</h3>
        <p className="tokens-note">
          Em Configurações, Conectores, adicione um conector personalizado com
          esta URL e o cabeçalho de requisição{" "}
          <code>Authorization: Bearer &lt;token&gt;</code>, usando um token
          criado acima. Em planos Team e Enterprise, o proprietário define o
          cabeçalho e todos os membros compartilham o mesmo acesso.
        </p>

        <h3 className="connect-step-title">Claude Code</h3>
        <pre className="connect-code">
          {`claude mcp add --transport http bodylog ${mcpUrl} --header "Authorization: Bearer <token>"`}
        </pre>
      </section>
    </>
  )
}
