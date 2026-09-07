import AppShell from "../../components/app-shell";
import LegalReconsentGate from "../../components/legal-reconsent-gate";
import { getAppContext } from "../../lib/app-context";

export default async function AuthenticatedAppLayout({ children }) {
  const { user, membership, legalAcceptanceCurrent } = await getAppContext({
    allowRestricted: true,
    allowLegalPending: true,
  });
  const firstName =
    user.user_metadata?.full_name?.split(" ")[0] ||
    user.email?.split("@")[0] ||
    "M";

  return (
    <AppShell membership={membership} firstName={firstName} legalPending={!legalAcceptanceCurrent}>
      {legalAcceptanceCurrent ? children : <LegalReconsentGate />}
    </AppShell>
  );
}
