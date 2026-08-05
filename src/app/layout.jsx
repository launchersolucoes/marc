import "@fontsource-variable/instrument-sans";
import "./globals.css";

export const metadata = {
  metadataBase: new URL("https://usemarc.com.br"),
  title: "Marc — Sua agenda sempre cheia",
  description:
    "Agendamento online, lembretes no WhatsApp e gestão completa para barbearias, salões e esmalterias.",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    title: "Marc — Sua agenda sempre cheia",
    description:
      "Agenda, equipe, clientes e financeiro conectados para seu negócio funcionar com menos trabalho manual.",
    images: ["/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Marc — Sua agenda sempre cheia",
    description: "Agendamento online, WhatsApp e gestão no mesmo lugar.",
    images: ["/og.png"],
  },
};

const themeScript = `
  (function () {
    document.documentElement.dataset.gsapReady = "true";
    window.setTimeout(function () {
      document.documentElement.removeAttribute("data-gsap-ready");
    }, 2500);

    try {
      var stored = localStorage.getItem("marc-theme");
      var system = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
      document.documentElement.dataset.theme = stored || system;
    } catch (_) {
      document.documentElement.dataset.theme = "dark";
    }
  })();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" data-theme="dark" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
