import { useState, useRef, useEffect } from "react";
import { useListWorkrooms } from "@workspace/api-client-react";
import { Brain, Shield, Wrench, Star, FileText, CheckSquare, Bot, Send, Loader2, Copy, Trash2, Plus, ChevronDown, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const AGENTS = [
  { role: "strategis", name: "Strategis", icon: Brain, color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20" },
  { role: "skeptis", name: "Skeptis", icon: Shield, color: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/20" },
  { role: "eksekutor", name: "Eksekutor", icon: Wrench, color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20" },
  { role: "narasumber", name: "Narasumber", icon: Star, color: "text-green-400", bg: "bg-green-400/10", border: "border-green-400/20" },
  { role: "pack_compiler", name: "DocuGen", icon: FileText, color: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-400/20" },
  { role: "evaluator", name: "Evaluator", icon: CheckSquare, color: "text-cyan-400", bg: "bg-cyan-400/10", border: "border-cyan-400/20" },
] as const;

type AgentRole = typeof AGENTS[number]["role"];

interface Message { id: string; role: "user" | "assistant"; content: string; agentRole?: AgentRole }

interface Session {
  id: string;
  title: string;
  agentRole: AgentRole;
  workroomId?: number;
  messages: Message[];
  createdAt: Date;
}

function createSession(agentRole: AgentRole = "strategis"): Session {
  return { id: Date.now().toString(), title: "Sesi Baru", agentRole, messages: [], createdAt: new Date() };
}

export function ChatConsole() {
  const { data: workrooms = [] } = useListWorkrooms();
  const [sessions, setSessions] = useState<Session[]>(() => [createSession()]);
  const [activeId, setActiveId] = useState<string>(() => sessions[0].id);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const active = sessions.find(s => s.id === activeId) ?? sessions[0];
  const agent = AGENTS.find(a => a.role === active.agentRole)!;
  const Icon = agent.icon;

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [active.messages]);

  const updateSession = (id: string, updater: (s: Session) => Session) => {
    setSessions(prev => prev.map(s => s.id === id ? updater(s) : s));
  };

  const addSession = () => {
    const s = createSession();
    setSessions(prev => [...prev, s]);
    setActiveId(s.id);
    setInput("");
  };

  const deleteSession = (id: string) => {
    if (sessions.length === 1) return;
    setSessions(prev => prev.filter(s => s.id !== id));
    if (activeId === id) setActiveId(sessions.find(s => s.id !== id)!.id);
  };

  async function sendMessage(text: string) {
    if (!text.trim() || streaming) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text };
    const history = [...active.messages, userMsg];
    const assistantId = (Date.now() + 1).toString();

    updateSession(activeId, s => ({
      ...s,
      title: s.messages.length === 0 ? text.slice(0, 40) + (text.length > 40 ? "…" : "") : s.title,
      messages: [...s.messages, userMsg, { id: assistantId, role: "assistant", content: "", agentRole: active.agentRole }],
    }));
    setInput("");
    setStreaming(true);

    const workroom = workrooms.find(w => w.id === active.workroomId);

    try {
      const response = await fetch("/api/agent/invoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentRole: active.agentRole,
          messages: history.map(m => ({ role: m.role, content: m.content })),
          context: workroom ? { workroomName: workroom.name, stageName: workroom.currentStageName, objective: workroom.objective } : {},
        }),
      });

      if (!response.ok || !response.body) throw new Error("API error");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value).split("\n")) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.content) {
              full += data.content;
              updateSession(activeId, s => ({ ...s, messages: s.messages.map(m => m.id === assistantId ? { ...m, content: full } : m) }));
            }
          } catch { /* skip */ }
        }
      }
    } catch {
      updateSession(activeId, s => ({ ...s, messages: s.messages.map(m => m.id === assistantId ? { ...m, content: "⚠️ Gagal mendapatkan respons." } : m) }));
    } finally {
      setStreaming(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Sidebar sessions */}
      <div className="w-56 shrink-0 flex flex-col gap-2">
        <Button size="sm" variant="outline" className="gap-1.5 w-full" onClick={addSession}>
          <Plus className="w-3.5 h-3.5" /> Sesi Baru
        </Button>

        <div className="flex-1 overflow-y-auto space-y-1">
          {sessions.map(s => {
            const a = AGENTS.find(ag => ag.role === s.agentRole)!;
            const A = a.icon;
            return (
              <button
                key={s.id}
                onClick={() => setActiveId(s.id)}
                className={cn(
                  "w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-colors group",
                  activeId === s.id ? "bg-accent" : "hover:bg-muted/50"
                )}
              >
                <A className={cn("w-3.5 h-3.5 shrink-0", a.color)} />
                <span className="text-xs truncate flex-1">{s.title}</span>
                {sessions.length > 1 && (
                  <button
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                    onClick={e => { e.stopPropagation(); deleteSession(s.id); }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <Separator orientation="vertical" />

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Config bar */}
        <div className="flex items-center gap-3 pb-3 border-b border-border mb-3">
          <Select value={active.agentRole} onValueChange={v => updateSession(activeId, s => ({ ...s, agentRole: v as AgentRole, messages: [] }))}>
            <SelectTrigger className="w-44 h-8 text-xs">
              <div className="flex items-center gap-1.5">
                <Icon className={cn("w-3.5 h-3.5", agent.color)} />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              {AGENTS.map(a => {
                const AI = a.icon;
                return (
                  <SelectItem key={a.role} value={a.role}>
                    <div className="flex items-center gap-2"><AI className={cn("w-3.5 h-3.5", a.color)} />{a.name}</div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          <Select value={active.workroomId ? String(active.workroomId) : "none"} onValueChange={v => updateSession(activeId, s => ({ ...s, workroomId: v === "none" ? undefined : Number(v) }))}>
            <SelectTrigger className="w-52 h-8 text-xs">
              <SelectValue placeholder="Pilih Workroom (opsional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— Tanpa Workroom —</SelectItem>
              {workrooms.map(w => <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>)}
            </SelectContent>
          </Select>

          {active.workroomId && (
            <Badge variant="outline" className="text-[10px] h-6">
              {workrooms.find(w => w.id === active.workroomId)?.currentStageName}
            </Badge>
          )}

          {active.messages.length > 0 && (
            <Button variant="ghost" size="sm" className="ml-auto text-xs h-7" onClick={() => updateSession(activeId, s => ({ ...s, messages: [] }))}>
              Bersihkan
            </Button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {active.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-4", agent.bg)}>
                <Icon className={cn("w-8 h-8", agent.color)} />
              </div>
              <p className="text-base font-semibold mb-1">{agent.name}</p>
              <p className="text-sm text-muted-foreground max-w-sm">
                Chat Console — percakapan AI global lintas workroom. Pilih agen dan mulai berkolaborasi.
              </p>
              {active.workroomId && (
                <Badge variant="outline" className="mt-3 text-xs">
                  Konteks: {workrooms.find(w => w.id === active.workroomId)?.name}
                </Badge>
              )}
            </div>
          ) : (
            active.messages.map(msg => {
              const msgAgent = AGENTS.find(a => a.role === msg.agentRole);
              const MsgIcon = msgAgent?.icon ?? Bot;
              return (
                <div key={msg.id} className={cn("flex gap-3", msg.role === "user" && "flex-row-reverse")}>
                  {msg.role === "assistant" && (
                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5", msgAgent?.bg ?? "bg-muted")}>
                      <MsgIcon className={cn("w-4 h-4", msgAgent?.color ?? "text-muted-foreground")} />
                    </div>
                  )}
                  <div className={cn("max-w-[80%] rounded-xl px-4 py-3 text-sm", msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted/60 border border-border/50")}>
                    <div className="whitespace-pre-wrap leading-relaxed">
                      {msg.content}
                      {msg.role === "assistant" && streaming && msg === active.messages[active.messages.length - 1] && (
                        <span className="inline-block w-1.5 h-4 bg-primary/60 ml-1 animate-pulse align-middle" />
                      )}
                    </div>
                    {msg.role === "assistant" && msg.content && !streaming && (
                      <button onClick={() => { navigator.clipboard.writeText(msg.content); toast({ title: "Disalin ✓" }); }} className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground">
                        <Copy className="w-2.5 h-2.5" /> Salin
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="flex gap-2 mt-3 pt-3 border-t border-border">
          <Textarea
            rows={2}
            placeholder={`Tanya ${agent.name}…`}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
            className="resize-none text-sm"
            disabled={streaming}
          />
          <Button size="icon" className="shrink-0 self-end" disabled={!input.trim() || streaming} onClick={() => sendMessage(input)}>
            {streaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
