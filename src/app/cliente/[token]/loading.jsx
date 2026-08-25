export default function CustomerPortalLoading() {
  return (
    <main className="customer-portal-page customer-portal-loading" aria-busy="true" aria-live="polite">
      <div className="customer-portal-loading__header" />
      <div className="customer-portal-loading__body">
        <div className="customer-portal-loading__line customer-portal-loading__line--short" />
        <div className="customer-portal-loading__line customer-portal-loading__line--title" />
        <div className="customer-portal-loading__pass" />
        <span>Buscando seus horários</span>
      </div>
    </main>
  );
}
