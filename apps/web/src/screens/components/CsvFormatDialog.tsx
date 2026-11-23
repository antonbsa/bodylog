import { Dialog, Flex } from "@radix-ui/themes"
import { Info } from "@phosphor-icons/react/dist/csr/Info"

import { Button } from "../../components/Button"

/** Info button beside "Importar CSV" that explains the accepted file format. */
export function CsvFormatDialog() {
  return (
    <Dialog.Root>
      <Dialog.Trigger>
        <button aria-label="Formato do CSV" className="set-info" type="button">
          <Info aria-hidden size={22} />
        </button>
      </Dialog.Trigger>
      <Dialog.Content
        aria-describedby={undefined}
        className="csv-format"
        maxWidth="420px"
      >
        <Dialog.Title>Formato do CSV</Dialog.Title>
        <p>
          Colunas obrigatórias: <strong>Data</strong> e <strong>Peso</strong>.
          Datas em DD/MM/AAAA ou AAAA-MM-DD.
        </p>
        <p>
          Colunas reconhecidas pelo nome do cabeçalho: Data, Peso, Gordura,
          Músculo, Metabolismo basal, Cintura, Sono, Disposição e Notas. Os
          nomes do arquivo exportado pelo app também funcionam.
        </p>
        <p>
          Números com ponto ou vírgula decimal, sem unidades (72,5 e não 72,5
          kg). O ponto de milhar só vale no metabolismo basal (1.696). O
          separador pode ser vírgula ou ponto e vírgula.
        </p>
        <p>
          Colunas desconhecidas, como IMC, são ignoradas. Colunas ausentes e
          células vazias mantêm o valor já salvo.
        </p>
        <p>Antes de gravar, o app mostra uma prévia para você confirmar.</p>
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
