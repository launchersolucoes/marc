import AuthForm from "../../components/auth-form";
import AuthShell from "../../components/auth-shell";

export const metadata = { title: "Entrar — Marc" };

export default async function SignInPage({ searchParams }) {
  const params = await searchParams;

  return (
    <AuthShell mode="signin">
      <AuthForm mode="signin" externalError={params?.erro || ""} />
    </AuthShell>
  );
}
