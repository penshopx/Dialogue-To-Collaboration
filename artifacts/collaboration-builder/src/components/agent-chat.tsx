import { useState, useRef, useEffect } from "react";
import { Brain, Shield, Wrench, Star, FileText, CheckSquare, Send, Loader2, Copy, Save, ChevronDown, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const AGENTS = [
  { role: "strategis", name: "Strategis", icon: Brain, color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20", desc: "Framing, prioritas & peta jalan" },
  { role: "skeptis", name: "Skeptis", icon: Shield, color: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/20", desc: "Risiko, asumsi & devil's advocate" },
  { role: "eksekutor", name: "Eksekutor", icon: Wrench, color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20", desc: "Action plan, SOP & checklist" },
  { role: "narasumber", name: "Narasumber", icon: Star, color: "text-green-400", bg: "bg-green-400/10", border: "border-green-400/20", desc: "Domain expertise & best practice" },
  { role: "pack_compiler", name: "DocuGen", icon: FileText, color: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-400/20", desc: "Kompilasi & struktur dokumen" },
  { role: "evaluator", name: "Evaluator", icon: CheckSquare, color: "text-cyan-400", bg: "bg-cyan-400/10", border: "border-cyan-400/20", desc: "Penilaian & quality control" },
] as const;

type AgentRole = typeof AGENTS[number]["role"];

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  agentRole?: AgentRole;
}

const STARTER_PROMPTS: Record<AgentRole, string[]> = {
  strategis: [
    "Apa tujuan strategis yang harus dicapai di stage ini?",
    "Bagaimana stage ini berkontribusi pada objektif akhir workroom?",
    "Apa prioritas utama yang harus diselesaikan minggu ini?",
  ],
  skeptis: [
    "Apa asumsi terbesar yang belum divalidasi?",
    "Apa risiko tersembunyi yang paling berbahaya di stage ini?",
    "Jika pendekatan ini gagal, apa penyebab paling mungkin?",
  ],
  eksekutor: [
    "Buat checklist langkah konkret untuk menyelesaikan stage ini",
    "Berapa estimasi waktu realistis untuk setiap task?",
    "Apa yang bisa dikerjakan dalam 24 jam ke depan?",
  ],
  narasumber: [
    "Apa best practice industri untuk situasi seperti ini?",
    "Standar atau regulasi apa yang perlu diperhatikan?",
    "Berikan contoh kasus serupa yang berhasil",
  ],
  pack_compiler: [
    "Buat ringkasan eksekutif dari progress stage ini",
    "Struktur dokumen seperti apa yang paling tepat untuk output ini?",
    "Apa yang perlu didokumentasikan sebelum melanjutkan ke stage berikutnya?",
  ],
  evaluator: [
    "Bagaimana cara mengukur keberhasilan stage ini?",
    "Apa kriteria kualitas yang harus terpenuhi?",
    "Review output yang ada: apa yang sudah baik dan apa yang perlu diperbaiki?",
  ],
};

interface Props {
  workroomName: string;
  stageName: string;
  objective?: string | null;
  stageNotes?: string | null;
  onSaveToNotes?: (text: string) => void;
}

export function AgentChat({ workroomName, stageName, objective, stageNotes, onSaveToNotes }: Props) {
  const [selectedAgent, setSelectedAgent] = useState<AgentRole>("strategis");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [showAgentPicker, setShowAgentPicker] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const agent = AGENTS.find(a => a.role === selectedAgent)!;
  const Icon = agent.icon;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text: string) {
    if (!text.trim() || streaming) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setStreaming(true);

    const assistantId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: assistantId, role: "assistant", content: "", agentRole: selectedAgent }]);

    try {
      const response = await fetch("/api/agent/invoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentRole: selectedAgent,
          messages: history.map(m => ({ role: m.role, content: m.content })),
          context: { workroomName, stageName, objective, stageNotes },
        }),
      });

      if (!response.ok || !response.body) throw new Error("API error");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.content) {
              full += data.content;
              setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: full } : m));
            }
            if (data.done || data.error) break;
          } catch { /* skip malformed */ }
        }
      }
    } catch (err) {
      setMessages(prev => prev.map(m =>
        m.id === assistantId ? { ...m, content: "⚠️ Gagal mendapatkan respons. Periksa koneksi dan coba lagi." } : m
      ));
    } finally {
      setStreaming(false);
    }
  }

  function copyMessage(content: string) {
    navigator.clipboard.writeText(content);
    toast({ title: "Disalin ke clipboard ✓" });
  }

  const lastAssistantMsg = [...messages].reverse().find(m => m.role === "assistant");

  return (
    <div className="flex flex-col h-[500px]">
      {/* Agent selector */}
      <div className="mb-3">
        <button
          onClick={() => setShowAgentPicker(!showAgentPicker)}
          className={cn("w-full flex items-center gap-3 p-3 rounded-lg border transition-colors", agent.border, agent.bg)}
        >
          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", agent.bg)}>
            <Icon className={cn("w-4 h-4", agent.color)} />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-semibold">{agent.name}</p>
            <p className="text-xs text-muted-foreground">{agent.desc}</p>
          </div>
          <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", showAgentPicker && "rotate-180")} />
        </button>

        {showAgentPicker && (
          <div className="mt-1 grid grid-cols-2 sm:grid-cols-3 gap-1.5 p-2 rounded-lg border border-border bg-card">
            {AGENTS.map(a => {
              const AIcon = a.icon;
              return (
                <button
                  key={a.role}
                  onClick={() => { setSelectedAgent(a.role); setShowAgentPicker(false); setMessages([]); }}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-md text-left transition-colors border text-xs",
                    selectedAgent === a.role ? cn(a.bg, a.border) : "border-transparent hover:bg-muted"
                  )}
                >
                  <AIcon className={cn("w-3.5 h-3.5 shrink-0", a.color)} />
                  <span className="font-medium truncate">{a.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1">
        {messages.length === 0 ? (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground text-center py-2">Tanyakan kepada {agent.name} tentang stage ini</p>
            {STARTER_PROMPTS[selectedAgent].map((prompt, i) => (
              <button
                key={i}
                onClick={() => sendMessage(prompt)}
                className="w-full text-left text-xs p-2.5 rounded-lg border border-border hover:border-primary/30 hover:bg-accent/50 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        ) : (
          messages.map(msg => {
            const msgAgent = AGENTS.find(a => a.role === msg.agentRole);
            const MsgIcon = msgAgent?.icon ?? Bot;
            return (
              <div key={msg.id} className={cn("flex gap-2.5", msg.role === "user" && "flex-row-reverse")}>
                {msg.role === "assistant" && (
                  <div className={cn("w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5", msgAgent?.bg ?? "bg-muted")}>
                    <MsgIcon className={cn("w-3.5 h-3.5", msgAgent?.color ?? "text-muted-foreground")} />
                  </div>
                )}
                <div className={cn(
                  "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground ml-auto"
                    : "bg-muted/60 border border-border/50"
                )}>
                  <div className="whitespace-pre-wrap leading-relaxed">{msg.content}
                    {msg.role === "assistant" && streaming && msg.id === messages[messages.length - 1]?.id && (
                      <span className="inline-block w-1.5 h-4 bg-primary/60 ml-1 animate-pulse align-middle" />
                    )}
                  </div>
                  {msg.role === "assistant" && msg.content && !streaming && (
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/30">
                      <button onClick={() => copyMessage(msg.content)} className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground">
                        <Copy className="w-2.5 h-2.5" /> Salin
                      </button>
                      {onSaveToNotes && (
                        <button onClick={() => { onSaveToNotes(msg.content); toast({ title: "Disimpan ke Notes stage ✓" }); }} className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground">
                          <Save className="w-2.5 h-2.5" /> Simpan ke Notes
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 mt-auto">
        <Textarea
          rows={2}
          placeholder={`Tanya ${agent.name}…`}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
          className="resize-none text-sm"
          disabled={streaming}
        />
        <Button
          size="icon"
          className={cn("shrink-0 self-end", agent.bg, agent.color, "border", agent.border)}
          disabled={!input.trim() || streaming}
          onClick={() => sendMessage(input)}
        >
          {streaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>

      {messages.length > 0 && !streaming && (
        <button onClick={() => setMessages([])} className="mt-1.5 text-[10px] text-muted-foreground hover:text-foreground text-center w-full">
          Bersihkan percakapan
        </button>
      )}
    </div>
  );
}
