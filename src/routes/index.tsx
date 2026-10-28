import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "@/components/traffik/Dashboard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TRAFFIK.OS — Dashboard de Performance de Tráfego Pago" },
      { name: "description", content: "ROAS, CAC, criativos, funil de leads e integrações de Meta, Google, TikTok e LinkedIn Ads em um só painel." },
      { property: "og:title", content: "TRAFFIK.OS — Dashboard de Performance" },
      { property: "og:description", content: "Painel neo-brutalista de mídia performance: ROAS, criativos, funil e APIs." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});
