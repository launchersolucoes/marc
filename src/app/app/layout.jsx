import AppShell from "../../components/app-shell";
import { getAppContext } from "../../lib/app-context";

export default async function AuthenticatedAppLayout({ children }) {
  const { user, membership } = await getAppContext({ allowRestricted: true });
  const firstName =
    user.user_metadata?.full_name?.split(" ")[0] ||
    user.email?.split("@")[0] ||
    "M";

  return <AppShell membership={membership} firstName={firstName}>{children}</AppShell>;
}
