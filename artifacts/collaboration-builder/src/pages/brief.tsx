import { useState, useRef } from "react";
import { useListWorkrooms, useCreateDeliverable, getListDeliverablesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Megaphone, Sparkles, Square, Copy, Download, Save,
  Loader2, RefreshCw, ChevronDown, Search, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

function BriefLine({ text, streaming, isLast }: { text: string; streaming: boolean; isLast: boolean }) {
  if (text.startsWith("# ")) {
    return <h1 className="text-xl font-bold mt-6 mb-2 first:mt-0 text-foreground">{text.slice(2)}</h1>;
  }
  if (text.startsWith("## ")) {
    return <h2 className="text-base font-semibold mt-5 mb-1.5 text-foreground">{text.slice(3)}</h2>;
  }
  if (text.startsWith("### ")) {
    return <h3 className="text-sm font-semibold mt-3 mb-1 text-foreground/90">{text.slice(4)}</h3>;
  }
  if (text.startsWith("- ") || text.startsWith("* ")) {
    return (
      <li className="text-sm text-muted-foreground ml-4 list-disc leading-relaxed">{text.slice(2)}</li>
    );
  }
  if (text.trim() === "---") return <hr className="border-border/50 my-4" />;
  if (text.trim() === "") return <div className="h-1.5" />;
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

export default function BriefPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const createDeliverable = useCreateDeliverable();
  const { data: workrooms = [], isLoading: loadingWorkrooms } = useListWorkrooms();

  const abortRef = useRef<AbortController | null>(null);

  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [additionalContext, setAdditionalContext] = useState("");
  const [content, setContent] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [saving, setSaving] = useState(false);

  const selected = workrooms.find(w => w.id === selectedId);

  const filteredWorkrooms = workrooms.filter(w =>
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    (w.objective ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const STATUS_COLOR: Record<string, string> = {
    active: "text-blue-400 border-blue-500/30",
    completed: "text-green-400 border-green-500/30",
    draft: "text-muted-foreground border-border",
    archived: "text-muted-foreground border-border",
  };

  const generate = async () => {
    if (!selectedId) {
      toast({ title: "Pilih workroom terlebih dahulu", variant: "destructive" });
      return;
    }

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
      const res = await fetch(`/api/workrooms/${selectedId}/brief`, {
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

  const reset = () => {
    setContent("");
    setGenerated(false);
    setAdditionalContext("");
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
    a.download = `marketing-brief-${selected?.name?.toLowerCase().replace(/\s+/g, "-") ?? selectedId}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const saveAsDeliverable = async () => {
    if (!content || !generated || !selectedId) return;
    setSaving(true);
    try {
      await createDeliverable.mutateAsync({
        workroomId: selectedId,
        data: {
          title: `Marketing Brief — ${selected?.name ?? "Workroom"}`,
          content,
          format: "document",
          status: "draft",
        },
      });
      await qc.invalidateQueries({ queryKey: getListDeliverablesQueryKey(selectedId) });
      toast({
        title: "Tersimpan sebagai Deliverable ✓",
        description: "Buka tab Deliverables di workroom untuk melihatnya.",
      });
    } catch {
      toast({ title: "Gagal menyimpan", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Megaphone className="w-5 h-5 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Sistem Agen AI
            </span>
          </div>
          <h1 className="text-2xl font-bold">Brief Marketing</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Pilih workroom, generate marketing brief lengkap dengan satu klik — positioning, audiens, USP, channel, dan KPI.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-xl border border-border bg-card/50 p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">1. Pilih Workroom</p>

            <div className="relative">
              <button
                className={cn(
                  "w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border text-sm text-left transition-colors",
                  selected
                    ? "border-primary/40 bg-primary/5 text-foreground"
                    : "border-border bg-background text-muted-foreground hover:border-border/80"
                )}
                onClick={() => setPickerOpen(o => !o)}
              >
                <span className="truncate">{selected ? selected.name : "Pilih workroom…"}</span>
                <ChevronDown className={cn("w-4 h-4 shrink-0 transition-transform", pickerOpen && "rotate-180")} />
              </button>

              {pickerOpen && (
                <div className="absolute z-10 top-full mt-1 w-full bg-popover border border-border rounded-lg shadow-xl overflow-hidden">
                  <div className="p-2 border-b border-border/50">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                      <Input
                        className="pl-8 h-8 text-xs"
                        placeholder="Cari workroom…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="max-h-52 overflow-y-auto">
                    {loadingWorkrooms ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      </div>
                    ) : filteredWorkrooms.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-6">Tidak ada workroom ditemukan</p>
                    ) : (
                      filteredWorkrooms.map(w => (
                        <button
                          key={w.id}
                          className={cn(
                            "w-full flex items-start gap-2 px-3 py-2 text-left hover:bg-accent transition-colors",
                            w.id === selectedId && "bg-primary/5"
                          )}
                          onClick={() => {
                            setSelectedId(w.id);
                            setPickerOpen(false);
                            setSearch("");
                            reset();
                          }}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{w.name}</p>
                            {w.objective && (
                              <p className="text-[11px] text-muted-foreground truncate">{w.objective}</p>
                            )}
                          </div>
                          <Badge
                            variant="outline"
                            className={cn("text-[9px] shrink-0 h-4 mt-0.5", STATUS_COLOR[w.status] ?? STATUS_COLOR.draft)}
                          >
                            {w.status}
                          </Badge>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {selected && (
              <div className="rounded-lg bg-muted/30 border border-border/50 px-3 py-2 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-muted-foreground">Workroom terpilih</span>
                  <Badge
                    variant="outline"
                    className={cn("text-[9px] h-4", STATUS_COLOR[selected.status] ?? STATUS_COLOR.draft)}
                  >
                    {selected.status}
                  </Badge>
                </div>
                <p className="text-sm font-semibold truncate">{selected.name}</p>
                {selected.objective && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{selected.objective}</p>
                )}
                <p className="text-[10px] text-muted-foreground">Progress: {selected.progress ?? 0}%</p>
                <Link href={`/workrooms/${selected.id}`}>
                  <span className="text-[10px] text-primary hover:underline flex items-center gap-1 mt-1 cursor-pointer">
                    Buka workroom <ArrowRight className="w-2.5 h-2.5" />
                  </span>
                </Link>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card/50 p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">2. Konteks Tambahan</p>
            <Textarea
              className="resize-none text-xs min-h-[80px]"
              placeholder="Tambahkan info spesifik:&#10;- Target revenue&#10;- Kompetitor yang perlu dihindari&#10;- Gaya komunikasi brand&#10;- USP yang sudah diidentifikasi"
              value={additionalContext}
              onChange={e => setAdditionalContext(e.target.value)}
              rows={4}
              disabled={streaming}
            />
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              AI otomatis membaca Otak Proyek, Knowledge Base, stages, tasks, dan deliverables.
              Kolom ini hanya untuk info tambahan yang tidak ada di workroom.
            </p>
          </div>

          <div className="space-y-2">
            {streaming ? (
              <Button variant="destructive" className="w-full gap-1.5" onClick={generate}>
                <Square className="w-4 h-4" /> Stop Generation
              </Button>
            ) : generated ? (
              <Button className="w-full gap-1.5" variant="outline" onClick={generate}>
                <RefreshCw className="w-4 h-4" /> Generate Ulang
              </Button>
            ) : (
              <Button
                className="w-full gap-1.5"
                onClick={generate}
                disabled={!selectedId || loadingWorkrooms}
              >
                <Sparkles className="w-4 h-4" /> Generate Brief Sekarang
              </Button>
            )}

            {generated && !streaming && (
              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={copyBrief}>
                  <Copy className="w-3 h-3" /> Salin
                </Button>
                <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={downloadBrief}>
                  <Download className="w-3 h-3" /> Download
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 text-xs"
                  onClick={saveAsDeliverable}
                  disabled={saving}
                >
                  {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                  Simpan
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          {(content || streaming) ? (
            <div className="rounded-xl border border-border bg-card/40 overflow-hidden h-full">
              <div className={cn(
                "flex items-center justify-between px-4 py-3 border-b border-border/50 sticky top-0 z-10",
                streaming ? "bg-primary/5" : "bg-card/80 backdrop-blur"
              )}>
                <div className="flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold">Marketing Brief</span>
                  {selected && (
                    <span className="text-xs text-muted-foreground hidden sm:inline">— {selected.name}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {streaming ? (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Generating…
                    </div>
                  ) : (
                    <Badge variant="secondary" className="text-[9px] h-4 bg-green-500/10 text-green-400">
                      Selesai
                    </Badge>
                  )}
                </div>
              </div>
              <div className="px-6 py-5 overflow-y-auto space-y-0.5" style={{ maxHeight: "calc(100vh - 280px)" }}>
                <BriefRenderer text={content} streaming={streaming} />
              </div>
              {generated && !streaming && (
                <div className="flex items-center gap-2 px-4 py-3 border-t border-border/50 bg-muted/20 flex-wrap">
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
                  <span className="ml-auto text-[10px] text-muted-foreground hidden sm:inline">
                    AI-generated · verifikasi sebelum digunakan
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border/60 h-full min-h-[400px] flex flex-col items-center justify-center text-center gap-4 p-8 text-muted-foreground">
              <div className="w-16 h-16 rounded-2xl bg-primary/5 border border-primary/20 flex items-center justify-center text-3xl">
                📣
              </div>
              <div className="space-y-1.5 max-w-sm">
                <p className="text-base font-semibold text-foreground">Marketing Brief AI</p>
                <p className="text-sm">
                  Pilih workroom di sebelah kiri, lalu klik{" "}
                  <strong className="text-foreground">Generate Brief</strong> untuk menghasilkan
                  brief marketing lengkap yang siap dieksekusi tim kreatif.
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] mt-2">
                {["📌 Positioning", "👥 Target Audiens", "🎯 USP", "📡 Channel Mix", "📊 KPI", "🗓️ Timeline", "💬 Key Messages", "✅ Proof Points"].map(item => (
                  <div
                    key={item}
                    className="px-2 py-1.5 rounded-lg border border-border/50 bg-muted/20 text-muted-foreground"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
