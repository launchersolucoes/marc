export default function AppLoading() {
  return (
    <div className="app-content app-native-loading" aria-busy="true" aria-live="polite" aria-label="Carregando conteúdo">
      <div className="app-native-loading__title" aria-hidden="true"><span /><span /></div>
      <div className="app-native-loading__summary" aria-hidden="true"><span /><span /><span /></div>
      <div className="app-native-loading__list" aria-hidden="true">
        <span /><span /><span /><span />
      </div>
    </div>
  );
}
