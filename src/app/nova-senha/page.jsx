import AuthShell from "../../components/auth-shell";
import PasswordRecoveryForm from "../../components/password-recovery-form";

export const metadata = { title: "Nova senha — Marc" };

export default function NewPasswordPage() {
  return (
    <AuthShell mode="update-password">
      <PasswordRecoveryForm mode="update" />
    </AuthShell>
  );
}
