import { useState } from "react"
import { CaretRight } from "@phosphor-icons/react/dist/csr/CaretRight"
import { Check } from "@phosphor-icons/react/dist/csr/Check"
import { Copy } from "@phosphor-icons/react/dist/csr/Copy"
import { Dialog, Flex } from "@radix-ui/themes"

import { Button } from "../../components/Button"
import { useCopyFeedback } from "../../hooks/useCopyFeedback"

const CLIENTS = [
  { label: "Claude.ai", value: "claude-ai" },
  { label: "Claude Code", value: "claude-code" },
] as const

type Client = (typeof CLIENTS)[number]["value"]

/** "Como conectar" row that opens the per-client steps for adding the MCP server, keeping the long instructions out of Ajustes. */
export function ConnectAgentDialog({ mcpUrl }: { mcpUrl: string }) {
  const [client, setClient] = useState<Client>("claude-ai")
  const { copy, copyStatus, isFading, isJustCopied, reset } = useCopyFeedback()
  const command = `claude mcp add --transport http bodylog ${mcpUrl} --header "Authorization: Bearer <token>"`

  return (
    <Dialog.Root onOpenChange={(open) => !open && reset()}>
      <Dialog.Trigger>
        <button className="set-row connect-open" type="button">
          Como conectar
          <CaretRight
            aria-hidden
            className="import-row-caret"
            size={16}
            weight="bold"
          />
        </button>
      </Dialog.Trigger>
      <Dialog.Content
        aria-describedby={undefined}
        className="connect-dialog"
        maxWidth="420px"
      >
        <Dialog.Title>Como conectar</Dialog.Title>
        <div aria-label="Cliente" className="seg" role="radiogroup">
          {CLIENTS.map((option) => (
            <button
              aria-checked={option.value === client}
              key={option.value}
              onClick={() => setClient(option.value)}
              role="radio"
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>

        {client === "claude-ai" ? (
          <>
            <ol className="connect-steps">
              <li>
                Em Configurações, abra Conectores e adicione um conector
                personalizado.
              </li>
              <li>
                Em URL, use <code>{mcpUrl}</code>.
              </li>
              <li>
                No cabeçalho de requisição, use{" "}
                <code>Authorization: Bearer &lt;token&gt;</code> com um token
                seu.
              </li>
            </ol>
            <p className="connect-note">
              Em planos Team e Enterprise, o proprietário define o cabeçalho e
              todos os membros compartilham o mesmo acesso.
            </p>
          </>
        ) : (
          <>
            <p className="connect-lead">
              Rode no terminal, trocando &lt;token&gt; por um token seu.
            </p>
            <div className="token-value-field">
              <pre className="connect-code">{command}</pre>
              <button
                aria-label="Copiar comando"
                className="token-copy"
                onClick={() => copy(command)}
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
                {copyStatus === "copied" && "Comando copiado."}
                {copyStatus === "failed" &&
                  "Não foi possível copiar. Selecione o comando e copie."}
              </p>
            </div>
          </>
        )}

        <Flex className="dialog-actions" direction="column" mt="4">
          <Dialog.Close>
            <Button fullWidth type="button" variant="secondary">
              Fechar
            </Button>
          </Dialog.Close>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  )
}
