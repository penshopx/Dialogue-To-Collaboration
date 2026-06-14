import { useListAgents } from "@workspace/api-client-react";
import { Brain, Shield, Wrench, FileStack, CheckSquare, Star, Layers, Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const ROLE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  strategis: { label: "Strategis", icon: Brain, color: "text-blue-400" },
  skeptis: { label: "Skeptis", icon: Shield, color: "text-red-400" },
  eksekutor: { label: "Eksekutor", icon: Wrench, color: "text-amber-400" },
  pack_compiler: { label: "Pack Compiler", icon: FileStack, color: "text-purple-400" },
  narasumber: { label: "Narasumber", icon: Star, color: "text-green-400" },
  evaluator: { label: "Evaluator", icon: CheckSquare, color: "text-cyan-400" },
};

const TYPE_LABELS: Record<string, string> = {
  dialog: "Dialog",
  specialist: "Specialist",
  multi_agent: "Multi-Agent",
};

export default function AgentsList() {
  const { data: agents, isLoading } = useListAgents();
  const [search, setSearch] = useState("");

  const filtered = agents?.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.category.toLowerCase().includes(search.toLowerCase()) ||
      a.functionRole.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  const grouped = filtered.reduce<Record<string, typeof filtered>>((acc, a) => {
    const cat = a.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(a);
    return acc;
  }, {});

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Agents</h1>
        <p className="text-muted-foreground mt-1">
          The agent registry — roles, capabilities, and categories.
        </p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search agents..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-[160px] rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([category, agentList]) => (
            <div key={category}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center">
                  <Layers className="w-3.5 h-3.5 text-foreground" />
                </div>
                <h2 className="text-base font-semibold">{category}</h2>
                <Badge variant="outline">{agentList.length}</Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {agentList.map((agent) => {
                  const roleConf = ROLE_CONFIG[agent.functionRole] ?? {
                    label: agent.functionRole,
                    icon: Brain,
                    color: "text-muted-foreground",
                  };
                  const RoleIcon = roleConf.icon;
                  return (
                    <Card
                      key={agent.id}
                      className="hover-elevate transition-all group cursor-default"
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                              <RoleIcon className={`w-4 h-4 ${roleConf.color}`} />
                            </div>
                            <CardTitle className="text-sm font-semibold leading-tight">
                              {agent.name}
                            </CardTitle>
                          </div>
                          {agent.active && (
                            <span className="flex-shrink-0 w-2 h-2 rounded-full bg-green-500 mt-1.5" title="Active" />
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="pb-4">
                        <div className="flex gap-2 flex-wrap mb-3">
                          <Badge variant="secondary" className="text-xs">
                            {roleConf.label}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {TYPE_LABELS[agent.agentType] ?? agent.agentType}
                          </Badge>
                        </div>
                        {agent.systemPrompt && (
                          <CardDescription className="text-xs line-clamp-3">
                            {agent.systemPrompt}
                          </CardDescription>
                        )}
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
