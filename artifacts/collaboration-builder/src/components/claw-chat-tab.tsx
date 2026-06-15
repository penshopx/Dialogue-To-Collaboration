import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Send, Loader2, Bot, User, RotateCcw, Zap, MessageSquare, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message { id: string; role: "user" | "assistant"; content: string; streaming?: boolean }

type ClawBundle = {
  config: {
    name: string; model: string; systemPrompt: string;
    greeting: string; isActive: boolean; ragTopK: number;
  } | null;
  quickPrompts: { id: number; label: string; prompt: string }[];
};

function genId() { return Math.random().toString(36).slice(2); }

interface Props { workroomId: number }

export function ClawChatTab({ workroomId }: Props) {
  const BASE = `/api/workrooms/${workroomId}/claw`;

  const { data, isLoading } = useQuery<ClawBundle>({
    queryKey: ["claw-config", workroomId],
    queryFn: () => fetch(BASE).then(r => r.json()),
  });

  const cfg = data?.config;
  const quickPrompts = data?.quickPrompts ?? [];

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const greetingShown = messages.length > 0;

  const send = async (text: string) => {
    if (!text.trim() || streaming) return;
    const userMsg: Message = { id: genId(), role: "user", content: text.trim() };
    const asstId = genId();
    const asstMsg: Message = { id: asstId, role: "assistant", content: "", streaming: true };

    setMessages(prev => [...prev, userMsg, asstMsg]);
    setInput("");
    setStreaming(true);

    abortRef.current = new AbortController();

    const history = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch(`${BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
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
            if (data.content) {
              setMessages(prev => prev.map(m =>
                m.id === asstId ? { ...m, content: m.content + data.content } : m
              ));
            }
            if (data.done || data.error) {
              setMessages(prev => prev.map(m =>
                m.id === asstId ? { ...m, streaming: false } : m
              ));
            }
          } catch { /* skip */ }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setMessages(prev => prev.map(m =>
          m.id === asstId ? { ...m, content: "Gagal mendapat respons. Coba lagi.", streaming: false } : m
        ));
      }
    } finally {
      setStreaming(false);
    }
  };

  const stop = () => {
    abortRef.current?.abort();
    setStreaming(false);
    setMessages(prev => prev.map(m => m.streaming ? { ...m, streaming: false } : m));
  };

  const reset = () => {
    stop();
    setMessages([]);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-[280px]" />
        <Skeleton className="h-[440px] rounded-xl" />
      </div>
    );
  }

  if (!cfg) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center">
          <Bot className="w-6 h-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium">Claw belum dikonfigurasi</p>
        <p className="text-xs text-muted-foreground max-w-xs">Buka tab <strong>🦾 Claw</strong> untuk mengatur System Prompt, model, dan sub-agents terlebih dahulu.</p>
      </div>
    );
  }

  if (!cfg.isActive) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
          <AlertCircle className="w-6 h-6 text-amber-400" />
        </div>
        <p className="text-sm font-medium text-amber-400">{cfg.name} sedang nonaktif</p>
        <p className="text-xs text-muted-foreground max-w-xs">Aktifkan Claw di tab <strong>🦾 Claw → Persona & UX</strong> untuk mulai chatting.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[600px] rounded-xl border border-border overflow-hidden bg-card/20">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-card/40 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-violet-400/20 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-violet-400" />
          </div>
          <div>
            <p className="text-xs font-semibold">{cfg.name}</p>
            <p className="text-[10px] text-muted-foreground">{cfg.model} · RAG top-{cfg.ragTopK}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] gap-1 text-green-400 border-green-400/30">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
            Aktif
          </Badge>
          {messages.length > 0 && (
            <button onClick={reset} className="text-muted-foreground hover:text-foreground transition-colors">
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {/* Greeting */}
        {!greetingShown && cfg.greeting && (
          <div className="flex gap-2.5">
            <div className="w-6 h-6 rounded-full bg-violet-500/20 border border-violet-400/30 flex items-center justify-center shrink-0 mt-0.5">
              <Bot className="w-3 h-3 text-violet-400" />
            </div>
            <div className="bg-card/60 border border-border/40 rounded-2xl rounded-tl-sm px-3.5 py-2.5 max-w-[85%]">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{cfg.greeting}</p>
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map(msg => (
          <div key={msg.id} className={cn("flex gap-2.5", msg.role === "user" && "flex-row-reverse")}>
            <div className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5",
              msg.role === "user"
                ? "bg-primary/20 border border-primary/30"
                : "bg-violet-500/20 border border-violet-400/30"
            )}>
              {msg.role === "user"
                ? <User className="w-3 h-3 text-primary" />
                : <Bot className="w-3 h-3 text-violet-400" />
              }
            </div>
            <div className={cn(
              "rounded-2xl px-3.5 py-2.5 max-w-[85%] text-sm leading-relaxed",
              msg.role === "user"
                ? "bg-primary/15 border border-primary/20 rounded-tr-sm text-right"
                : "bg-card/60 border border-border/40 rounded-tl-sm"
            )}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
              {msg.streaming && (
                <span className="inline-block w-1 h-3.5 bg-violet-400 ml-0.5 animate-pulse align-middle rounded-sm" />
              )}
            </div>
          </div>
        ))}

        {/* Empty state with quick prompts */}
        {!greetingShown && !cfg.greeting && quickPrompts.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-8 space-y-2">
            <MessageSquare className="w-8 h-8 text-muted-foreground/30" />
            <p className="text-xs text-muted-foreground">Ketik pesan untuk memulai percakapan</p>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Quick prompts */}
      {!greetingShown && quickPrompts.length > 0 && (
        <div className="px-4 pb-2 flex flex-wrap gap-1.5 shrink-0">
          {quickPrompts.slice(0, 6).map(qp => (
            <button
              key={qp.id}
              onClick={() => send(qp.prompt)}
              disabled={streaming}
              className="text-xs px-2.5 py-1.5 rounded-full border border-border hover:border-violet-400/40 hover:bg-violet-500/5 hover:text-violet-400 transition-all text-muted-foreground disabled:opacity-50"
            >
              {qp.label}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-border bg-card/20 shrink-0">
        <div className="flex gap-2 items-end">
          <Textarea
            rows={1}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder="Tanya sesuatu… (Enter = kirim, Shift+Enter = baris baru)"
            className="resize-none text-sm min-h-[38px] max-h-[120px] overflow-y-auto"
            disabled={streaming}
          />
          {streaming ? (
            <Button size="sm" variant="destructive" onClick={stop} className="shrink-0 h-9">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            </Button>
          ) : (
            <Button size="sm" onClick={() => send(input)} disabled={!input.trim()} className="shrink-0 h-9 gap-1.5">
              <Send className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground mt-1 text-center">
          Powered by {cfg.model} · {cfg.systemPrompt ? `System prompt: ${cfg.systemPrompt.slice(0, 40)}…` : "No system prompt set"}
        </p>
      </div>
    </div>
  );
}
