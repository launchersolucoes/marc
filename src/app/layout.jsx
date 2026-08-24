import "@fontsource-variable/instrument-sans";
import "./globals.css";
import PwaRegistration from "../components/pwa-registration";

export const metadata = {
  metadataBase: new URL("https://usemarc.com.br"),
  applicationName: "Marc",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
  title: "Marc — Sua agenda sempre cheia",
  description:
    "Agendamento online e gestão conectada para barbearias, salões e esmalterias.",
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
    description: "Agendamento online, agenda, equipe e gestão no mesmo lugar.",
    images: ["/og.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Marc",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F8F9FA" },
    { media: "(prefers-color-scheme: dark)", color: "#1A1A1A" },
  ],
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
      <body>
        {children}
        <PwaRegistration />
      </body>
    </html>
  );
}
