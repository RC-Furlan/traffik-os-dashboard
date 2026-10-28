import type { ReactNode, ButtonHTMLAttributes } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("border-2 border-border bg-card p-4 brutal-dark", className)}>{children}</div>;
}

export function Btn({ variant = "ghost", className, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "lime" | "ghost" | "active" | "danger" }) {
  const v = {
    lime: "bg-primary text-primary-foreground border-primary-foreground brutal",
    active: "bg-primary text-primary-foreground border-primary",
    ghost: "bg-card text-foreground border-border hover:border-primary",
    danger: "bg-card text-destructive border-destructive",
  }[variant];
  return (
    <button
      {...p}
      className={cn("inline-flex items-center gap-2 border-2 px-3 py-1.5 font-mono text-xs font-bold uppercase brutal-press disabled:cursor-not-allowed disabled:opacity-40 disabled:line-through", v, className)}
    />
  );
}

export function Metric({ label, value, sub, delta, highlight, warn }: { label: string; value: string; sub?: string; delta?: number; highlight?: boolean; warn?: boolean }) {
  return (
    <div className={cn("border-2 p-4", highlight ? "border-primary bg-primary text-primary-foreground brutal-dark" : "border-border bg-card brutal-dark", warn && "border-warning")}>
      <div className={cn("font-mono text-[10px] uppercase tracking-widest", highlight ? "text-primary-foreground" : "text-muted-foreground")}>{label}</div>
      <div className={cn("mt-2 truncate font-mono text-xl font-bold 2xl:text-2xl", warn && "text-warning")}>{value}</div>
      <div className="mt-1 flex items-center gap-2 font-mono text-[11px]">
        {delta !== undefined && <span className={cn("font-bold", highlight ? "" : delta >= 0 ? "text-primary" : "text-destructive")}>{delta >= 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}%</span>}
        {sub && <span className={highlight ? "" : "text-muted-foreground"}>{sub}</span>}
      </div>
    </div>
  );
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 p-4" onClick={onClose}>
      <div className={cn("max-h-[90vh] w-full overflow-auto border-2 border-primary bg-card p-5 brutal", wide ? "max-w-3xl" : "max-w-lg")} onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-mono text-sm font-bold uppercase text-primary">{title}</h3>
          <button onClick={onClose} aria-label="Fechar" className="text-muted-foreground hover:text-primary"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export const tooltipStyle = { background: "var(--card)", border: "2px solid var(--primary)", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--foreground)" };
