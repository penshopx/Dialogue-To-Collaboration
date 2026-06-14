import { useState, useRef } from "react";
import { FileText, Loader2, Copy, RefreshCw, Sparkles, BookMarked } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useUpdateWorkroomBrain, useGetWorkroomBrain, getGetWorkroomBrainQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface Props {
  workroomId: number;
  workroomName?: string;
}

function InlineText({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  const regex = /\*\*(.+?)\*\*|\*(.+?)\*/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(<span key={i++}>{text.slice(last, match.index)}</span>);
    }
    if (match[1] !== undefined) {
      parts.push(<strong key={i++}>{match[1]}</strong>);
    } else if (match[2] !== undefined) {
      parts.push(<em key={i++}>{match[2]}</em>);
    }
    last = regex.lastIndex;
  }
  if (last < text.length) {
    parts.push(<span key={i++}>{text.slice(last)}</span>);
  }
  return <>{parts}</>;
}

function SummaryRenderer({ text, streaming }: { text: string; streaming: boolean }) {
  const lines = text.split("\n");
  const nodes: React.ReactNode[] = [];

  lines.forEach((line, i) => {
    const key = i;
    if (line.startsWith("### ")) {
      nodes.push(
        <h3 key={key} className="text-sm font-bold mt-4 mb-1.5 text-foreground first:mt-0">
          {line.slice(4)}
        </h3>
      );
    } else if (line.startsWith("## ")) {
      nodes.push(
        <h2 key={key} className="text-base font-bold mt-5 mb-2 text-foreground first:mt-0">
          {line.slice(3)}
        </h2>
      );
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      nodes.push(
        <li key={key} className="text-sm text-muted-foreground ml-4 list-disc leading-relaxed">
          <InlineText text={line.slice(2)} />
        </li>
      );
    } else if (line.trim() === "") {
      nodes.push(<div key={key} className="h-1" />);
    } else {
      const isLast = i === lines.length - 1;
      nodes.push(
        <p key={key} className="text-sm text-muted-foreground leading-relaxed">
          <InlineText text={line} />
          {isLast && streaming && (
            <span className="inline-block w-1.5 h-4 bg-purple-400/70 ml-0.5 animate-pulse align-middle rounded-sm" />
          )}
        </p>
      );
    }
  });

  return <>{nodes}</>;
}

export function RangkumanTab({ workroomId, workroomName }: Props) {
  const [summary, setSummary] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [saving, setSaving] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const { toast } = useToast();
  const qc = useQueryClient();
  const updateBrain = useUpdateWorkroomBrain();
  const { data: brain } = useGetWorkroomBrain(workroomId);

  async function generate() {
    if (streaming) {
      abortRef.current?.abort();
      return;
    }

    setSummary("");
    setGenerated(false);
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch(`/api/workrooms/${workroomId}/summarize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`API error: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let full = "";
      let carry = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const rawChunk = carry + decoder.decode(value, { stream: true });
        const lines = rawChunk.split("\n");
        carry = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6)) as { content?: string; done?: boolean; error?: string };
            if (data.error) throw new Error(data.error);
            if (data.content) {
              full += data.content;
              setSummary(full);
            }
            if (data.done) break;
          } catch (parseErr) {
            if (parseErr instanceof SyntaxError) continue;
            throw parseErr;
          }
        }
      }

      setGenerated(true);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        setGenerated(summary.length > 0);
        return;
      }
      const msg = err instanceof Error ? err.message : "Gagal menghubungi AI";
      toast({ title: "⚠️ Gagal generate rangkuman", description: msg, variant: "destructive" });
    } finally {
      setStreaming(false);
    }
  }

  function copy() {
    if (!summary) return;
    navigator.clipboard.writeText(summary);
    toast({ title: "Disalin ke clipboard ✓" });
  }

  async function saveToDecisions() {
    if (!summary) return;
    setSaving(true);
    try {
      const timestamp = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
      const existing = brain?.decisions ?? "";
      const separator = existing ? "\n\n---\n\n" : "";
      const entry = `**Rangkuman AI — ${timestamp}**\n\n${summary}`;
      const updated = existing + separator + entry;

      await updateBrain.mutateAsync({
        workroomId,
        data: { decisions: updated } as Parameters<typeof updateBrain.mutateAsync>[0]["data"],
      });
      await qc.invalidateQueries({ queryKey: getGetWorkroomBrainQueryKey(workroomId) });
      toast({ title: "Disimpan ke Log Keputusan ✓", description: "Buka tab Otak untuk melihatnya." });
    } catch {
      toast({ title: "Gagal menyimpan", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            Rangkuman AI
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Buat ringkasan eksekutif otomatis dari seluruh data workroom ini — stage, tasks, keputusan, dan Project Brain.
          </p>
        </div>
        <Button
          size="sm"
          onClick={generate}
          disabled={saving}
          className={cn(
            "shrink-0 gap-1.5",
            streaming
              ? "bg-red-600/80 hover:bg-red-700 text-white"
              : "bg-purple-600 hover:bg-purple-700 text-white"
          )}
        >
          {streaming ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Hentikan
            </>
          ) : generated ? (
            <>
              <RefreshCw className="w-3.5 h-3.5" />
              Buat Ulang
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              Generate Rangkuman
            </>
          )}
        </Button>
      </div>

      {!summary && !streaming && (
        <div className="flex flex-col items-center justify-center py-16 border border-dashed rounded-lg text-center gap-3">
          <div className="w-12 h-12 rounded-full bg-purple-400/10 flex items-center justify-center">
            <FileText className="w-6 h-6 text-purple-400 opacity-70" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Belum ada rangkuman</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Klik <strong>Generate Rangkuman</strong> untuk membuat ringkasan eksekutif workroom ini secara otomatis.
            </p>
          </div>
          <p className="text-xs text-muted-foreground/70">
            Mencakup: progress pipeline • pencapaian • blocker • keputusan • langkah selanjutnya
          </p>
        </div>
      )}

      {(summary || streaming) && (
        <div className="rounded-lg border border-border bg-card/50 overflow-hidden">
          <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-border/50 bg-purple-400/5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-xs font-semibold text-purple-400">Rangkuman Eksekutif</span>
              {workroomName && (
                <span className="text-xs text-muted-foreground">— {workroomName}</span>
              )}
            </div>
            {streaming && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Loader2 className="w-3 h-3 animate-spin" />
                Menganalisis…
              </div>
            )}
          </div>

          <div className="px-4 py-4 space-y-0.5">
            <SummaryRenderer text={summary} streaming={streaming} />
          </div>

          {generated && !streaming && (
            <div className="flex items-center gap-2 px-4 py-2.5 border-t border-border/50 bg-muted/20">
              <Button
                size="sm"
                variant="ghost"
                className="gap-1.5 text-xs h-7"
                onClick={copy}
              >
                <Copy className="w-3 h-3" />
                Salin
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="gap-1.5 text-xs h-7"
                onClick={saveToDecisions}
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <BookMarked className="w-3 h-3" />
                )}
                Simpan ke Log Keputusan
              </Button>
              <span className="ml-auto text-[10px] text-muted-foreground">
                AI-generated · selalu verifikasi sebelum dibagikan
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
