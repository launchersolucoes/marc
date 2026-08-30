import {
  Activity,
  AlertTriangle,
  Building2,
  CalendarClock,
  CheckCircle2,
  CircleDot,
  ClipboardCheck,
  ExternalLink,
  FileKey2,
  FlaskConical,
  LogOut,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { signOut } from "../auth/actions";
import {
  createPilotIssue,
  updateEstablishmentSubscription,
  updatePilotCheckItem,
  updatePilotIssue,
  updatePilotProgram,
  updatePrivacyRequest,
} from "./actions";
import { getPlatformAdminContext } from "../../lib/platform-admin-context";
import { subscriptionPlanLabels, subscriptionStatusLabels } from "../../lib/subscription";
import MasterPrivacySubmit from "../../components/master-privacy-submit";
import { retentionPolicyVersion, retentionRules, retentionStatusLabels } from "../../lib/data-retention";

export const metadata = { title: "Master — Marc" };

function dateLabel(value) {
  if (!value) return "Sem data";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeZone: "America/Sao_Paulo" }).format(new Date(value));
}

function dateTimeLabel(value) {
  if (!value) return "Sem data";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(new Date(value));
}

function accessDate(item) {
  if (item.subscription_status === "trialing") return item.trial_ends_at;
  if (item.subscription_status === "past_due") return item.grace_period_ends_at;
  return item.current_period_ends_at;
}

const pilotStatusLabels = {
  preparing: "Preparação",
  ready: "Pronto para testar",
  testing: "Em teste",
  paused: "Pausado",
  completed: "Concluído",
};

const checkStatusLabels = { pending: "Pendente", passed: "Validado", failed: "Falhou", blocked: "Bloqueado" };
const issueStatusLabels = { open: "Aberto", in_progress: "Em correção", resolved: "Resolvido", wont_fix: "Não será corrigido" };
const issueAreaLabels = { agenda: "Agenda", clientes: "Clientes", servicos: "Serviços", equipe: "Equipe", financeiro: "Financeiro", relatorios: "Relatórios", pwa: "PWA", acesso: "Acesso", outro: "Outro" };
const eventLabels = {
  "appointment.created": "Agendamento criado",
  "appointment.status_changed": "Status de atendimento alterado",
  "appointment.rescheduled": "Atendimento reagendado",
  "waitlist.created": "Entrada na lista de espera",
  "waitlist.status_changed": "Lista de espera atualizada",
  "availability.blocked": "Disponibilidade bloqueada",
};

const privacyStatusLabels = { pending: "Recebida", in_review: "Em análise", completed: "Concluída", rejected: "Recusada" };
const privacyTypeLabels = { access: "Acesso", correction: "Correção", portability: "Portabilidade", deletion: "Exclusão", establishment_closure: "Encerramento" };
const privacySourceLabels = { authenticated_account: "Conta da equipe", customer_portal: "Área do cliente", support: "Suporte" };

function pilotChecklist(counts, stored = {}) {
  const automatic = [
    { key: "owner_access", title: "Conta proprietária", description: "Dono ativo e estabelecimento acessível.", passed: Number(counts.owners || 0) > 0 },
    { key: "role_matrix", title: "Matriz de papéis", description: "Gerência, recepção e profissional ativos no piloto.", passed: Number(counts.managers || 0) > 0 && Number(counts.receptionists || 0) > 0 && Number(counts.professional_members || 0) > 0 },
    { key: "catalog_schedule", title: "Catálogo e disponibilidade", description: "Serviços, ofertas e regras semanais configurados.", passed: Number(counts.services || 0) > 0 && Number(counts.offerings || 0) > 0 && Number(counts.availability_rules || 0) > 0 },
    { key: "appointment_cycle", title: "Ciclo de atendimento", description: "Ao menos um agendamento atravessou a operação real.", passed: Number(counts.appointments || 0) > 0 || Number(counts.appointment_events || 0) > 0 },
    { key: "financial_cycle", title: "Fechamento financeiro", description: "Ao menos um dia de caixa foi conferido e fechado.", passed: Number(counts.financial_closings || 0) > 0 },
  ].map((item) => ({ ...item, automatic: true, status: item.passed ? "passed" : "pending", note: "" }));

  const manual = [
    { key: "public_booking", title: "Agendamento público", description: "Cliente conclui o fluxo e o horário aparece na agenda." },
    { key: "reports_export", title: "Relatório e exportação", description: "Gestão confere o mês, baixa a planilha e salva o PDF." },
    { key: "mobile_pwa", title: "Uso mobile como PWA", description: "Instalação, navegação, sheets e retomada validados no celular." },
  ].map((item) => ({ ...item, automatic: false, status: stored[item.key]?.status || "pending", note: stored[item.key]?.note || "" }));

  return [...automatic, ...manual];
}

export default async function MasterPage({ searchParams }) {
  const params = await searchParams;
  const { supabase, user } = await getPlatformAdminContext();
  const { data, error } = await supabase.rpc("get_platform_admin_overview");
  const establishments = data || [];
  const privacyFilter = ["open", "closed", "all"].includes(params?.direitos) ? params.direitos : "open";
  const requestedPrivacyPage = Number(params?.pagina || 1);
  const privacyPage = Number.isInteger(requestedPrivacyPage) && requestedPrivacyPage > 0 ? requestedPrivacyPage : 1;
  const privacyPageSize = 25;
  const { data: privacyData, error: privacyError } = await supabase.rpc("get_platform_privacy_requests", {
    request_scope: privacyFilter,
    page_limit: privacyPageSize,
    page_offset: (privacyPage - 1) * privacyPageSize,
  });
  const privacyRequests = Array.isArray(privacyData?.items) ? privacyData.items : [];
  const privacyTotal = Number(privacyData?.total || 0);
  const openPrivacyRequests = Number(privacyData?.open_total || 0);
  const privacyPages = Math.max(1, Math.ceil(privacyTotal / privacyPageSize));
  const requestedPilot = typeof params?.piloto === "string" ? params.piloto : "";
  const selectedEstablishment = establishments.find((item) => item.establishment_id === requestedPilot)
    || establishments.find((item) => item.slug.includes("piloto"))
    || establishments[0]
    || null;
  const { data: pilotData, error: pilotError } = selectedEstablishment
    ? await supabase.rpc("get_platform_pilot_dashboard", { target_establishment_id: selectedEstablishment.establishment_id })
    : { data: null, error: null };
  const pilot = pilotData || {};
  const program = pilot.program || { status: "preparing", round: 1, checklist: {}, notes: "" };
  const checklist = pilotChecklist(pilot.counts || {}, program.checklist || {});
  const passedChecks = checklist.filter((item) => item.status === "passed").length;
  const issues = pilot.issues || [];
  const openP1 = issues.filter((item) => item.priority === "p1" && !["resolved", "wont_fix"].includes(item.status)).length;
  const openP2 = issues.filter((item) => item.priority === "p2" && !["resolved", "wont_fix"].includes(item.status)).length;
  const activeSubscriptions = establishments.filter((item) => ["trialing", "active", "past_due"].includes(item.subscription_status)).length;
  const totalProfessionals = establishments.reduce((sum, item) => sum + Number(item.professionals_count || 0), 0);

  return (
    <main className="master-page">
      <header className="master-header">
        <Link href="/master" className="master-brand"><Image src="/assets/marc-logo-cropped.png" alt="Marc" width={208} height={90} priority /><span>Master</span></Link>
        <div>
          <Link href="/" target="_blank">Ver site <ExternalLink size={15} /></Link>
          <span>{user.email}</span>
          <form action={signOut}><button type="submit"><LogOut size={17} /> Sair</button></form>
        </div>
      </header>

      <section className="master-content">
        <div className="master-heading">
          <div><span>Launcher · administração global</span><h1>Visão da plataforma</h1><p>Acompanhe estabelecimentos e libere acessos enquanto a cobrança automática não está conectada.</p></div>
          <div className="master-security"><ShieldCheck size={19} /><span><strong>Acesso restrito</strong><small>Somente administradores da Launcher</small></span></div>
        </div>

        {params?.atualizado && <p className="master-message master-message--success">Assinatura atualizada e registrada no histórico.</p>}
        {(params?.pilotoAtualizado || params?.checklistAtualizado || params?.problemaCriado || params?.problemaAtualizado) && <p className="master-message master-message--success">Operação do piloto atualizada.</p>}
        {params?.privacidadeAtualizada && <p className="master-message master-message--success">Solicitação de privacidade atualizada e registrada no histórico.</p>}
        {params?.erro && <p className="master-message master-message--error">{params.erro}</p>}
        {error && <p className="master-message master-message--error">Não foi possível carregar os dados globais.</p>}

        <div className="master-stats">
          <article><Building2 size={20} /><span>Estabelecimentos</span><strong>{establishments.length}</strong></article>
          <article><CalendarClock size={20} /><span>Acessos vigentes</span><strong>{activeSubscriptions}</strong></article>
          <article><UsersRound size={20} /><span>Profissionais</span><strong>{totalProfessionals}</strong></article>
          <article><FileKey2 size={20} /><span>Pedidos de dados abertos</span><strong>{openPrivacyRequests}</strong></article>
        </div>

        <section className="master-privacy" aria-labelledby="privacy-operations-title">
          <div className="master-privacy__heading">
            <div className="master-pilot__title"><FileKey2 size={22} /><div><h2 id="privacy-operations-title">Direitos de dados</h2><p>Fila restrita da Launcher para acompanhar solicitações, decisões e evidências.</p></div></div>
            <nav aria-label="Filtrar solicitações de privacidade">
              <Link className={privacyFilter === "open" ? "is-active" : ""} aria-current={privacyFilter === "open" ? "page" : undefined} href="/master?direitos=open">Abertas <span>{openPrivacyRequests}</span></Link>
              <Link className={privacyFilter === "closed" ? "is-active" : ""} aria-current={privacyFilter === "closed" ? "page" : undefined} href="/master?direitos=closed">Encerradas</Link>
              <Link className={privacyFilter === "all" ? "is-active" : ""} aria-current={privacyFilter === "all" ? "page" : undefined} href="/master?direitos=all">Todas</Link>
            </nav>
          </div>

          {privacyError ? (
            <p className="master-message master-message--error">A fila de privacidade ainda não está disponível neste ambiente.</p>
          ) : privacyRequests.length ? (
            <div className="master-privacy-list">
              {privacyRequests.map((request) => (
                <article key={request.id}>
                  <div className="master-privacy-request">
                    <span className={`privacy-state is-${request.status}`}><CircleDot size={13} />{privacyStatusLabels[request.status] || request.status}</span>
                    <div>
                      <strong>{privacyTypeLabels[request.request_type] || request.request_type} · {request.subject_name}</strong>
                      <small>{request.establishment_name} · {privacySourceLabels[request.source] || request.source} · {dateLabel(request.requested_at)}</small>
                      {request.subject_contact && <span>{request.subject_contact}</span>}
                    </div>
                  </div>
                  <div className="master-privacy-context">
                    <span>Contexto informado</span>
                    <p>{request.details || "Nenhum contexto adicional foi enviado."}</p>
                    {request.resolution_notes && <small><strong>Última decisão:</strong> {request.resolution_notes}</small>}
                  </div>
                  <form action={updatePrivacyRequest} className="master-privacy-command">
                    <input type="hidden" name="requestId" value={request.id} />
                    <input type="hidden" name="filter" value={privacyFilter} />
                    <label>Estado<select name="status" defaultValue={request.status}><option value="pending">Recebida</option><option value="in_review">Em análise</option><option value="completed">Concluída</option><option value="rejected">Recusada</option></select></label>
                    <label>Registro da análise<input name="resolutionNotes" defaultValue={request.resolution_notes || ""} maxLength={1200} placeholder="Obrigatório para concluir ou recusar" /></label>
                    <MasterPrivacySubmit />
                  </form>
                  {!!request.history?.length && <details className="master-privacy-history">
                    <summary>Histórico da solicitação <span>{request.history.length}</span></summary>
                    <ol>{request.history.map((event) => <li key={event.id}><span className={`privacy-state is-${event.next_status}`}>{privacyStatusLabels[event.next_status] || event.next_status}</span><div><strong>{privacyStatusLabels[event.previous_status] || event.previous_status} → {privacyStatusLabels[event.next_status] || event.next_status}</strong><small>{event.actor_name} · {dateTimeLabel(event.created_at)}</small>{event.notes && <p>{event.notes}</p>}</div></li>)}</ol>
                  </details>}
                </article>
              ))}
              {privacyPages > 1 && <nav className="master-privacy-pages" aria-label="Paginação das solicitações">
                {privacyPage > 1 ? <Link href={`/master?direitos=${privacyFilter}&pagina=${privacyPage - 1}`}>Anterior</Link> : <span />}
                <small>Página {privacyPage} de {privacyPages}</small>
                {privacyPage < privacyPages ? <Link href={`/master?direitos=${privacyFilter}&pagina=${privacyPage + 1}`}>Próxima</Link> : <span />}
              </nav>}
            </div>
          ) : (
            <div className="master-privacy-empty"><CheckCircle2 size={22} /><strong>{privacyFilter === "open" ? "Nenhuma solicitação aberta" : "Nenhuma solicitação nesta visão"}</strong><span>A fila será atualizada quando equipe ou clientes exercerem seus direitos pelo Marc.</span></div>
          )}
        </section>

        <section className="master-retention" aria-labelledby="retention-protocol-title">
          <div className="master-retention__heading">
            <div className="master-pilot__title"><ShieldCheck size={22} /><div><h2 id="retention-protocol-title">Protocolo de retenção</h2><p>Matriz operacional para orientar decisões enquanto os prazos passam por validação jurídica e contábil.</p></div></div>
            <span>Versão operacional {retentionPolicyVersion}</span>
          </div>
          <div className="master-retention__notice">
            <AlertTriangle size={18} />
            <p><strong>Nenhum descarte é automático.</strong> A conclusão de um pedido continua exigindo análise, registro da decisão e verificação de obrigação ou bloqueio jurídico.</p>
          </div>
          <div className="master-retention-list">
            {retentionRules.map((rule) => (
              <article key={rule.key}>
                <div><strong>{rule.category}</strong><span>{retentionStatusLabels[rule.status]}</span></div>
                <p>{rule.summary}</p>
                <strong>{rule.period}</strong>
                <small>{rule.disposition}</small>
              </article>
            ))}
          </div>
          <footer>
            <p>Bloqueios por obrigação, disputa ou incidente devem ter motivo, responsável e data de revisão.</p>
            <Link href="/privacidade" target="_blank">Ler política pública <ExternalLink size={14} /></Link>
          </footer>
        </section>

        {selectedEstablishment && (
          <section className="master-pilot" aria-labelledby="pilot-title">
            <div className="master-pilot__heading">
              <div>
                <div className="master-pilot__title"><FlaskConical size={22} /><h2 id="pilot-title">Piloto assistido</h2></div>
                <p>Prontidão técnica, validações humanas e problemas em um único lugar, sem dados de clientes nos registros.</p>
              </div>
              <form className="master-pilot-picker">
                <label htmlFor="pilotEstablishment">Estabelecimento</label>
                <select id="pilotEstablishment" name="piloto" defaultValue={selectedEstablishment.establishment_id}>
                  {establishments.map((item) => <option key={item.establishment_id} value={item.establishment_id}>{item.establishment_name}</option>)}
                </select>
                <button className="button button--secondary" type="submit">Abrir piloto</button>
              </form>
            </div>

            {pilotError ? <p className="master-message master-message--error">A estrutura do piloto ainda não está disponível neste ambiente.</p> : (
              <>
                <div className="master-pilot__pulse">
                  <div><span className={`pilot-state is-${program.status}`}><CircleDot size={13} />{pilotStatusLabels[program.status] || "Preparação"}</span><strong>{selectedEstablishment.establishment_name}</strong><small>Rodada {program.round} de 3</small></div>
                  <dl>
                    <div><dt>Prontidão</dt><dd>{passedChecks}/{checklist.length}</dd></div>
                    <div><dt>P1 abertos</dt><dd className={openP1 ? "is-danger" : ""}>{openP1}</dd></div>
                    <div><dt>P2 abertos</dt><dd className={openP2 ? "is-warning" : ""}>{openP2}</dd></div>
                  </dl>
                </div>

                <form action={updatePilotProgram} className="master-pilot-command">
                  <input type="hidden" name="establishmentId" value={selectedEstablishment.establishment_id} />
                  <label>Estado<select name="status" defaultValue={program.status}><option value="preparing">Preparação</option><option value="ready">Pronto para testar</option><option value="testing">Em teste</option><option value="paused">Pausado</option><option value="completed">Concluído</option></select></label>
                  <label>Rodada<select name="round" defaultValue={program.round}><option value="1">1 · fluxo feliz</option><option value="2">2 · erros e permissões</option><option value="3">3 · uso diário no celular</option></select></label>
                  <label className="is-wide">Nota de coordenação<input name="notes" defaultValue={program.notes || ""} maxLength={1000} placeholder="Próxima sessão, bloqueio ou decisão do piloto" /></label>
                  <button className="button button--primary" type="submit">Salvar operação</button>
                </form>

                <div className="master-pilot-grid">
                  <section className="pilot-checklist">
                    <div className="pilot-section-heading"><div><h3>Checklist de prontidão</h3><p>Itens técnicos são calculados; experiências reais são confirmadas pela equipe.</p></div><ClipboardCheck size={19} /></div>
                    <div className="pilot-checklist-list">
                      {checklist.map((item) => (
                        <article key={item.key}>
                          <span className={`pilot-check is-${item.status}`}>{item.status === "passed" ? <CheckCircle2 size={17} /> : item.status === "failed" ? <AlertTriangle size={17} /> : <CircleDot size={17} />}</span>
                          <div><strong>{item.title}</strong><p>{item.description}</p>{item.note && <small>{item.note}</small>}</div>
                          {item.automatic ? <em>{checkStatusLabels[item.status]}</em> : (
                            <form action={updatePilotCheckItem}>
                              <input type="hidden" name="establishmentId" value={selectedEstablishment.establishment_id} />
                              <input type="hidden" name="key" value={item.key} />
                              <select name="status" defaultValue={item.status} aria-label={`Estado de ${item.title}`}><option value="pending">Pendente</option><option value="passed">Validado</option><option value="failed">Falhou</option><option value="blocked">Bloqueado</option></select>
                              <input name="note" defaultValue={item.note} maxLength={500} aria-label={`Nota de ${item.title}`} placeholder="Evidência ou bloqueio" />
                              <button type="submit">Salvar</button>
                            </form>
                          )}
                        </article>
                      ))}
                    </div>
                  </section>

                  <aside className="pilot-activity">
                    <div className="pilot-section-heading"><div><h3>Atividade recente</h3><p>Sinais operacionais sem nomes, contatos ou conteúdo de clientes.</p></div><Activity size={19} /></div>
                    {(pilot.events || []).length ? <ol>{pilot.events.map((event, index) => <li key={`${event.created_at}-${index}`}><span /><div><strong>{eventLabels[event.event_name] || event.event_name}</strong><small>{dateLabel(event.created_at)}</small></div></li>)}</ol> : <div className="pilot-activity-empty"><Activity size={20} /><span>A atividade aparecerá após o primeiro fluxo do piloto.</span></div>}
                  </aside>
                </div>

                <section className="pilot-issues">
                  <div className="pilot-section-heading"><div><h3>Problemas do piloto</h3><p>P1 bloqueia a rodada; P2 entra antes da próxima; P3 segue para o backlog.</p></div><span>{issues.filter((item) => !["resolved", "wont_fix"].includes(item.status)).length} abertos</span></div>
                  <form action={createPilotIssue} className="pilot-issue-create">
                    <input type="hidden" name="establishmentId" value={selectedEstablishment.establishment_id} />
                    <label className="is-wide">Problema<input name="title" minLength={3} maxLength={140} placeholder="Descreva o que impediu ou prejudicou o fluxo" required /></label>
                    <label>Área<select name="area" defaultValue="agenda"><option value="agenda">Agenda</option><option value="clientes">Clientes</option><option value="servicos">Serviços</option><option value="equipe">Equipe</option><option value="financeiro">Financeiro</option><option value="relatorios">Relatórios</option><option value="pwa">PWA</option><option value="acesso">Acesso</option><option value="outro">Outro</option></select></label>
                    <label>Prioridade<select name="priority" defaultValue="p2"><option value="p1">P1 · bloqueia</option><option value="p2">P2 · corrigir antes da próxima</option><option value="p3">P3 · melhoria</option></select></label>
                    <label className="is-wide">Como reproduzir<textarea name="reproductionSteps" rows={2} maxLength={2000} placeholder="Tela, ação realizada, resultado e dispositivo" /></label>
                    <button className="button button--primary" type="submit">Registrar problema</button>
                  </form>

                  {issues.length ? <div className="pilot-issue-list">{issues.map((issue) => (
                    <article key={issue.id}>
                      <div className="pilot-issue-summary"><span className={`is-${issue.priority}`}>{issue.priority.toUpperCase()}</span><div><strong>{issue.title}</strong><small>{issueAreaLabels[issue.area] || issue.area} · {issueStatusLabels[issue.status] || issue.status} · {dateLabel(issue.created_at)}</small></div></div>
                      {issue.reproduction_steps && <p>{issue.reproduction_steps}</p>}
                      <form action={updatePilotIssue}>
                        <input type="hidden" name="establishmentId" value={selectedEstablishment.establishment_id} />
                        <input type="hidden" name="issueId" value={issue.id} />
                        <select name="status" defaultValue={issue.status} aria-label={`Estado de ${issue.title}`}><option value="open">Aberto</option><option value="in_progress">Em correção</option><option value="resolved">Resolvido</option><option value="wont_fix">Não será corrigido</option></select>
                        <input name="resolutionNotes" defaultValue={issue.resolution_notes || ""} maxLength={2000} aria-label={`Resolução de ${issue.title}`} placeholder="Decisão ou correção aplicada" />
                        <button type="submit">Atualizar</button>
                      </form>
                    </article>
                  ))}</div> : <div className="pilot-issues-empty"><CheckCircle2 size={22} /><strong>Nenhum problema registrado.</strong><span>Use o formulário acima durante as rodadas de teste.</span></div>}
                </section>
              </>
            )}
          </section>
        )}

        <section className="master-panel">
          <div className="master-panel__heading"><div><span>Operação comercial</span><h2>Estabelecimentos</h2></div><small>{establishments.length} cadastrados</small></div>

          {establishments.length === 0 ? (
            <div className="master-empty"><Sparkles size={24} /><h3>Nenhum estabelecimento ainda</h3><p>Os primeiros cadastros aparecerão aqui automaticamente com 14 dias de teste.</p></div>
          ) : (
            <div className="master-establishments">
              {establishments.map((item) => (
                <article key={item.establishment_id}>
                  <div className="master-establishment__identity">
                    <span>{item.establishment_name.slice(0, 1).toUpperCase()}</span>
                    <div><strong>{item.establishment_name}</strong><small>/{item.slug} · criado em {dateLabel(item.created_at)}</small></div>
                  </div>
                  <div className="master-establishment__metrics">
                    <span><strong>{item.members_count}</strong> membros</span>
                    <span><strong>{item.professionals_count}</strong> profissionais</span>
                    <span><strong>{item.appointments_count}</strong> agendamentos</span>
                  </div>
                  <div className="master-establishment__status">
                    <strong>{subscriptionStatusLabels[item.subscription_status] || "Não configurada"}</strong>
                    <span>{subscriptionPlanLabels[item.plan_code] || "Starter"} · acesso até {dateLabel(accessDate(item))}</span>
                  </div>
                  <form action={updateEstablishmentSubscription} className="master-subscription-form">
                    <input type="hidden" name="establishmentId" value={item.establishment_id} />
                    <label>Plano<select name="planCode" defaultValue={item.plan_code || "starter"}><option value="starter">Starter</option><option value="pro">Pro</option><option value="max">Max</option></select></label>
                    <label>Status<select name="status" defaultValue={item.subscription_status || "trialing"}><option value="trialing">Teste</option><option value="active">Ativa</option><option value="past_due">Pendente</option><option value="canceled">Cancelada</option><option value="expired">Encerrada</option></select></label>
                    <label>Dias<input name="accessDays" type="number" min="1" max="365" defaultValue="30" required /></label>
                    <button className="button button--primary" type="submit">Atualizar acesso</button>
                  </form>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
