import LegalPage from "../../components/legal-page";

export const metadata = {
  title: "Política de Privacidade — Marc",
  description: "Como o Marc trata dados pessoais na plataforma e no agendamento.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Política de Privacidade"
      summary="Como os dados são usados para manter contas seguras, organizar estabelecimentos e registrar agendamentos."
      updatedAt="24 de agosto de 2026"
    >
      <section>
        <h2>1. Quem participa do tratamento</h2>
        <p>O Marc é um produto digital operado por <strong>58.199.674 Alan de Souza Pires</strong>, CNPJ <strong>58.199.674/0001-47</strong>. Para assuntos de privacidade, o endereço de contato é Rua João Marques Ferreira, 312 — Praça Cruzeiro, Rio Bonito — RJ. No uso da plataforma, a responsabilidade sobre os dados depende do contexto:</p>
        <ul>
          <li><strong>Contas, segurança e assinatura:</strong> o Marc decide como esses dados são usados para disponibilizar e proteger a plataforma.</li>
          <li><strong>Clientes e agendamentos:</strong> o estabelecimento escolhido pelo cliente define a finalidade do atendimento. O Marc fornece a tecnologia e trata os dados para executar essa operação.</li>
        </ul>
        <p>Pedidos relacionados a um atendimento podem exigir a participação do respectivo estabelecimento.</p>
      </section>

      <section>
        <h2>2. Dados tratados</h2>
        <p>Tratamos apenas as informações necessárias para cada função utilizada:</p>
        <ul>
          <li>nome, telefone, e-mail e informações de perfil;</li>
          <li>dados do estabelecimento, equipe, serviços, preços e disponibilidade;</li>
          <li>agendamentos, alterações de estado, lista de espera e observações fornecidas à equipe;</li>
          <li>lançamentos financeiros, comissões e informações de assinatura;</li>
          <li>registros técnicos de autenticação, segurança, falhas e auditoria.</li>
        </ul>
        <p>O Marc não solicita dados sensíveis no agendamento público. Evite inserir informações desnecessárias em campos livres.</p>
      </section>

      <section>
        <h2>3. Para que usamos os dados</h2>
        <ul>
          <li>criar e proteger contas de acesso;</li>
          <li>configurar estabelecimentos, equipe, serviços e permissões;</li>
          <li>consultar horários, registrar e administrar atendimentos;</li>
          <li>manter histórico, lista de espera, caixa, comissões e relatórios;</li>
          <li>prestar suporte, prevenir fraude, investigar falhas e preservar auditoria;</li>
          <li>cumprir obrigações legais e contratuais.</li>
        </ul>
        <p>O tratamento pode se apoiar na execução de contrato ou de procedimentos solicitados pelo titular, no cumprimento de obrigação legal, no exercício regular de direitos e em interesses legítimos relacionados à segurança e melhoria do serviço. Quando o consentimento for necessário, ele será solicitado de forma específica.</p>
      </section>

      <section>
        <h2>4. Compartilhamento e infraestrutura</h2>
        <p>Dados de agendamento ficam disponíveis ao estabelecimento e às pessoas autorizadas conforme seus papéis. Também utilizamos fornecedores de infraestrutura, hospedagem, autenticação, banco de dados e, quando ativados, cobrança e comunicação.</p>
        <p>Esses fornecedores recebem somente o necessário para prestar seus serviços. Alguns podem processar dados fora do Brasil, observando mecanismos contratuais e medidas de segurança aplicáveis. Não vendemos dados pessoais.</p>
      </section>

      <section>
        <h2>5. Retenção e segurança</h2>
        <p>Os dados são mantidos pelo tempo necessário para prestar o serviço, preservar histórico operacional e financeiro, cumprir obrigações ou exercer direitos. Depois disso, podem ser eliminados ou anonimizados quando não existir fundamento para conservação.</p>
        <p>Aplicamos controle de acesso por estabelecimento, permissões por papel, registros de auditoria e proteção de credenciais. Nenhum sistema elimina todos os riscos; por isso, investigamos incidentes e comunicamos os envolvidos quando exigido.</p>
      </section>

      <section>
        <h2>6. Seus direitos</h2>
        <p>Você pode solicitar confirmação de tratamento, acesso, correção, informação sobre compartilhamento, portabilidade quando aplicável, oposição, revisão e eliminação nos casos previstos em lei.</p>
        <p>Envie a solicitação para <a href="mailto:launchersolucoes@gmail.com">launchersolucoes@gmail.com</a>. Para proteger os dados, poderemos confirmar sua identidade e pedir informações suficientes para localizar o relacionamento ou estabelecimento envolvido.</p>
      </section>

      <section>
        <h2>7. Cookies e preferências</h2>
        <p>O Marc utiliza recursos essenciais para manter a sessão autenticada, proteger o acesso e lembrar preferências como o tema visual. Atualmente não usamos cookies publicitários na plataforma.</p>
      </section>

      <section>
        <h2>8. Atualizações</h2>
        <p>Esta política pode mudar para acompanhar novas funções, fornecedores ou exigências legais. Alterações relevantes serão apresentadas por um canal adequado antes de produzirem efeito quando isso for necessário.</p>
      </section>
    </LegalPage>
  );
}
