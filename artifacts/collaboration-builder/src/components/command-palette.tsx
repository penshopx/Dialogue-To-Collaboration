import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useListWorkrooms, useListTemplates, useListAgents } from "@workspace/api-client-react";
import {
  Briefcase, Library, Bot, LayoutDashboard, Lightbulb,
  Search, ArrowRight, Clock, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";

type Result = {
  id: string;
  label: string;
  sublabel?: string;
  icon: React.ElementType;
  iconColor: string;
  href: string;
  category: string;
};

const STATIC_NAV: Result[] = [
  { id: "nav-dash", label: "Dashboard", sublabel: "Mission Control", icon: LayoutDashboard, iconColor: "text-primary", href: "/", category: "Navigasi" },
  { id: "nav-workrooms", label: "Workrooms", sublabel: "Semua pipeline", icon: Briefcase, iconColor: "text-blue-400", href: "/workrooms", category: "Navigasi" },
  { id: "nav-templates", label: "Templates", sublabel: "Template workflow", icon: Library, iconColor: "text-amber-400", href: "/templates", category: "Navigasi" },
  { id: "nav-agents", label: "Agents", sublabel: "Registry agen AI", icon: Bot, iconColor: "text-green-400", href: "/agents", category: "Navigasi" },
  { id: "nav-insights", label: "Insights", sublabel: "Analitik & pola", icon: Lightbulb, iconColor: "text-violet-400", href: "/insights", category: "Navigasi" },
  { id: "nav-new", label: "Buat Workroom Baru", sublabel: "Mulai pipeline baru", icon: Zap, iconColor: "text-emerald-400", href: "/workrooms/new", category: "Aksi" },
];

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const [, navigate] = useLocation();

  const { data: workrooms } = useListWorkrooms();
  const { data: templates } = useListTemplates();
  const { data: agents } = useListAgents();

  const allResults: Result[] = [
    ...STATIC_NAV,
    ...(workrooms?.map(w => ({
      id: `wr-${w.id}`,
      label: w.name,
      sublabel: `${w.status} · Stage: ${w.currentStageName} · ${w.progress}%`,
      icon: Briefcase,
      iconColor: w.status === "completed" ? "text-green-400" : "text-blue-400",
      href: `/workrooms/${w.id}`,
      category: "Workrooms",
    })) ?? []),
    ...(templates?.map(t => ({
      id: `tmpl-${t.id}`,
      label: t.name,
      sublabel: `Template · ${t.sector}`,
      icon: Library,
      iconColor: "text-amber-400",
      href: `/templates`,
      category: "Templates",
    })) ?? []),
    ...(agents?.map(a => ({
      id: `agent-${a.id}`,
      label: a.name,
      sublabel: `${a.functionRole} · ${a.category}`,
      icon: Bot,
      iconColor: "text-green-400",
      href: `/agents`,
      category: "Agents",
    })) ?? []),
  ];

  const filtered = query.trim()
    ? allResults.filter(r =>
        r.label.toLowerCase().includes(query.toLowerCase()) ||
        (r.sublabel ?? "").toLowerCase().includes(query.toLowerCase()) ||
        r.category.toLowerCase().includes(query.toLowerCase())
      )
    : STATIC_NAV;

  const grouped = filtered.reduce<Record<string, Result[]>>((acc, r) => {
    (acc[r.category] ??= []).push(r);
    return acc;
  }, {});

  useEffect(() => { setSelected(0); }, [query]);

  const navigate_ = useCallback((href: string) => {
    navigate(href);
    onClose();
    setQuery("");
  }, [navigate, onClose]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowDown") { e.preventDefault(); setSelected(s => Math.min(s + 1, filtered.length - 1)); }
      if (e.key === "ArrowUp") { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
      if (e.key === "Enter" && filtered[selected]) navigate_(filtered[selected].href);
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, filtered, selected, navigate_, onClose]);

  useEffect(() => {
    function onGlobal(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); if (!open) { /* handled by parent */ } }
    }
    window.addEventListener("keydown", onGlobal);
    return () => window.removeEventListener("keydown", onGlobal);
  }, [open]);

  let flatIdx = 0;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="p-0 gap-0 max-w-xl overflow-hidden" style={{ maxHeight: "min(600px, 80vh)" }}>
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            autoFocus
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            placeholder="Cari workroom, template, agen…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-xs text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded border border-border">
              esc
            </button>
          )}
          {!query && <kbd className="text-xs text-muted-foreground border border-border rounded px-1.5 py-0.5 hidden sm:inline">⌘K</kbd>}
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: "calc(min(600px, 80vh) - 57px)" }}>
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              <Search className="w-6 h-6 mx-auto mb-2 opacity-30" />
              Tidak ada hasil untuk "{query}"
            </div>
          ) : (
            Object.entries(grouped).map(([cat, items]) => (
              <div key={cat}>
                <div className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                  {cat}
                </div>
                {items.map((item) => {
                  const Icon = item.icon;
                  const idx = flatIdx++;
                  const isSelected = idx === selected;
                  return (
                    <button
                      key={item.id}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                        isSelected ? "bg-accent text-foreground" : "hover:bg-accent/50"
                      )}
                      onMouseEnter={() => setSelected(idx)}
                      onClick={() => navigate_(item.href)}
                    >
                      <div className={cn("w-7 h-7 rounded-md flex items-center justify-center shrink-0 bg-muted", item.iconColor)}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.label}</p>
                        {item.sublabel && (
                          <p className="text-[11px] text-muted-foreground truncate">{item.sublabel}</p>
                        )}
                      </div>
                      {isSelected && <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                    </button>
                  );
                })}
              </div>
            ))
          )}

          {!query && (
            <div className="px-4 py-3 border-t border-border flex items-center gap-4 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Navigasi cepat</span>
              <span>↑↓ pilih</span>
              <span>↵ buka</span>
              <span>esc tutup</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
