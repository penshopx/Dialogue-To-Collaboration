import { useListAgents } from "@workspace/api-client-react";
import { Brain, Shield, Wrench, FileStack, CheckSquare, Star, Layers, Search, Zap, Crown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { cn } from "@/lib/utils";

const ROLE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  strategis: { label: "Strategis", icon: Brain, color: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/30" },
  skeptis: { label: "Skeptis", icon: Shield, color: "text-red-400", bg: "bg-red-400/10 border-red-400/30" },
  eksekutor: { label: "Eksekutor", icon: Wrench, color: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/30" },
  pack_compiler: { label: "Pack Compiler", icon: FileStack, color: "text-purple-400", bg: "bg-purple-400/10 border-purple-400/30" },
  narasumber: { label: "Narasumber", icon: Star, color: "text-green-400", bg: "bg-green-400/10 border-green-400/30" },
  evaluator: { label: "Evaluator", icon: CheckSquare, color: "text-cyan-400", bg: "bg-cyan-400/10 border-cyan-400/30" },
};

const OTONOMI_CONFIG: Record<string, { label: string; color: string }> = {
  draft_only: { label: "Draft Only", color: "text-muted-foreground" },
  suggest: { label: "Suggest", color: "text-amber-400" },
  semi_auto: { label: "Semi-Auto", color: "text-green-400" },
};

const ROLE_FILTERS = ["all", "strategis", "skeptis", "eksekutor", "narasumber", "pack_compiler"] as const;
type RoleFilter = typeof ROLE_FILTERS[number];

export default function AgentsList() {
  const { data: agents, isLoading } = useListAgents();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [onlyCoreTeam, setOnlyCoreTeam] = useState(false);

  const filtered = agents?.filter(a => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.category.toLowerCase().includes(search.toLowerCase()) ||
      (a.domainSpesifik ?? "").toLowerCase().includes(search.toLowerCase()) ||
      a.functionRole.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || a.functionRole === roleFilter;
    const matchCore = !onlyCoreTeam || a.isCoreTeam === true;
    return matchSearch && matchRole && matchCore;
  }) ?? [];

  const grouped = filtered.reduce<Record<string, typeof filtered>>((acc, a) => {
    const cat = a.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(a);
    return acc;
  }, {});

  const totalAgents = agents?.length ?? 0;
  const coreCount = agents?.filter(a => a.isCoreTeam).length ?? 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Agents</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Registry agen — {totalAgents} agen aktif, {coreCount} core trio
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setOnlyCoreTeam(v => !v)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors",
              onlyCoreTeam ? "bg-amber-500/20 border-amber-500/50 text-amber-400" : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            <Crown className="w-3 h-3" /> Core Team
          </button>
        </div>
      </div>

      {/* Search + Role Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari agen, domain, role…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 text-sm"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {ROLE_FILTERS.map(role => {
            const cfg = role !== "all" ? ROLE_CONFIG[role] : null;
            const Icon = cfg?.icon;
            return (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-medium transition-colors capitalize",
                  roleFilter === role
                    ? role !== "all" ? cfg?.bg + " " + cfg?.color : "bg-primary/20 border-primary/50 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground"
                )}
              >
                {Icon && <Icon className="w-3 h-3" />}
                {role === "all" ? "Semua" : ROLE_CONFIG[role]?.label ?? role}
              </button>
            );
          })}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-[200px] rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Layers className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Tidak ada agen yang cocok dengan filter ini.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([category, agentList]) => (
            <div key={category}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center">
                  <Layers className="w-3.5 h-3.5 text-foreground" />
                </div>
                <h2 className="text-sm font-semibold">{category}</h2>
                <Badge variant="outline" className="text-[10px]">{agentList.length}</Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {agentList.map(agent => {
                  const roleConf = ROLE_CONFIG[agent.functionRole] ?? { label: agent.functionRole, icon: Brain, color: "text-muted-foreground", bg: "bg-muted/50 border-border" };
                  const RoleIcon = roleConf.icon;
                  const otonomi = OTONOMI_CONFIG[agent.levelOtonomi ?? ""] ?? null;

                  return (
                    <Card key={agent.id} className="hover-elevate transition-all group cursor-default relative overflow-hidden">
                      {agent.isCoreTeam && (
                        <div className="absolute top-0 right-0 w-0 h-0 border-l-[28px] border-l-transparent border-t-[28px] border-t-amber-500/60" />
                      )}
                      <CardHeader className="pb-2 pt-4">
                        <div className="flex items-start gap-2">
                          <div className={cn("w-9 h-9 rounded-lg border flex items-center justify-center shrink-0", roleConf.bg)}>
                            <RoleIcon className={cn("w-4 h-4", roleConf.color)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <CardTitle className="text-sm font-semibold leading-tight truncate">{agent.name}</CardTitle>
                              {agent.isCoreTeam && <Crown className="w-3 h-3 text-amber-400 shrink-0" aria-label="Core Team" />}
                              {agent.active && <div className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" title="Aktif" />}
                            </div>
                            {agent.domainSpesifik && (
                              <p className="text-[10px] text-muted-foreground truncate mt-0.5">{agent.domainSpesifik}</p>
                            )}
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="pb-4 space-y-3">
                        {/* Role + Otonomi badges */}
                        <div className="flex gap-1.5 flex-wrap">
                          <Badge variant="secondary" className={cn("text-[10px] py-0 h-5", roleConf.bg, roleConf.color, "border")}>
                            {roleConf.label}
                          </Badge>
                          {otonomi && (
                            <Badge variant="outline" className={cn("text-[10px] py-0 h-5", otonomi.color)}>
                              <Zap className="w-2.5 h-2.5 mr-1" /> {otonomi.label}
                            </Badge>
                          )}
                        </div>

                        {/* Personality */}
                        {agent.kepribadian && (
                          <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2 italic">
                            "{agent.kepribadian}"
                          </p>
                        )}

                        {/* System prompt fallback */}
                        {!agent.kepribadian && agent.systemPrompt && (
                          <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                            {agent.systemPrompt}
                          </p>
                        )}

                        {/* Rating + Usage stats */}
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/50">
                          <span>{agent.totalPenggunaan ?? 0} penggunaan</span>
                          {agent.ratingAkurasi && (
                            <span className="flex items-center gap-1">
                              <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                              {agent.ratingAkurasi}
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
