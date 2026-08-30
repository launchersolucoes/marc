export const platformSubscriptionPlans = ["starter", "pro", "max"];
export const platformSubscriptionStatuses = ["trialing", "active", "past_due", "canceled", "expired"];
export const pilotProgramStatuses = ["preparing", "ready", "testing", "paused", "completed"];
export const pilotCheckStatuses = ["pending", "passed", "failed", "blocked"];
export const pilotIssueStatuses = ["open", "in_progress", "resolved", "wont_fix"];
export const pilotIssuePriorities = ["p1", "p2", "p3"];
export const pilotIssueAreas = ["agenda", "clientes", "servicos", "equipe", "financeiro", "relatorios", "pwa", "acesso", "outro"];
export const privacyRequestStatuses = ["pending", "in_review", "completed", "rejected"];

function uuid(value) {
  return /^[0-9a-f-]{36}$/i.test(String(value || "")) ? String(value) : null;
}

export function normalizeSubscriptionCommand({ establishmentId, planCode, status, accessDays }) {
  const days = Number(accessDays);
  if (!uuid(establishmentId)) return null;
  if (!platformSubscriptionPlans.includes(planCode)) return null;
  if (!platformSubscriptionStatuses.includes(status)) return null;
  if (!Number.isInteger(days) || days < 1 || days > 365) return null;

  return { establishmentId, planCode, status, accessDays: days };
}

export function normalizePilotProgramCommand({ establishmentId, status, round, notes }) {
  const normalizedRound = Number(round);
  if (!uuid(establishmentId) || !pilotProgramStatuses.includes(status)) return null;
  if (!Number.isInteger(normalizedRound) || normalizedRound < 1 || normalizedRound > 3) return null;
  return { establishmentId, status, round: normalizedRound, notes: String(notes || "").trim().slice(0, 1000) };
}

export function normalizePilotCheckCommand({ establishmentId, key, status, note }) {
  if (!uuid(establishmentId) || !/^[a-z0-9_]{2,60}$/.test(String(key || "")) || !pilotCheckStatuses.includes(status)) return null;
  return { establishmentId, key, status, note: String(note || "").trim().slice(0, 500) };
}

export function normalizePilotIssueCommand({ establishmentId, title, area, priority, reproductionSteps }) {
  const normalizedTitle = String(title || "").trim();
  if (!uuid(establishmentId) || normalizedTitle.length < 3 || normalizedTitle.length > 140) return null;
  if (!pilotIssueAreas.includes(area) || !pilotIssuePriorities.includes(priority)) return null;
  return {
    establishmentId,
    title: normalizedTitle,
    area,
    priority,
    reproductionSteps: String(reproductionSteps || "").trim().slice(0, 2000),
  };
}

export function normalizePilotIssueUpdate({ issueId, status, resolutionNotes }) {
  if (!uuid(issueId) || !pilotIssueStatuses.includes(status)) return null;
  return { issueId, status, resolutionNotes: String(resolutionNotes || "").trim().slice(0, 2000) };
}

export function normalizePrivacyRequestCommand({ requestId, status, resolutionNotes }) {
  const notes = String(resolutionNotes || "").trim().slice(0, 1200);
  if (!uuid(requestId) || !privacyRequestStatuses.includes(status)) return null;
  if (["completed", "rejected"].includes(status) && notes.length < 3) return null;
  return { requestId, status, resolutionNotes: notes };
}
