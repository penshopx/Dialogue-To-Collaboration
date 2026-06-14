import { useState, useRef } from "react";
import { useListKnowledgeItems } from "@workspace/api-client-react";
import { Brain, Shield, Wrench, Star, FileText, CheckSquare, Zap, Copy, RefreshCw, Send, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const AGENTS = [
  { role: "strategis", name: "Strategis", emoji: "🧭", icon: Brain, color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/30" },
  { role: "skeptis", name: "Skeptis", emoji: "🛡️", icon: Shield, color: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/30" },
  { role: "eksekutor", name: "Eksekutor", emoji: "⚙️", icon: Wrench, color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/30" },
  { role: "narasumber", name: "Narasumber", emoji: "📚", icon: Star, color: "text-green-400", bg: "bg-green-400/10", border: "border-green-400/30" },
  { role: "pack_compiler", name: "DocuGen", emoji: "📄", icon: FileText, color: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-400/30" },
  { role: "evaluator", name: "Evaluator", emoji: "✅", icon: CheckSquare, color: "text-cyan-400", bg: "bg-cyan-400/10", border: "border-cyan-400/30" },
] as const;

type AgentRole = typeof AGENTS[number]["role"];

interface AgentState { content: string; streaming: boolean; done: boolean; error?: string }

interface Props { workroomId: number; workroomName?: string; objective?: string }

export function MulticlawPanel({ workroomId, workroomName, objective }: Props) {
  const { data: knowledgeItems = [] } = useListKnowledgeItems(workroomId);
  const [prompt, setPrompt] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<Set<AgentRole>>(new Set(["strategis", "skeptis", "eksekutor"]));
  const [agentStates, setAgentStates] = useState<Record<string, AgentState>>({});
  const [running, setRunning] = useState(false);
  const { toast } = useToast();
  const abortRefs = useRef<Record<string, AbortController>>({});

  const toggleRole = (role: AgentRole) => {
    setSelectedRoles(prev => {
      const next = new Set(prev);
      if (next.has(role)) { if (next.size > 1) next.delete(role); }
      else next.add(role);
      return next;
    });
  };

  const knowledgeContext = knowledgeItems
    .slice(0, 5)
    .map(k => `**${k.title}**: ${k.content.slice(0, 300)}`)
    .join("\n\n");

  const context = {
    workroomName,
    objective,
    knowledgeBase: knowledgeContext || undefined,
  };

  const runMulticlaw = async () => {
    if (!prompt.trim() || running) return;
    setRunning(true);

    const roles = Array.from(selectedRoles);
    const initialStates: Record<string, AgentState> = {};
    for (const r of roles) initialStates[r] = { content: "", streaming: true, done: false };
    setAgentStates(initialStates);

    const streamAgent = async (role: string) => {
      const ctrl = new AbortController();
      abortRefs.current[role] = ctrl;

      try {
        const res = await fetch("/api/agent/invoke", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agentRole: role,
            messages: [{ role: "user", content: prompt }],
            context,
          }),
          signal: ctrl.signal,
        });

        if (!res.body) throw new Error("No stream");
        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          for (const line of decoder.decode(value).split("\n")) {
            if (!line.startsWith("data: ")) continue;
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                setAgentStates(prev => ({
                  ...prev,
                  [role]: { ...prev[role], content: (prev[role]?.content ?? "") + data.content },
                }));
              }
              if (data.done) {
                setAgentStates(prev => ({ ...prev, [role]: { ...prev[role], streaming: false, done: true } }));
              }
            } catch { /* skip */ }
          }
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setAgentStates(prev => ({ ...prev, [role]: { ...prev[role], streaming: false, done: true, error: "Gagal" } }));
        }
      }
    };

    await Promise.all(roles.map(streamAgent));
    setRunning(false);
  };

  const stop = () => {
    Object.values(abortRefs.current).forEach(c => c.abort());
    setRunning(false);
    setAgentStates(prev => {
      const next = { ...prev };
      for (const k in next) next[k] = { ...next[k], streaming: false };
      return next;
    });
  };

  const hasResults = Object.keys(agentStates).length > 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-400/20 flex items-center justify-center">
          <Zap className="w-4 h-4 text-blue-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">Multiclaw Panel</h3>
          <p className="text-xs text-muted-foreground">Semua agen menjawab pertanyaan yang sama secara paralel</p>
        </div>
      </div>

      {/* Agent selector */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pilih Agen ({selectedRoles.size} aktif)</p>
        <div className="flex flex-wrap gap-2">
          {AGENTS.map(agent => {
            const active = selectedRoles.has(agent.role);
            return (
              <button
                key={agent.role}
                onClick={() => toggleRole(agent.role)}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium border transition-all",
                  active
                    ? `${agent.bg} ${agent.border} ${agent.color}`
                    : "bg-muted/30 border-border/50 text-muted-foreground hover:text-foreground"
                )}
              >
                <span>{agent.emoji}</span>
                <span>{agent.name}</span>
                {active && <CheckSquare className="w-2.5 h-2.5" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Prompt input */}
      <div className="space-y-2">
        <Textarea
          rows={3}
          placeholder="Masukkan pertanyaan atau topik yang ingin didebat oleh semua agen…"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          className="resize-none text-sm"
          disabled={running}
          onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) runMulticlaw(); }}
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {knowledgeItems.length > 0 && <span>📚 {knowledgeItems.length} artikel KB akan disertakan sebagai konteks</span>}
          </p>
          <div className="flex gap-2">
            {running && (
              <Button size="sm" variant="destructive" onClick={stop}>Stop</Button>
            )}
            {hasResults && !running && (
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => { setAgentStates({}); }}>
                <RefreshCw className="w-3.5 h-3.5" /> Reset
              </Button>
            )}
            <Button size="sm" disabled={!prompt.trim() || running} onClick={runMulticlaw} className="gap-1.5">
              {running
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Berproses…</>
                : <><Sparkles className="w-3.5 h-3.5" /> Jalankan Multiclaw</>
              }
            </Button>
          </div>
        </div>
      </div>

      {/* Results grid */}
      {hasResults && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {AGENTS.filter(a => agentStates[a.role]).map(agent => {
            const state = agentStates[agent.role];
            const Icon = agent.icon;
            if (!state) return null;
            return (
              <div key={agent.role} className={cn("rounded-xl border overflow-hidden", agent.border)}>
                <div className={cn("flex items-center gap-2 px-3 py-2 border-b", agent.bg, `border-b-${agent.border}`)}>
                  <span className="text-base">{agent.emoji}</span>
                  <span className={cn("text-xs font-semibold", agent.color)}>{agent.name}</span>
                  {state.streaming && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground ml-auto" />}
                  {state.done && !state.error && (
                    <button className="ml-auto text-muted-foreground hover:text-foreground" onClick={() => { navigator.clipboard.writeText(state.content); toast({ title: "Disalin ✓" }); }}>
                      <Copy className="w-3 h-3" />
                    </button>
                  )}
                  {state.error && <Badge variant="destructive" className="ml-auto text-[9px] h-4">Error</Badge>}
                </div>
                <div className="p-3 max-h-72 overflow-y-auto">
                  {state.content ? (
                    <p className="text-xs leading-relaxed whitespace-pre-wrap text-foreground/90">
                      {state.content}
                      {state.streaming && <span className="inline-block w-1 h-3 bg-primary/60 ml-0.5 animate-pulse align-middle" />}
                    </p>
                  ) : (
                    <div className="flex items-center justify-center h-16 text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
