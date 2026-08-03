import Image from "next/image";

export default function AppLoading() {
  return (
    <main className="route-loading app-route-loading" aria-busy="true" aria-live="polite">
      <Image src="/assets/marc-logo-cropped.png" alt="Marc" width={208} height={90} priority />
      <div className="route-loading__content">
        <span className="route-loading__pulse" aria-hidden="true" />
        <div>
          <strong>Organizando sua operação</strong>
          <small>Carregando agenda, equipe e indicadores…</small>
        </div>
      </div>
      <div className="route-loading__skeleton" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </main>
  );
}
