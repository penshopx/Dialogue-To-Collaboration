import { useState, useRef } from "react";
import { FileText, Sparkles, Copy, Download, Loader2, RefreshCw, Users, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const SUMMARY_TYPES = [
  {
    id: "executive",
    label: "Executive Summary",
    icon: "📊",
    desc: "Ringkasan komprehensif untuk leadership — progress, risiko, next steps, health score",
  },
  {
    id: "retrospective",
    label: "Retrospektif",
    icon: "🔍",
    desc: "Evaluasi apa yang berjalan baik, apa yang perlu diperbaiki, pembelajaran kunci",
  },
  {
    id: "stakeholder",
    label: "Laporan Stakeholder",
    icon: "👥",
    desc: "Bahasa non-teknis untuk klien atau leadership — progress, hasil, dan apa yang dibutuhkan",
  },
] as const;

type SummaryType = typeof SUMMARY_TYPES[number]["id"];

interface Props { workroomId: number }

export function SummaryTab({ workroomId }: Props) {
  const [summaryType, setSummaryType] = useState<SummaryType>("executive");
  const [content, setContent] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [generated, setGenerated] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const { toast } = useToast();

  const generate = async () => {
    if (streaming) return;
    setContent("");
    setGenerated(false);
    setStreaming(true);
    abortRef.current = new AbortController();

    try {
      const res = await fetch(`/api/workrooms/${workroomId}/summarize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summaryType }),
        signal: abortRef.current.signal,
      });

      if (!res.body) throw new Error("No stream");
      const reader = res.body.getReader();
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
              setContent(full);
            }
            if (data.done) setGenerated(true);
          } catch { /* skip */ }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setContent("⚠️ Gagal menghasilkan rangkuman. Coba lagi.");
        toast({ title: "Error", description: "Gagal generate rangkuman", variant: "destructive" });
      }
    } finally {
      setStreaming(false);
      setGenerated(true);
    }
  };

  const stop = () => { abortRef.current?.abort(); setStreaming(false); setGenerated(true); };

  const copyContent = () => { navigator.clipboard.writeText(content); toast({ title: "Disalin ke clipboard ✓" }); };

  const downloadContent = () => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rangkuman-${summaryType}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500/20 to-blue-500/20 border border-green-400/20 flex items-center justify-center">
          <FileText className="w-4 h-4 text-green-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">Rangkuman AI</h3>
          <p className="text-xs text-muted-foreground">Generate laporan otomatis dari seluruh data workroom</p>
        </div>
      </div>

      {/* Type selector */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tipe Rangkuman</p>
        <div className="grid grid-cols-1 gap-2">
          {SUMMARY_TYPES.map(type => (
            <button
              key={type.id}
              onClick={() => { setSummaryType(type.id); if (generated) { setContent(""); setGenerated(false); } }}
              className={cn(
                "flex items-start gap-3 p-3 rounded-xl border text-left transition-all",
                summaryType === type.id
                  ? "bg-primary/5 border-primary/30 ring-1 ring-primary/20"
                  : "border-border/50 hover:bg-muted/40 hover:border-border"
              )}
            >
              <span className="text-xl mt-0.5">{type.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{type.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{type.desc}</p>
              </div>
              {summaryType === type.id && <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />}
            </button>
          ))}
        </div>
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-2">
        {!streaming ? (
          <Button onClick={generate} className="gap-1.5 flex-1">
            <Sparkles className="w-4 h-4" />
            {generated ? "Generate Ulang" : "Generate Rangkuman"}
          </Button>
        ) : (
          <>
            <Button variant="outline" onClick={stop} className="gap-1.5 flex-1">
              <Loader2 className="w-4 h-4 animate-spin" /> Mengenerate…
            </Button>
            <Button variant="destructive" size="sm" onClick={stop}>Stop</Button>
          </>
        )}
        {generated && content && (
          <>
            <Button variant="outline" size="icon" onClick={copyContent} title="Salin">
              <Copy className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={downloadContent} title="Download .txt">
              <Download className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>

      {/* Context notice */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/30 border border-border/40">
        <Sparkles className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          AI akan membaca <strong>Otak Proyek, pipeline stages, tasks, deliverables, dan knowledge base</strong> secara otomatis sebagai konteks.
        </p>
      </div>

      {/* Output */}
      {content && (
        <div className="rounded-xl border border-border bg-card/40 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border/50 bg-muted/20">
            <div className="flex items-center gap-2">
              <span className="text-sm">{SUMMARY_TYPES.find(t => t.id === summaryType)?.icon}</span>
              <span className="text-xs font-semibold">{SUMMARY_TYPES.find(t => t.id === summaryType)?.label}</span>
              {streaming && <Badge variant="secondary" className="text-[9px] h-4 animate-pulse">Generating…</Badge>}
              {generated && !streaming && <Badge variant="secondary" className="text-[9px] h-4 bg-green-500/10 text-green-400">Selesai</Badge>}
            </div>
          </div>
          <div className="p-4 max-h-[500px] overflow-y-auto">
            <div className="prose prose-sm prose-invert max-w-none">
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
                {content}
                {streaming && <span className="inline-block w-1.5 h-4 bg-primary/60 ml-1 animate-pulse align-middle" />}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!content && !streaming && (
        <div className="text-center py-12 border border-dashed rounded-xl text-muted-foreground">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium mb-1">Belum ada rangkuman</p>
          <p className="text-xs opacity-60">Pilih tipe rangkuman dan klik "Generate Rangkuman"</p>
        </div>
      )}
    </div>
  );
}
