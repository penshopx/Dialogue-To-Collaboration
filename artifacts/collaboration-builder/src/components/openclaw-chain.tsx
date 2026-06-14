import { useState, useRef } from "react";
import { useListKnowledgeItems } from "@workspace/api-client-react";
import { Brain, Shield, Wrench, Star, FileText, CheckSquare, Plus, X, GripVertical, ArrowDown, Play, Loader2, Copy, ChevronDown, ChevronUp, RotateCcw, Waves } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const AGENTS = [
  { role: "strategis", name: "Strategis", emoji: "🧭", color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/30", desc: "Peta besar & strategi" },
  { role: "skeptis", name: "Skeptis", emoji: "🛡️", color: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/30", desc: "Risiko & kritik" },
  { role: "eksekutor", name: "Eksekutor", emoji: "⚙️", color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/30", desc: "Action & implementasi" },
  { role: "narasumber", name: "Narasumber", emoji: "📚", color: "text-green-400", bg: "bg-green-400/10", border: "border-green-400/30", desc: "Knowledge & konteks" },
  { role: "pack_compiler", name: "DocuGen", emoji: "📄", color: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-400/30", desc: "Kompilasi & dokumentasi" },
  { role: "evaluator", name: "Evaluator", emoji: "✅", color: "text-cyan-400", bg: "bg-cyan-400/10", border: "border-cyan-400/30", desc: "Penilaian & scoring" },
  { role: "sintetis", name: "Sintetis", emoji: "🌀", color: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/30", desc: "Integrasi & synthesis" },
] as const;

type AgentRole = typeof AGENTS[number]["role"];

const PRESET_CHAINS = [
  { name: "Strategy → Validate → Execute", chain: ["strategis", "skeptis", "eksekutor"], desc: "Rencanakan, uji, laksanakan" },
  { name: "Research → Analyse → Document", chain: ["narasumber", "strategis", "pack_compiler"], desc: "Riset, analisa, dokumentasi" },
  { name: "Debate → Evaluate → Synthesize", chain: ["strategis", "skeptis", "evaluator", "sintetis"], desc: "Debat lengkap, 4 perspektif" },
  { name: "Full Council", chain: ["strategis", "narasumber", "skeptis", "eksekutor", "sintetis"], desc: "Dewan agen lengkap, 5 claw" },
] as const;

interface AgentOutput { role: string; name: string; emoji: string; content: string; streaming: boolean; done: boolean }

interface Props { workroomId: number; workroomName?: string; objective?: string }

export function OpenclawChain({ workroomId, workroomName, objective }: Props) {
  const { data: knowledgeItems = [] } = useListKnowledgeItems(workroomId);
  const [chain, setChain] = useState<AgentRole[]>(["strategis", "skeptis", "eksekutor"]);
  const [prompt, setPrompt] = useState("");
  const [outputs, setOutputs] = useState<AgentOutput[]>([]);
  const [running, setRunning] = useState(false);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const { toast } = useToast();

  const addAgent = (role: AgentRole) => { if (chain.length < 7) setChain(c => [...c, role]); };
  const removeAgent = (i: number) => setChain(c => c.filter((_, idx) => idx !== i));
  const applyPreset = (preset: typeof PRESET_CHAINS[number]) => setChain([...preset.chain] as AgentRole[]);

  const knowledgeContext = knowledgeItems.slice(0, 5)
    .map(k => `**${k.title}**: ${k.content.slice(0, 250)}`)
    .join("\n\n");

  const runChain = async () => {
    if (!prompt.trim() || running || chain.length === 0) return;
    setRunning(true);
    setExpandedIdx(null);
    abortRef.current = new AbortController();

    const initialOutputs: AgentOutput[] = chain.map(role => {
      const a = AGENTS.find(ag => ag.role === role)!;
      return { role, name: a.name, emoji: a.emoji, content: "", streaming: false, done: false };
    });
    setOutputs(initialOutputs);

    try {
      const res = await fetch("/api/agent/openclaw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          chain: [...chain],
          context: { workroomName, objective, knowledgeBase: knowledgeContext || undefined },
        }),
        signal: abortRef.current.signal,
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

            if (data.phase === "start") {
              setOutputs(prev => prev.map(o =>
                o.role === data.agent ? { ...o, streaming: true } : o
              ));
              // Auto-expand current agent
              const idx = chain.indexOf(data.agent as AgentRole);
              if (idx !== -1) setExpandedIdx(idx);
            }

            if (data.phase === "chunk") {
              setOutputs(prev => prev.map(o =>
                o.role === data.agent ? { ...o, content: o.content + data.content } : o
              ));
            }

            if (data.phase === "done") {
              setOutputs(prev => prev.map(o =>
                o.role === data.agent ? { ...o, streaming: false, done: true } : o
              ));
            }

            if (data.phase === "chain_complete") {
              setRunning(false);
              // Expand last agent
              setExpandedIdx(chain.length - 1);
            }
          } catch { /* skip */ }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        toast({ title: "Error", description: "Rantai agen gagal", variant: "destructive" });
      }
    } finally {
      setRunning(false);
    }
  };

  const stop = () => { abortRef.current?.abort(); setRunning(false); };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500/20 to-purple-500/20 border border-orange-400/20 flex items-center justify-center">
          <Waves className="w-4 h-4 text-orange-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">Openclaw Chain</h3>
          <p className="text-xs text-muted-foreground">Agen bekerja berurutan — output satu menjadi input berikutnya</p>
        </div>
      </div>

      {/* Preset chains */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Preset Rantai</p>
        <div className="flex flex-wrap gap-2">
          {PRESET_CHAINS.map(p => (
            <button
              key={p.name}
              onClick={() => applyPreset(p)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-border hover:bg-muted/50 transition-colors text-left"
            >
              <span className="font-medium">{p.name}</span>
              <span className="text-muted-foreground ml-1">— {p.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chain builder */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Rantai Agen ({chain.length} node)</p>
        <div className="flex flex-col items-center gap-0">
          {chain.map((role, i) => {
            const agent = AGENTS.find(a => a.role === role)!;
            return (
              <div key={`${role}-${i}`} className="w-full flex flex-col items-center">
                <div className={cn("w-full flex items-center gap-2 px-3 py-2 rounded-lg border", agent.bg, agent.border)}>
                  <span className="text-base">{agent.emoji}</span>
                  <span className={cn("text-xs font-semibold", agent.color)}>{agent.name}</span>
                  <span className="text-xs text-muted-foreground flex-1">{agent.desc}</span>
                  <Badge variant="outline" className="text-[9px] h-4 px-1.5 shrink-0">Node {i + 1}</Badge>
                  <button onClick={() => removeAgent(i)} className="text-muted-foreground hover:text-destructive shrink-0">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                {i < chain.length - 1 && (
                  <div className="flex flex-col items-center py-1">
                    <ArrowDown className="w-4 h-4 text-muted-foreground/50" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {chain.length < 7 && (
          <Select onValueChange={v => addAgent(v as AgentRole)}>
            <SelectTrigger className="h-8 text-xs border-dashed">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Plus className="w-3.5 h-3.5" /> Tambah node…
              </div>
            </SelectTrigger>
            <SelectContent>
              {AGENTS.map(a => (
                <SelectItem key={a.role} value={a.role}>
                  <div className="flex items-center gap-2">
                    <span>{a.emoji}</span>
                    <span>{a.name}</span>
                    <span className="text-muted-foreground text-xs">— {a.desc}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Prompt */}
      <div className="space-y-2">
        <Textarea
          rows={3}
          placeholder="Masukkan pertanyaan atau tugas untuk diproses oleh rantai agen…"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          disabled={running}
          className="resize-none text-sm"
        />
        <div className="flex justify-between items-center">
          <p className="text-xs text-muted-foreground">
            {knowledgeItems.length > 0 && `📚 ${knowledgeItems.length} KB artikel sebagai konteks`}
          </p>
          <div className="flex gap-2">
            {running && <Button size="sm" variant="destructive" onClick={stop}>Stop</Button>}
            {outputs.length > 0 && !running && (
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => { setOutputs([]); setExpandedIdx(null); }}>
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </Button>
            )}
            <Button size="sm" disabled={!prompt.trim() || running || chain.length === 0} onClick={runChain} className="gap-1.5">
              {running
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Berjalan ({outputs.filter(o => o.done).length}/{chain.length})</>
                : <><Play className="w-3.5 h-3.5" /> Jalankan Rantai</>
              }
            </Button>
          </div>
        </div>
      </div>

      {/* Outputs */}
      {outputs.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Output Rantai</p>
          <div className="space-y-2">
            {outputs.map((output, i) => {
              const agent = AGENTS.find(a => a.role === output.role)!;
              const isExpanded = expandedIdx === i;
              const status = output.done ? "done" : output.streaming ? "streaming" : "waiting";
              return (
                <div key={i} className={cn("rounded-xl border overflow-hidden transition-all", agent.border,
                  status === "waiting" && "opacity-50"
                )}>
                  <button
                    className={cn("w-full flex items-center gap-2 px-3 py-2.5 text-left", agent.bg)}
                    onClick={() => setExpandedIdx(isExpanded ? null : i)}
                  >
                    <span className="text-base">{output.emoji}</span>
                    <span className={cn("text-xs font-semibold", agent.color)}>{output.name}</span>
                    <Badge variant="outline" className="text-[9px] h-4 px-1.5 ml-0">Node {i + 1}</Badge>
                    {status === "streaming" && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground ml-auto" />}
                    {status === "done" && <span className="ml-auto text-[10px] text-green-400">✓ Selesai</span>}
                    {status === "waiting" && <span className="ml-auto text-[10px] text-muted-foreground">Menunggu…</span>}
                    {status !== "streaming" && (
                      isExpanded
                        ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
                        : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="border-t border-border/50">
                      <div className="p-3 max-h-64 overflow-y-auto">
                        <p className="text-xs leading-relaxed whitespace-pre-wrap text-foreground/90">
                          {output.content || "…"}
                          {output.streaming && <span className="inline-block w-1 h-3 bg-primary/60 ml-0.5 animate-pulse align-middle" />}
                        </p>
                      </div>
                      {output.done && (
                        <div className="px-3 pb-2 flex justify-end">
                          <button className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1" onClick={() => { navigator.clipboard.writeText(output.content); toast({ title: "Disalin ✓" }); }}>
                            <Copy className="w-2.5 h-2.5" /> Salin
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
