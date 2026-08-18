export default function manifest() {
  return {
    name: "Marc — Gestão e agendamento",
    short_name: "Marc",
    description: "Agenda, clientes, equipe, serviços e financeiro no mesmo lugar.",
    id: "/app",
    start_url: "/app",
    scope: "/",
    display: "standalone",
    background_color: "#1A1A1A",
    theme_color: "#1A1A1A",
    lang: "pt-BR",
    categories: ["business", "productivity"],
    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Abrir agenda",
        short_name: "Agenda",
        url: "/app/agenda",
        icons: [{ src: "/icon.png", sizes: "512x512", type: "image/png" }],
      },
      {
        name: "Novo atendimento",
        short_name: "Novo",
        url: "/app/agenda?novo=1",
        icons: [{ src: "/icon.png", sizes: "512x512", type: "image/png" }],
      },
    ],
  };
}
