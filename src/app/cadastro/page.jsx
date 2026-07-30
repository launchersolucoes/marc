import AuthForm from "../../components/auth-form";
import AuthShell from "../../components/auth-shell";

export const metadata = { title: "Criar conta — Marc" };

export default function SignUpPage() {
  return (
    <AuthShell mode="signup">
      <AuthForm mode="signup" />
    </AuthShell>
  );
}
