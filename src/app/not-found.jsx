import SystemState from "../components/system-state";

export const metadata = { title: "Página não encontrada — Marc" };

export default function NotFound() {
  return (
    <SystemState
      eyebrow="Página não encontrada"
      title="Este endereço não leva a uma página do Marc."
      description="O link pode ter mudado ou sido digitado incorretamente. Volte ao início para continuar."
    />
  );
}
