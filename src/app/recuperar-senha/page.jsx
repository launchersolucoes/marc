import AuthShell from "../../components/auth-shell";
import PasswordRecoveryForm from "../../components/password-recovery-form";

export const metadata = { title: "Recuperar senha — Marc" };

export default function RecoverPasswordPage() {
  return (
    <AuthShell mode="recovery">
      <PasswordRecoveryForm mode="request" />
    </AuthShell>
  );
}
