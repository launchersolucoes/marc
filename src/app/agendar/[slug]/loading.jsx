import Image from "next/image";

export default function BookingLoading() {
  return (
    <main className="route-loading booking-route-loading" aria-busy="true" aria-live="polite">
      <Image src="/assets/marc-logo-cropped.png" alt="Marc" width={208} height={90} priority />
      <div className="route-loading__content">
        <span className="route-loading__pulse" aria-hidden="true" />
        <div>
          <strong>Buscando horários disponíveis</strong>
          <small>Preparando serviços, profissionais e horários reais…</small>
        </div>
      </div>
    </main>
  );
}
