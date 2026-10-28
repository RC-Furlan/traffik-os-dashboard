import { useEffect, useMemo, useState } from "react";
import { LayoutDashboard, Sparkles, Filter, Plug, Radio, FileDown, Loader2, Code2, Terminal, AlertTriangle, Menu } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, ComposedChart } from "recharts";
import { cn } from "@/lib/utils";
import { Btn, Metric, Modal, Panel, tooltipStyle } from "./ui";
import {
  BACKEND_CODE, CHANNELS, CREATIVES, INITIAL_INTEGRATIONS, PERIOD_DAYS, brl, computeMetrics, num, retentionCurve,
  type ChannelId, type Creative, type Integration, type Period,
} from "@/lib/traffik-data";

type Tab = "overview" | "creative" | "funnel" | "integrations";
const TABS: { id: Tab; label: string; icon: typeof Plug }[] = [
  { id: "overview", label: "Executive Overview", icon: LayoutDashboard },
  { id: "creative", label: "Creative Intelligence", icon: Sparkles },
  { id: "funnel", label: "Lead & CRM Funnel", icon: Filter },
  { id: "integrations", label: "Integrations & APIs", icon: Plug },
];
const ALL_CH = Object.keys(CHANNELS) as ChannelId[];

export function Dashboard() {
  const [tab, setTab] = useState<Tab>("overview");
  const [period, setPeriod] = useState<Period>("30D");
  const [channel, setChannel] = useState<"all" | ChannelId>("all");
  const [integrations, setIntegrations] = useState<Integration[]>(INITIAL_INTEGRATIONS);
  const [webhookOpen, setWebhookOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  const connected = useMemo(() => ALL_CH.filter((c) => integrations.find((i) => i.channel === c)?.status === "connected"), [integrations]);
  useEffect(() => { if (channel !== "all" && !connected.includes(channel)) setChannel("all"); }, [connected, channel]);

  const active = channel === "all" ? connected : [channel];
  const days = PERIOD_DAYS[period];
  const m = useMemo(() => computeMetrics(active, days), [active.join(), days]);
  const prev = useMemo(() => computeMetrics(active, days), [active.join(), days]);
  const delta = (seed: number) => (active.length ? ((Math.sin(days + seed + active.length) * 14) + 6) : 0);
  void prev;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 flex flex-wrap items-center gap-3 border-b-2 border-border bg-background px-4 py-3">
        <button className="lg:hidden" onClick={() => setNavOpen(!navOpen)} aria-label="Menu"><Menu /></button>
        <div className="border-2 border-primary-foreground bg-primary px-3 py-1 font-mono text-sm font-extrabold text-primary-foreground brutal-dark">TRAFFIK.OS</div>
        <div className="hidden items-center gap-2 border-2 border-border px-3 py-1 font-mono text-[11px] sm:flex">
          <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-primary" /></span>
          Live Accounts Connected
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="flex border-2 border-border">
            {(Object.keys(PERIOD_DAYS) as Period[]).map((p) => (
              <button key={p} onClick={() => setPeriod(p)} className={cn("px-2.5 py-1 font-mono text-[11px] font-bold", period === p ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>{p}</button>
            ))}
          </div>
          <Btn onClick={() => setWebhookOpen(true)}><Radio size={14} /> Webhook Tester</Btn>
          <Btn variant="lime" onClick={() => window.print()}><FileDown size={14} /> Exportar PDF</Btn>
        </div>
      </header>

      <div className="flex">
        <aside className={cn("fixed inset-y-0 left-0 z-30 mt-[62px] w-64 flex-col border-r-2 border-border bg-background p-4 lg:sticky lg:top-[62px] lg:mt-0 lg:flex lg:h-[calc(100vh-62px)]", navOpen ? "flex" : "hidden")}>
          <div className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">// navegação</div>
          <nav className="flex flex-col gap-2">
            {TABS.map((t) => (
              <button key={t.id} onClick={() => { setTab(t.id); setNavOpen(false); }}
                className={cn("flex items-center gap-3 border-2 px-3 py-2.5 text-left text-sm font-semibold brutal-press", tab === t.id ? "border-primary bg-primary text-primary-foreground brutal-dark" : "border-border text-foreground hover:border-primary")}>
                <t.icon size={16} /> {t.label}
              </button>
            ))}
          </nav>
          <div className="mt-auto pt-6">
            <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">canais ativos</div>
            <div className="flex flex-wrap gap-1.5">
              {ALL_CH.map((c) => (
                <span key={c} className={cn("border px-2 py-0.5 font-mono text-[10px]", connected.includes(c) ? "border-primary text-primary" : "border-border text-muted-foreground line-through")}>{c}</span>
              ))}
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 space-y-6 p-4 md:p-6">
          <div className="flex items-baseline justify-between gap-4">
            <h1 className="text-2xl font-bold md:text-3xl">{TABS.find((t) => t.id === tab)!.label}</h1>
            <span className="font-mono text-[11px] text-muted-foreground">período: {period}</span>
          </div>

          {(tab === "overview" || tab === "creative") && (
            <div className="flex flex-wrap gap-2">
              <Btn variant={channel === "all" ? "active" : "ghost"} onClick={() => setChannel("all")}>Todos</Btn>
              {ALL_CH.map((c) => (
                <Btn key={c} disabled={!connected.includes(c)} variant={channel === c ? "active" : "ghost"} onClick={() => setChannel(c)}>{CHANNELS[c].label}</Btn>
              ))}
            </div>
          )}

          {active.length === 0 && tab !== "integrations" ? (
            <Panel className="font-mono text-sm text-muted-foreground">Nenhum canal conectado. Conecte uma conta em Integrations & APIs.</Panel>
          ) : (
            <>
              {tab === "overview" && <Overview m={m} delta={delta} />}
              {tab === "creative" && <CreativeTab channels={active} />}
              {tab === "funnel" && <Funnel m={m} />}
            </>
          )}
          {tab === "integrations" && <Integrations items={integrations} setItems={setIntegrations} />}
        </main>
      </div>

      <WebhookModal open={webhookOpen} onClose={() => setWebhookOpen(false)} />
    </div>
  );
}

type M = ReturnType<typeof computeMetrics>;

function Overview({ m, delta }: { m: M; delta: (s: number) => number }) {
  const best = [...m.perChannel].sort((a, b) => b.roas - a.roas)[0];
  const worst = [...m.perChannel].sort((a, b) => a.roas - b.roas)[0];
  const maxRoas = Math.max(...m.perChannel.map((c) => c.roas), 1);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Metric label="Investimento Total" value={brl(m.spend)} delta={delta(1)} sub="vs anterior" />
        <Metric label="Faturamento Gerado" value={brl(m.revenue)} delta={delta(2)} sub="vs anterior" />
        <Metric highlight label="ROAS Geral" value={`${m.roas.toFixed(1)}x`} delta={delta(3)} />
        <Metric label="CAC" value={brl(m.cac)} sub={`${num(m.conversions)} vendas`} />
        <Metric label="LTV Estimado" value={brl(m.ltv)} sub={`LTV/CAC ${m.ltvCac.toFixed(1)}x`} />
      </div>
      <Panel>
        <div className="mb-3 flex items-center justify-between font-mono text-xs uppercase">
          <span>Faturamento × Investimento</span>
          <span className="flex gap-4 text-muted-foreground"><span className="text-primary">■ faturamento</span><span>┅ investimento</span></span>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={m.series}>
              <defs><linearGradient id="fat" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} /><stop offset="100%" stopColor="var(--primary)" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" />
              <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={10} fontFamily="var(--font-mono)" />
              <YAxis stroke="var(--muted-foreground)" fontSize={10} fontFamily="var(--font-mono)" tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => brl(v)} />
              <Area type="monotone" dataKey="faturamento" stroke="var(--primary)" strokeWidth={2.5} fill="url(#fat)" />
              <Line type="monotone" dataKey="investimento" stroke="var(--soft)" strokeDasharray="6 4" strokeWidth={1.5} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Panel>
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <div className="mb-4 font-mono text-xs uppercase">Eficiência por Canal (ROAS)</div>
          <div className="space-y-4">
            {m.perChannel.map((c) => (
              <div key={c.id}>
                <div className="mb-1 flex justify-between font-mono text-xs"><span>{c.label}</span><span className="font-bold text-primary">{c.roas.toFixed(1)}x</span></div>
                <div className="h-4 border-2 border-border"><div className="h-full bg-primary transition-all" style={{ width: `${(c.roas / maxRoas) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel className="font-mono">
          <div className="mb-3 flex items-center gap-2 text-xs uppercase text-primary"><Terminal size={14} /> algoritmo_insight.log</div>
          <div className="space-y-1.5 text-xs leading-relaxed">
            <p className="text-muted-foreground">$ traffik analyze --period current</p>
            <p>&gt; Melhor canal: <span className="text-primary">{best?.label}</span> ({best?.roas.toFixed(1)}x)</p>
            {worst && worst !== best && <p>&gt; Pior canal: <span className="text-destructive">{worst.label}</span> ({worst.roas.toFixed(1)}x)</p>}
            <p>&gt; Recomendação: realocar <span className="text-primary">15%</span> do budget de {worst?.label} para {best?.label}.</p>
            <p>&gt; Impacto projetado: <span className="text-primary">+{brl(m.spend * 0.15 * ((best?.roas ?? 0) - (worst?.roas ?? 0)))}</span> em faturamento.</p>
            <p className="animate-pulse text-primary">█</p>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function CreativeTab({ channels }: { channels: ChannelId[] }) {
  const [sel, setSel] = useState<Creative | null>(null);
  const list = CREATIVES.filter((c) => channels.includes(c.channel));
  const vids = list.filter((c) => c.hook > 0);
  const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Metric label="CTR Médio" value={`${avg(list.map((c) => c.ctr)).toFixed(2)}%`} />
        <Metric label="Hook Rate (3s)" value={`${avg(vids.map((c) => c.hook)).toFixed(1)}%`} />
        <Metric label="Hold Rate (15s)" value={`${avg(vids.map((c) => c.hold)).toFixed(1)}%`} />
        <Metric warn label="Anúncios em Fadiga" value={`${list.filter((c) => c.status === "fatigued").length}`} sub="trocar criativo" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {list.map((c) => (
          <Panel key={c.id} className={cn(c.status === "fatigued" && "border-warning")}>
            <div className="flex items-start gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center border-2 border-border bg-background font-mono text-[10px] text-primary">{c.format.slice(0, 3).toUpperCase()}</div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-mono text-sm font-bold">{c.name}</div>
                <div className="font-mono text-[10px] text-muted-foreground">{CHANNELS[c.channel].label} · {c.format}</div>
                <span className={cn("mt-1 inline-flex items-center gap-1 border px-1.5 font-mono text-[10px]", c.status === "active" ? "border-primary text-primary" : "border-warning text-warning")}>
                  {c.status === "fatigued" && <AlertTriangle size={10} />}{c.status}
                </span>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-4 gap-2 font-mono text-[10px] text-muted-foreground">
              {[["Invest.", brl(c.spend)], ["ROAS", `${c.roas}x`], ["Hook", c.hook ? `${c.hook}%` : "—"], ["CTR", `${c.ctr}%`]].map(([k, v]) => (
                <div key={k}>{k}<div className="text-sm font-bold text-foreground">{v}</div></div>
              ))}
            </div>
            <Btn className="mt-4 w-full justify-center" onClick={() => setSel(c)}>Analisar Retenção</Btn>
          </Panel>
        ))}
      </div>
      <Modal open={!!sel} onClose={() => setSel(null)} title={sel?.name ?? ""} wide>
        {sel && (
          <>
            <div className="mb-4 grid grid-cols-3 gap-3">
              <Metric label="Hook Rate" value={`${sel.hook || 35}%`} />
              <Metric label="Hold Rate" value={`${sel.hold || 12}%`} />
              <Metric highlight label="ROAS" value={`${sel.roas}x`} />
            </div>
            <div className="mb-2 font-mono text-xs uppercase text-muted-foreground">Curva de retenção · segundo a segundo</div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={retentionCurve(sel)}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" />
                  <XAxis dataKey="s" stroke="var(--muted-foreground)" fontSize={10} interval={2} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={10} unit="%" />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--accent)" }} />
                  <Bar dataKey="ret" fill="var(--primary)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}

function Funnel({ m }: { m: M }) {
  const steps = [
    { label: "Impressões de Anúncios", value: num(m.impressions), meta: "100%" },
    { label: "Cliques no Site", value: num(m.clicks), meta: `CTR ${m.ctr.toFixed(2)}%` },
    { label: "Leads Formulário", value: num(m.leads), meta: `CPL ${brl(m.cpl)}` },
    { label: "MQL / Reunião Agendada", value: num(m.mql), meta: `CPQL ${brl(m.cpql)}` },
    { label: "Vendas Fechadas", value: num(m.conversions), meta: `CAC ${brl(m.cac)}` },
  ];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Metric label="Total de Leads" value={num(m.leads)} sub={`CPL ${brl(m.cpl)}`} />
        <Metric label="Leads Qualificados" value={num(m.mql)} sub={`${((m.mql / (m.leads || 1)) * 100).toFixed(0)}% qualificação`} />
        <Metric label="CPQL" value={brl(m.cpql)} />
        <Metric highlight label="Pipeline Estimado" value={brl(m.pipeline)} />
      </div>
      <Panel>
        <div className="mb-4 font-mono text-xs uppercase">Funil Mídia → Vendas</div>
        <div className="flex flex-col items-center gap-2">
          {steps.map((s, i) => {
            const last = i === steps.length - 1;
            return (
              <div key={s.label} style={{ width: `${100 - i * 13}%` }}
                className={cn("flex flex-wrap items-center justify-between gap-2 border-2 px-4 py-3", last ? "border-primary bg-primary text-primary-foreground brutal-dark" : "border-border bg-background")}>
                <span className="text-sm font-semibold"><span className="mr-2 font-mono text-xs opacity-60">0{i + 1}</span>{s.label}</span>
                <span className="font-mono text-sm"><b className="text-lg">{s.value}</b> <span className="opacity-70">· {s.meta}</span></span>
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}

function Integrations({ items, setItems }: { items: Integration[]; setItems: (f: (p: Integration[]) => Integration[]) => void }) {
  const [code, setCode] = useState(false);
  const [target, setTarget] = useState<Integration | null>(null);
  const [acc, setAcc] = useState("");
  const [tok, setTok] = useState("");
  const [loading, setLoading] = useState(false);
  const statusCls = { connected: "border-primary text-primary", pending: "border-warning text-warning", disconnected: "border-destructive text-destructive" };

  const connect = () => {
    if (!target) return;
    setLoading(true);
    setTimeout(() => {
      setItems((p) => p.map((i) => (i.id === target.id ? { ...i, status: "connected", account: acc || i.account, lastSync: "agora" } : i)));
      setLoading(false); setTarget(null); setAcc(""); setTok("");
    }, 1400);
  };

  return (
    <div className="space-y-6">
      <Btn variant={code ? "active" : "ghost"} onClick={() => setCode(!code)}><Code2 size={14} /> {code ? "Voltar às Integrações" : "Ver Backend Code (Node.js)"}</Btn>
      {code ? (
        <Panel className="overflow-auto">
          <pre className="font-mono text-xs leading-relaxed">
            {BACKEND_CODE.split("\n").map((l, i) => (
              <div key={i}>
                <span className="mr-4 inline-block w-6 select-none text-right text-muted-foreground">{i + 1}</span>
                <span className={l.trim().startsWith("//") ? "text-muted-foreground" : /^(import|app\.|const)/.test(l.trim()) ? "text-primary" : ""}>{l}</span>
              </div>
            ))}
          </pre>
        </Panel>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((i) => (
            <Panel key={i.id}>
              <div className="flex items-start justify-between gap-2">
                <div className="font-semibold">{i.name}</div>
                <span className={cn("border px-1.5 font-mono text-[10px]", statusCls[i.status])}>{i.status}</span>
              </div>
              <div className="mt-3 space-y-1 font-mono text-[11px] text-muted-foreground">
                <div>account_id: <span className="text-foreground">{i.account}</span></div>
                <div>last_sync: <span className="text-foreground">{i.lastSync}</span></div>
              </div>
              <div className="mt-4">
                {i.status === "connected" ? (
                  <Btn variant="danger" onClick={() => setItems((p) => p.map((x) => (x.id === i.id ? { ...x, status: "disconnected", lastSync: "desconectado" } : x)))}>Desconectar</Btn>
                ) : (
                  <Btn variant="lime" onClick={() => setTarget(i)}><Plug size={14} /> Conectar OAuth</Btn>
                )}
              </div>
            </Panel>
          ))}
        </div>
      )}
      <Modal open={!!target} onClose={() => !loading && setTarget(null)} title={`OAuth · ${target?.name ?? ""}`}>
        <div className="space-y-3">
          {[["Account ID / Manager ID", acc, setAcc, "text"], ["User Access Token / API Secret", tok, setTok, "password"]].map(([l, v, s, t]) => (
            <label key={l as string} className="block">
              <span className="font-mono text-[10px] uppercase text-muted-foreground">{l as string}</span>
              <input type={t as string} value={v as string} onChange={(e) => (s as (x: string) => void)(e.target.value)}
                className="mt-1 w-full border-2 border-border bg-background px-3 py-2 font-mono text-sm outline-none focus:border-primary" />
            </label>
          ))}
          <Btn variant="lime" disabled={loading} className="w-full justify-center" onClick={connect}>
            {loading ? <><Loader2 size={14} className="animate-spin" /> Autenticando...</> : "Simular Autenticação"}
          </Btn>
        </div>
      </Modal>
    </div>
  );
}

const NAMES = ["Ana Souza", "Bruno Lima", "Carla Dias", "Diego Rocha", "Elisa Martins", "Felipe Alves", "Gabi Nunes"];
const SOURCES = ["meta/ugc_depoimento_v3", "google/search_marca_exata", "tiktok/trend_audio_hook", "linkedin/case_b2b_static"];

function WebhookModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [logs, setLogs] = useState<{ name: string; email: string; source: string; value: number; ts: string }[]>([]);
  const fire = () => {
    const name = NAMES[Math.floor(Math.random() * NAMES.length)]!;
    setLogs((l) => [{ name, email: `${name.split(" ")[0]!.toLowerCase()}@empresa.com.br`, source: SOURCES[Math.floor(Math.random() * SOURCES.length)]!, value: Math.round(500 + Math.random() * 4500), ts: new Date().toLocaleTimeString("pt-BR") }, ...l].slice(0, 30));
  };
  return (
    <Modal open={open} onClose={onClose} title="Webhook Tester · CRM" wide>
      <div className="mb-4 border-2 border-border bg-background px-3 py-2 font-mono text-xs"><span className="font-bold text-primary">POST</span> https://api.traffik-os.io/v1/webhook/lead</div>
      <Btn variant="lime" onClick={fire}>+ Disparar Lead Simulado (POST)</Btn>
      <div className="mt-4 h-72 overflow-auto border-2 border-border bg-background p-3 font-mono text-[11px]">
        {logs.length === 0 && <span className="text-muted-foreground">aguardando requisições...</span>}
        {logs.map((l, i) => (
          <div key={i} className="border-b border-border py-1.5">
            <span className="text-muted-foreground">[{l.ts}]</span> <span className="text-primary">200 OK</span> {l.name} · {l.email} · <span className="text-warning">{l.source}</span> · {brl(l.value)}
          </div>
        ))}
      </div>
    </Modal>
  );
}
