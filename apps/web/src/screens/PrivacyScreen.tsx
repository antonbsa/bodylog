import { Link } from "react-router"

const CONTACT_EMAIL = "antonbsa.dev@gmail.com"

/** Public page, reachable signed in or not: Google's consent screen links to it. */
export function PrivacyScreen() {
  return (
    <main className="app-shell privacy-shell">
      <article className="privacy-panel" aria-labelledby="privacy-title">
        <p className="eyebrow">BodyLog</p>
        <h1 id="privacy-title">Política de privacidade</h1>
        <p className="intro">Última atualização: 21 de novembro de 2026.</p>

        <p>
          O BodyLog é um projeto pessoal para registrar medidas corporais e
          acompanhar sua evolução semanal. Esta página explica quais dados ele
          guarda, para que e como você pode removê-los.
        </p>

        <h2>Dados que guardamos</h2>
        <ul>
          <li>
            <strong>Da sua conta GitHub ou Google:</strong> nome, e-mail
            verificado e o identificador da conta no provedor. Nenhum outro dado
            dessas contas é acessado.
          </li>
          <li>
            <strong>O que você registra:</strong> peso, percentuais de gordura e
            músculo, metabolismo basal, cintura, horas de sono, disposição e
            notas.
          </li>
          <li>
            <strong>Sessão:</strong> um cookie que mantém você conectado e, por
            alguns minutos durante o login, um cookie temporário do fluxo de
            autorização. Não usamos cookies de publicidade nem de análise.
          </li>
        </ul>

        <h2>Como usamos</h2>
        <p>
          Os dados servem apenas para você entrar e ver o seu histórico. Cada
          conta acessa somente as próprias medidas. Não vendemos, não
          compartilhamos e não usamos seus dados para publicidade, e o app não
          tem rastreadores.
        </p>
        <p>
          Se você entrar com GitHub e com Google usando o mesmo e-mail
          verificado, as duas formas de login abrem a mesma conta.
        </p>

        <h2>Onde ficam</h2>
        <p>
          O app e o banco de dados rodam na Cloudflare. Uma cópia de segurança
          diária, criptografada, fica na Backblaze por até 30 dias.
        </p>

        <h2>Seus controles</h2>
        <ul>
          <li>Você pode editar ou excluir qualquer medida no próprio app.</li>
          <li>Em Ajustes, você pode exportar todas as suas medidas em CSV.</li>
          <li>
            Para excluir sua conta e todos os dados, envie um e-mail para o
            contato abaixo. As cópias de segurança expiram em até 30 dias depois
            da exclusão.
          </li>
        </ul>

        <h2>Contato</h2>
        <p>
          Dúvidas ou pedidos sobre seus dados:{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>

        <p>
          <Link to="/">Voltar ao BodyLog</Link>
        </p>
      </article>
    </main>
  )
}
