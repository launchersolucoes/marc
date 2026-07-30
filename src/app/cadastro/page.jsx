import AuthForm from "../../components/auth-form";
import AuthShell from "../../components/auth-shell";

export const metadata = { title: "Criar conta — Marc" };

export default async function SignUpPage({ searchParams }) {
  const params = await searchParams;
  return (
    <AuthShell mode="signup">
      <AuthForm mode="signup" nextPath={params?.next || ""} />
    </AuthShell>
  );
}
