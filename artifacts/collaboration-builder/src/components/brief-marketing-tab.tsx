import { useState, useRef } from "react";
import { useCreateDeliverable, getListDeliverablesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Megaphone, Sparkles, Square, Copy, Download, Save,
  Loader2, RefreshCw, BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

function BriefLine({ text, streaming, isLast }: { text: string; streaming: boolean; isLast: boolean }) {
  if (text.startsWith("# ")) {
    return <h1 className="text-lg font-bold mt-5 mb-2 first:mt-0 text-foreground">{text.slice(2)}</h1>;
  }
  if (text.startsWith("## ")) {
    return <h2 className="text-base font-semibold mt-4 mb-1.5 text-foreground">{text.slice(3)}</h2>;
  }
  if (text.startsWith("### ")) {
    return <h3 className="text-sm font-semibold mt-3 mb-1 text-foreground/90">{text.slice(4)}</h3>;
  }
  if (text.startsWith("- ") || text.startsWith("* ")) {
    return (
      <li className="text-sm text-muted-foreground ml-4 list-disc leading-relaxed">
        {text.slice(2)}
      </li>
    );
  }
  if (text.trim() === "---") {
    return <hr className="border-border/50 my-3" />;
  }
  if (text.trim() === "") {
    return <div className="h-1" />;
  }
  return (
    <p className="text-sm text-muted-foreground leading-relaxed">
      {text}
      {isLast && streaming && (
        <span className="inline-block w-1.5 h-4 bg-primary/60 ml-0.5 animate-pulse align-middle rounded-sm" />
      )}
    </p>
  );
}

function BriefRenderer({ text, streaming }: { text: string; streaming: boolean }) {
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, i) => (
        <BriefLine key={i} text={line} streaming={streaming} isLast={i === lines.length - 1} />
      ))}
    </>
  );
}

interface Props {
  workroomId: number;
  workroomName?: string;
  objective?: string;
}

export function BriefMarketingTab({ workroomId, workroomName, objective }: Props) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const createDeliverable = useCreateDeliverable();
  const abortRef = useRef<AbortController | null>(null);

  const [content, setContent] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [additionalContext, setAdditionalContext] = useState("");

  const generate = async () => {
    if (streaming) {
      abortRef.current?.abort();
      setStreaming(false);
      setGenerated(content.length > 0);
      return;
    }

    setContent("");
    setGenerated(false);
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(`/api/workrooms/${workroomId}/brief`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ additionalContext }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) throw new Error(`API error: ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";
      let carry = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const raw = carry + decoder.decode(value, { stream: true });
        const lines = raw.split("\n");
        carry = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6)) as { content?: string; done?: boolean; error?: string };
            if (data.error) throw new Error(data.error);
            if (data.content) {
              full += data.content;
              setContent(full);
            }
            if (data.done) setGenerated(true);
          } catch (e) {
            if (e instanceof SyntaxError) continue;
            throw e;
          }
        }
      }

      setGenerated(true);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        setGenerated(content.length > 0);
        return;
      }
      const msg = err instanceof Error ? err.message : "Gagal menghubungi AI";
      toast({ title: "⚠️ Gagal generate brief", description: msg, variant: "destructive" });
    } finally {
      setStreaming(false);
    }
  };

  const copyBrief = () => {
    if (!content) return;
    navigator.clipboard.writeText(content);
    toast({ title: "Brief disalin ✓" });
  };

  const downloadBrief = () => {
    if (!content) return;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `marketing-brief-${workroomName?.toLowerCase().replace(/\s+/g, "-") ?? workroomId}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const saveAsDeliverable = async () => {
    if (!content || !generated) return;
    setSaving(true);
    try {
      await createDeliverable.mutateAsync({
        workroomId,
        data: {
          title: `Marketing Brief — ${workroomName ?? "Workroom"}`,
          content,
          format: "document",
          status: "draft",
        },
      });
      await qc.invalidateQueries({ queryKey: getListDeliverablesQueryKey(workroomId) });
      toast({ title: "Tersimpan sebagai Deliverable ✓", description: "Buka tab Deliverables untuk melihatnya." });
    } catch {
      toast({ title: "Gagal menyimpan", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-primary" />
            Brief Marketing AI
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Generate marketing brief lengkap — positioning, audiens, USP, channel, KPI — dari data workroom ini.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {generated && !streaming && (
            <>
              <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={copyBrief}>
                <Copy className="w-3 h-3" /> Salin
              </Button>
              <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={downloadBrief}>
                <Download className="w-3 h-3" /> Download
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1 text-xs"
                onClick={saveAsDeliverable}
                disabled={saving}
              >
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                Simpan Deliverable
              </Button>
              <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={generate}>
                <RefreshCw className="w-3 h-3" /> Ulang
              </Button>
            </>
          )}

          {streaming ? (
            <Button variant="destructive" size="sm" className="h-7 gap-1 text-xs" onClick={generate}>
              <Square className="w-3 h-3" /> Stop
            </Button>
          ) : !generated ? (
            <Button size="sm" className="h-7 gap-1.5 text-xs" onClick={generate}>
              <Sparkles className="w-3 h-3" /> Generate Brief
            </Button>
          ) : null}
        </div>
      </div>

      <div className="rounded-lg border border-border/50 bg-muted/20 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-medium text-muted-foreground">Konteks tambahan (opsional)</p>
          {objective && (
            <Badge variant="outline" className="text-[9px]">
              <BookOpen className="w-2.5 h-2.5 mr-1" /> Objective tersedia
            </Badge>
          )}
        </div>
        <Textarea
          className="resize-none text-xs min-h-[56px]"
          placeholder="Tambahkan info spesifik: target revenue, kompetitor yang perlu dihindari, gaya komunikasi, USP yang sudah diidentifikasi…"
          value={additionalContext}
          onChange={e => setAdditionalContext(e.target.value)}
          rows={2}
          disabled={streaming}
        />
        <p className="text-[10px] text-muted-foreground">
          AI akan membaca Otak Proyek, Knowledge Base, stages, tasks, dan deliverables secara otomatis.
        </p>
      </div>

      {(content || streaming) ? (
        <div className="rounded-xl border border-border bg-card/40 overflow-hidden">
          <div className={cn(
            "flex items-center justify-between px-4 py-2.5 border-b border-border/50",
            streaming ? "bg-primary/5" : "bg-muted/20"
          )}>
            <div className="flex items-center gap-2">
              <Megaphone className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary">Marketing Brief</span>
              {workroomName && (
                <span className="text-xs text-muted-foreground">— {workroomName}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {streaming && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Generating…
                </div>
              )}
              {generated && !streaming && (
                <Badge variant="secondary" className="text-[9px] h-4 bg-green-500/10 text-green-400">Selesai</Badge>
              )}
            </div>
          </div>
          <div className="px-4 py-4 max-h-[560px] overflow-y-auto space-y-0.5">
            <BriefRenderer text={content} streaming={streaming} />
          </div>

          {generated && !streaming && (
            <div className="flex items-center gap-2 px-4 py-2.5 border-t border-border/50 bg-muted/20 flex-wrap">
              <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={copyBrief}>
                <Copy className="w-3 h-3" /> Salin
              </Button>
              <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={downloadBrief}>
                <Download className="w-3 h-3" /> Download .txt
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 gap-1 text-xs"
                onClick={saveAsDeliverable}
                disabled={saving}
              >
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                Simpan sebagai Deliverable
              </Button>
              <span className="ml-auto text-[10px] text-muted-foreground">
                AI-generated · verifikasi sebelum digunakan
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-14 border border-dashed rounded-xl text-muted-foreground space-y-3">
          <div className="text-4xl">📣</div>
          <div>
            <p className="text-sm font-medium">Generate Marketing Brief dengan Satu Klik</p>
            <p className="text-xs opacity-60 mt-1 max-w-sm mx-auto">
              AI akan menganalisis seluruh data workroom dan menghasilkan brief yang mencakup
              positioning, audiens target, USP, strategi channel, dan KPI.
            </p>
          </div>
          <Button onClick={generate} className="gap-1.5">
            <Sparkles className="w-4 h-4" /> Generate Sekarang
          </Button>
        </div>
      )}
    </div>
  );
}
