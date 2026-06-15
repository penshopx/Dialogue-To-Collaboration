import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, Library, Briefcase, Bot, Settings, Bell, Menu, X, AlertTriangle, Lightbulb, Search, MessageSquare, Wand2, CheckCircle2, CalendarX, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useListWorkrooms } from "@workspace/api-client-react";
import { CommandPalette } from "@/components/command-palette";
import { Separator } from "@/components/ui/separator";
import { useNotifications, type AppNotification } from "@/hooks/use-notifications";

const GATE_STAGE_NAMES = new Set(["Skeptic Gate", "QA Gate"]);

function usePendingGateCount() {
  const { data: workrooms } = useListWorkrooms();
  return workrooms?.filter(
    (w) => w.status === "active" && w.currentStageName && GATE_STAGE_NAMES.has(w.currentStageName)
  ).length ?? 0;
}

const NOTIF_ICON: Record<string, React.ElementType> = {
  gate_pending: ShieldAlert,
  overdue: CalendarX,
  completed: CheckCircle2,
};

const NOTIF_COLOR: Record<string, string> = {
  gate_pending: "text-amber-400",
  overdue: "text-red-400",
  completed: "text-green-400",
};

function NotificationPanel({ notifications, onClose }: { notifications: AppNotification[]; onClose: () => void }) {
  const grouped = {
    gate_pending: notifications.filter(n => n.type === "gate_pending"),
    overdue: notifications.filter(n => n.type === "overdue"),
    completed: notifications.filter(n => n.type === "completed"),
  };
  const sections = [
    { key: "gate_pending", label: "Gate Menunggu", items: grouped.gate_pending },
    { key: "overdue", label: "Overdue", items: grouped.overdue },
    { key: "completed", label: "Baru Selesai", items: grouped.completed },
  ] as const;

  return (
    <div className="w-80 max-h-[420px] overflow-y-auto flex flex-col">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <span className="text-sm font-semibold">Notifikasi</span>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      {notifications.length === 0 ? (
        <div className="py-8 text-center text-xs text-muted-foreground">
          <Bell className="w-6 h-6 mx-auto mb-2 opacity-30" />
          Tidak ada notifikasi aktif
        </div>
      ) : (
        <div className="divide-y divide-border/50">
          {sections.map(({ key, label, items }) =>
            items.length === 0 ? null : (
              <div key={key} className="py-2">
                <p className="px-4 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
                {items.map(n => {
                  const Icon = NOTIF_ICON[n.type] ?? Bell;
                  return (
                    <Link key={n.id} href={n.href} onClick={onClose}>
                      <div className="flex items-start gap-3 px-4 py-2.5 hover:bg-accent/50 cursor-pointer transition-colors">
                        <Icon className={cn("w-4 h-4 shrink-0 mt-0.5", NOTIF_COLOR[n.type])} />
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate">{n.title}</p>
                          <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">{n.message}</p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

function NavLinks({ location, gateCount, onNavigate }: { location: string; gateCount: number; onNavigate?: () => void }) {
  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard, badge: 0 },
    { href: "/workrooms", label: "Workrooms", icon: Briefcase, badge: gateCount },
    { href: "/templates", label: "Templates", icon: Library, badge: 0 },
    { href: "/agents", label: "Agents", icon: Bot, badge: 0 },
    { href: "/insights", label: "Insights", icon: Lightbulb, badge: 0 },
  ];

  const aiItems = [
    { href: "/collaboration-wizard", label: "Collaboration Wizard", icon: Wand2, badge: 0 },
    { href: "/chat-console", label: "Chat Console", icon: MessageSquare, badge: 0 },
  ];

  return (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
        return (
          <Link key={item.href} href={item.href} onClick={onNavigate}>
            <div
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors cursor-pointer",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.badge > 0 && (
                <span className="flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold px-1">
                  {item.badge}
                </span>
              )}
            </div>
          </Link>
        );
      })}

      <div className="pt-3">
        <Separator className="mb-3" />
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-3 mb-1.5">Sistem Agen AI</p>
        {aiItems.map((item) => {
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} onClick={onNavigate}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors cursor-pointer",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const gateCount = usePendingGateCount();
  const { data: notifData } = useNotifications();
  const notifCount = notifData?.count ?? 0;

  useEffect(() => {
    if (!notifOpen) return;
    function handleOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [notifOpen]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCmdOpen(prev => !prev);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const mobileNavItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard, badge: 0 },
    { href: "/workrooms", label: "Workrooms", icon: Briefcase, badge: gateCount },
    { href: "/templates", label: "Templates", icon: Library, badge: 0 },
    { href: "/agents", label: "Agents", icon: Bot, badge: 0 },
    { href: "/insights", label: "Insights", icon: Lightbulb, badge: 0 },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      <aside className="hidden md:flex w-64 border-r border-border bg-card flex-col shrink-0">
        <div className="p-6">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
                <Bot className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold tracking-tight text-lg">CollabBuilder</span>
            </div>
          </Link>
        </div>
        <div className="px-4 py-2 flex-1">
          <NavLinks location={location} gateCount={gateCount} />
        </div>
        {gateCount > 0 && (
          <div className="px-4 pb-4">
            <Link href="/workrooms">
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-xs font-medium text-amber-400 cursor-pointer hover:bg-amber-500/20 transition-colors">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{gateCount} gate{gateCount > 1 ? "s" : ""} awaiting review</span>
              </div>
            </Link>
          </div>
        )}
      </aside>

      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <header className="h-14 border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50 flex items-center justify-between px-4 md:px-8 shrink-0">
          <div className="flex items-center gap-3 md:hidden">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Menu className="w-5 h-5" />
                  {gateCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400" />
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0 bg-card">
                <div className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
                      <Bot className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <span className="font-bold tracking-tight text-lg">CollabBuilder</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="px-4">
                  <NavLinks location={location} gateCount={gateCount} onNavigate={() => setMobileOpen(false)} />
                </div>
              </SheetContent>
            </Sheet>
            <span className="font-semibold text-sm">CollabBuilder</span>
          </div>

          <div className="flex-1 hidden md:block" />

          <div className="flex items-center gap-3">
            <button
              onClick={() => setCmdOpen(true)}
              className="hidden md:flex items-center gap-2 px-3 h-8 rounded-md border border-border bg-muted/40 hover:bg-muted transition-colors text-xs text-muted-foreground"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Cari…</span>
              <kbd className="ml-1 text-[10px] border border-border rounded px-1 py-0.5">⌘K</kbd>
            </button>
            <div className="relative" ref={notifRef}>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground relative"
                onClick={() => setNotifOpen(o => !o)}
              >
                <Bell className="w-4 h-4" />
                {notifCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-[9px] text-white font-bold leading-none">
                    {notifCount > 9 ? "9+" : notifCount}
                  </span>
                )}
              </Button>
              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden">
                  <NotificationPanel
                    notifications={notifData?.notifications ?? []}
                    onClose={() => setNotifOpen(false)}
                  />
                </div>
              )}
            </div>
            <Button variant="ghost" size="icon" className="text-muted-foreground hidden md:inline-flex">
              <Settings className="w-4 h-4" />
            </Button>
            <div className="w-8 h-8 rounded-full bg-accent border border-border flex items-center justify-center text-sm font-medium">
              JD
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto bg-background">
          <div className="container mx-auto p-4 md:p-8 max-w-7xl">
            {children}
          </div>
        </div>

        <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />

        <nav className="md:hidden border-t border-border bg-card flex items-center justify-around h-14 shrink-0">
          {mobileNavItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <div className={cn(
                  "relative flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-md transition-colors cursor-pointer",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}>
                  <item.icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium">{item.label}</span>
                  {item.badge > 0 && (
                    <span className="absolute top-0.5 right-2.5 w-2 h-2 rounded-full bg-amber-400" />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>
      </main>
    </div>
  );
}
