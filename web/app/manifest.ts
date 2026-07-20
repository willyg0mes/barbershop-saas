import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BarberShop — Agende seu horário",
    short_name: "BarberShop",
    description: "Agendamento mobile para barbearias",
    start_url: "/",
    display: "standalone",
    background_color: "#121212",
    theme_color: "#121212",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
