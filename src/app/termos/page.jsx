import LegalPage from "../../components/legal-page";

export const metadata = {
  title: "Termos de Uso — Marc",
  description: "Regras para criação de conta, operação e agendamento pelo Marc.",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Termos de Uso"
      summary="As regras essenciais para usar o Marc com segurança, clareza e responsabilidade."
      updatedAt="24 de agosto de 2026"
    >
      <section>
        <h2>1. Sobre o Marc</h2>
        <p>O Marc é uma plataforma operada pela Launcher Soluções para organizar estabelecimentos de beleza e bem-estar, suas equipes, serviços, agendas, clientes e controles operacionais. Ao criar uma conta ou usar uma página de agendamento, você concorda com estes Termos e com a Política de Privacidade.</p>
      </section>

      <section>
        <h2>2. Contas e acesso</h2>
        <ul>
          <li>Informe dados verdadeiros e mantenha-os atualizados.</li>
          <li>Proteja sua senha e não compartilhe acesso individual.</li>
          <li>Avise a Launcher ao suspeitar de uso indevido.</li>
          <li>O dono ou gestor é responsável por atribuir papéis corretos à equipe.</li>
        </ul>
        <p>Ações realizadas por uma sessão autenticada podem ser registradas para segurança e auditoria.</p>
      </section>

      <section>
        <h2>3. Responsabilidade do estabelecimento</h2>
        <p>O estabelecimento é responsável pelos serviços, preços, duração, disponibilidade, atendimento, informações públicas e orientações fornecidas aos clientes. Também deve garantir que sua equipe use os dados apenas para finalidades legítimas relacionadas à operação.</p>
        <p>O Marc não executa o serviço de beleza ou bem-estar e não interfere na relação profissional entre cliente e estabelecimento.</p>
      </section>

      <section>
        <h2>4. Agendamentos</h2>
        <p>O horário é registrado com base na disponibilidade apresentada no momento da confirmação. Cancelamentos, reagendamentos, atrasos, faltas e eventuais valores cobrados pelo atendimento seguem as regras informadas pelo estabelecimento.</p>
        <p>Enquanto o portal de autoatendimento do cliente não estiver disponível, mudanças devem ser solicitadas diretamente ao estabelecimento.</p>
      </section>

      <section>
        <h2>5. Teste, planos e cobrança</h2>
        <p>Novos estabelecimentos recebem 14 dias de teste gratuito. Depois desse período, a continuidade depende de um plano vigente ou de autorização comercial da Launcher. Preços e condições aplicáveis são apresentados antes da contratação.</p>
        <p>O vencimento pode pausar novos agendamentos e o acesso operacional sem apagar imediatamente o histórico. Regras de cancelamento, reembolso e alteração de plano serão informadas no fluxo de contratação.</p>
      </section>

      <section>
        <h2>6. Uso aceitável</h2>
        <p>Não é permitido usar o Marc para:</p>
        <ul>
          <li>violar direitos, leis ou obrigações de privacidade;</li>
          <li>tentar acessar outra conta, estabelecimento ou dado sem autorização;</li>
          <li>enviar conteúdo malicioso, fraudar agendamentos ou sobrecarregar o serviço;</li>
          <li>copiar, desmontar ou explorar a plataforma fora das permissões legais;</li>
          <li>armazenar dados desnecessários ou conteúdo ilícito em campos livres.</li>
        </ul>
      </section>

      <section>
        <h2>7. Disponibilidade e mudanças</h2>
        <p>Trabalhamos para manter o Marc disponível e seguro, mas manutenções, falhas de fornecedores ou eventos fora de controle podem causar interrupções. Funções podem evoluir, desde que direitos adquiridos e obrigações aplicáveis sejam respeitados.</p>
      </section>

      <section>
        <h2>8. Propriedade intelectual</h2>
        <p>A marca Marc, o software, a interface e seus materiais pertencem à Launcher Soluções ou a seus licenciadores. O uso da plataforma concede somente uma autorização limitada, revogável e não transferível durante a vigência do acesso.</p>
      </section>

      <section>
        <h2>9. Suspensão e encerramento</h2>
        <p>O acesso pode ser restringido em caso de violação destes Termos, risco de segurança, fraude, exigência legal ou ausência de assinatura vigente. Sempre que possível, será oferecida orientação para regularização e tratamento dos dados preservados.</p>
      </section>

      <section>
        <h2>10. Contato</h2>
        <p>Dúvidas sobre estes Termos, suporte ou privacidade podem ser enviadas para <a href="mailto:launchersolucoes@gmail.com">launchersolucoes@gmail.com</a>.</p>
      </section>
    </LegalPage>
  );
}
