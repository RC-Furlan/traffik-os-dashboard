export type ChannelId = "meta" | "google" | "tiktok" | "linkedin";
export type Period = "Hoje" | "7D" | "30D" | "Este Mês";

export const PERIOD_DAYS: Record<Period, number> = { Hoje: 1, "7D": 7, "30D": 30, "Este Mês": 28 };

export const CHANNELS: Record<ChannelId, { label: string; spend: number; roas: number; cpa: number; ctr: number; cpm: number; leadRate: number }> = {
  meta: { label: "Meta Ads", spend: 4200, roas: 4.8, cpa: 62, ctr: 1.9, cpm: 28, leadRate: 0.09 },
  google: { label: "Google Ads", spend: 3600, roas: 5.6, cpa: 54, ctr: 4.2, cpm: 45, leadRate: 0.12 },
  tiktok: { label: "TikTok Ads", spend: 1800, roas: 3.1, cpa: 71, ctr: 1.4, cpm: 18, leadRate: 0.06 },
  linkedin: { label: "LinkedIn Ads", spend: 1400, roas: 2.4, cpa: 180, ctr: 0.8, cpm: 92, leadRate: 0.15 },
};

// deterministic noise
export const wave = (i: number, seed: number) => 1 + 0.18 * Math.sin(i * 0.9 + seed) + 0.08 * Math.cos(i * 2.3 + seed * 2);

export function computeMetrics(channels: ChannelId[], days: number) {
  let spend = 0, revenue = 0, conversions = 0, impressions = 0, clicks = 0, leads = 0;
  const series = Array.from({ length: days === 1 ? 24 : days }, (_, i) => ({ label: days === 1 ? `${i}h` : `D${i + 1}`, faturamento: 0, investimento: 0 }));
  const perChannel = channels.map((id, s) => {
    const c = CHANNELS[id];
    let cs = 0, cr = 0;
    series.forEach((pt, i) => {
      const f = days === 1 ? 1 / 24 : 1;
      const sp = c.spend * f * wave(i, s + 1);
      const rv = sp * c.roas * wave(i, s + 4);
      pt.investimento += sp;
      pt.faturamento += rv;
      cs += sp; cr += rv;
    });
    spend += cs; revenue += cr;
    conversions += cs / c.cpa;
    const imp = (cs / c.cpm) * 1000;
    impressions += imp;
    const cl = imp * (c.ctr / 100);
    clicks += cl;
    leads += cl * c.leadRate;
    return { id, label: c.label, roas: cs ? cr / cs : 0 };
  });
  const roas = spend ? revenue / spend : 0;
  const cac = conversions ? spend / conversions : 0;
  const ltv = cac * 3.4;
  const mql = leads * 0.38;
  return {
    spend, revenue, roas, cac, conversions, ltv, ltvCac: cac ? ltv / cac : 0,
    impressions, clicks, leads, mql, cpl: leads ? spend / leads : 0, cpql: mql ? spend / mql : 0,
    pipeline: mql * 2400, series, perChannel,
    ctr: impressions ? (clicks / impressions) * 100 : 0,
  };
}

export type Creative = { id: string; name: string; channel: ChannelId; format: "Video" | "Carousel" | "Search" | "Image"; status: "active" | "fatigued"; spend: number; roas: number; hook: number; hold: number; ctr: number };

export const CREATIVES: Creative[] = [
  { id: "c1", name: "ugc_depoimento_v3.mp4", channel: "meta", format: "Video", status: "active", spend: 820, roas: 5.9, hook: 42, hold: 18, ctr: 2.4 },
  { id: "c2", name: "carrossel_beneficios.png", channel: "meta", format: "Carousel", status: "fatigued", spend: 610, roas: 2.1, hook: 0, hold: 0, ctr: 0.9 },
  { id: "c3", name: "search_marca_exata", channel: "google", format: "Search", status: "active", spend: 940, roas: 7.2, hook: 0, hold: 0, ctr: 6.8 },
  { id: "c4", name: "trend_audio_hook.mp4", channel: "tiktok", format: "Video", status: "active", spend: 480, roas: 3.8, hook: 51, hold: 22, ctr: 1.7 },
  { id: "c5", name: "unboxing_15s.mp4", channel: "tiktok", format: "Video", status: "fatigued", spend: 390, roas: 1.6, hook: 24, hold: 7, ctr: 0.8 },
  { id: "c6", name: "case_b2b_static.jpg", channel: "linkedin", format: "Image", status: "active", spend: 520, roas: 2.7, hook: 0, hold: 0, ctr: 0.9 },
  { id: "c7", name: "demo_produto_30s.mp4", channel: "google", format: "Video", status: "active", spend: 410, roas: 4.1, hook: 36, hold: 15, ctr: 1.2 },
  { id: "c8", name: "oferta_relampago.mp4", channel: "meta", format: "Video", status: "active", spend: 700, roas: 4.6, hook: 38, hold: 14, ctr: 2.1 },
];

export function retentionCurve(c: Creative) {
  const hook = c.hook || 35;
  return Array.from({ length: 28 }, (_, s) => ({
    s: `${s}s`,
    ret: Math.round(s === 0 ? 100 : s <= 3 ? 100 - ((100 - hook) * s) / 3 : hook * Math.exp(-(s - 3) / 14)),
  }));
}

export type IntegrationStatus = "connected" | "pending" | "disconnected";
export type Integration = { id: string; name: string; channel?: ChannelId; status: IntegrationStatus; account: string; lastSync: string };

export const INITIAL_INTEGRATIONS: Integration[] = [
  { id: "meta", name: "Meta Ads Graph API", channel: "meta", status: "connected", account: "act_1029384756", lastSync: "há 2 min" },
  { id: "google", name: "Google Ads & GA4 API", channel: "google", status: "connected", account: "123-456-7890", lastSync: "há 5 min" },
  { id: "tiktok", name: "TikTok Marketing API", channel: "tiktok", status: "connected", account: "7012345678901", lastSync: "há 11 min" },
  { id: "linkedin", name: "LinkedIn Campaign Manager", channel: "linkedin", status: "pending", account: "urn:li:sponsoredAccount:5093", lastSync: "aguardando" },
  { id: "hubspot", name: "HubSpot Webhook CRM", status: "connected", account: "portal_8812", lastSync: "há 1 min" },
  { id: "rd", name: "RD Station API", status: "disconnected", account: "—", lastSync: "nunca" },
];

export const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
export const num = (n: number) => Math.round(n).toLocaleString("pt-BR");

export const BACKEND_CODE = `// server.js — OAuth callback Meta Graph API
import express from "express";
import fetch from "node-fetch";

const app = express();
const { META_APP_ID, META_APP_SECRET, REDIRECT_URI } = process.env;

app.get("/auth/meta", (req, res) => {
  const url = new URL("https://www.facebook.com/v19.0/dialog/oauth");
  url.searchParams.set("client_id", META_APP_ID);
  url.searchParams.set("redirect_uri", REDIRECT_URI);
  url.searchParams.set("scope", "ads_read,ads_management");
  res.redirect(url.toString());
});

app.get("/auth/meta/callback", async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).json({ error: "missing_code" });

  const tokenRes = await fetch(
    \`https://graph.facebook.com/v19.0/oauth/access_token?client_id=\${META_APP_ID}\` +
    \`&redirect_uri=\${REDIRECT_URI}&client_secret=\${META_APP_SECRET}&code=\${code}\`
  );
  const { access_token } = await tokenRes.json();

  const accounts = await fetch(
    \`https://graph.facebook.com/v19.0/me/adaccounts?access_token=\${access_token}\`
  ).then((r) => r.json());

  // await db.integrations.upsert({ provider: "meta", access_token, accounts });
  res.json({ status: "connected", accounts: accounts.data });
});

app.listen(3000, () => console.log("TRAFFIK.OS API on :3000"));`;
