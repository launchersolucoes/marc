"use client";

import { Check, Download, Share, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

export default function PwaInstallCard() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    setInstalled(isStandalone());
    setIsIos(
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1),
    );

    const capturePrompt = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    const confirmInstall = () => {
      setInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", capturePrompt);
    window.addEventListener("appinstalled", confirmInstall);
    return () => {
      window.removeEventListener("beforeinstallprompt", capturePrompt);
      window.removeEventListener("appinstalled", confirmInstall);
    };
  }, []);

  const install = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") setInstallPrompt(null);
  };

  return (
    <section className="settings-access pwa-install-card" aria-labelledby="pwa-install-title">
      <div className="settings-profile-mark"><Smartphone size={19} /></div>
      <div>
        <h2 id="pwa-install-title">Marc no seu celular</h2>
        <p>Abra a agenda pela tela inicial, em uma janela própria e com a navegação do aplicativo.</p>
      </div>

      {installed ? (
        <p className="pwa-install-status" role="status"><Check size={17} /> Instalado neste dispositivo</p>
      ) : installPrompt ? (
        <button className="button button--primary" type="button" onClick={install}>
          <Download size={17} /> Instalar Marc
        </button>
      ) : isIos ? (
        <ol className="pwa-install-steps">
          <li><span><Share size={16} /></span><div><strong>Toque em Compartilhar</strong><small>Na barra do Safari.</small></div></li>
          <li><span>+</span><div><strong>Adicionar à Tela de Início</strong><small>Confirme com “Adicionar”.</small></div></li>
        </ol>
      ) : (
        <p className="pwa-install-hint">No celular, abra o menu do navegador e escolha “Instalar aplicativo” ou “Adicionar à tela inicial”.</p>
      )}
    </section>
  );
}
