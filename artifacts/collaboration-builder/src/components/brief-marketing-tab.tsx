import { useState, useRef } from "react";
import { useListKnowledgeItems, useGetWorkroomBrain } from "@workspace/api-client-react";
import { Megaphone, Play, Square, Copy, Download, ChevronDown, ChevronUp, Loader2, Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

/* ─── Chain config ─── */
const CHAIN = [
  {
    role: "strategis",
    label: "Riset Pasar & Audiens",
    icon: "🔍",
    color: "text-blue-400",
    promptFn: (ctx: string) =>
      `Sebagai ahli riset pasar, analisis pasar dan audiens target dari proyek berikut:\n\n${ctx}\n\n
Output terstruktur:\n
## Target Audiens Primer\n[profil demografis + psikografis + pain points]\n
## Target Audiens Sekunder\n[segmen tambahan]\n
## Lanskap Kompetitif\n[2-3 kompetitor utama, posisi relatif]\n
## Peluang Pasar\n[gap yang bisa dimanfaatkan]\n
## Insight Kunci\n[3 temuan terpenting untuk strategi komunikasi]`,
  },
  {
    role: "eksekutor",
    label: "Strategi & Positioning",
    icon: "🎯",
    color: "text-amber-400",
    promptFn: (ctx: string, prev: string) =>
      `Berdasarkan riset pasar:\n${prev}\n\nKonteks proyek: ${ctx}\n\n
Buat strategi positioning dan pesan kunci:\n
## Unique Value Proposition (UVP)\n[1 kalimat tajam yang membedakan]\n
## Brand Promise\n[komitmen kepada pelanggan]\n
## Key Messages (3-5 pesan utama)\n[pesan yang konsisten di semua channel]\n
## Proof Points\n[bukti konkret yang mendukung klaim]\n
## Tone of Voice\n[karakter komunikasi brand]\n
## Tagline Options (3 alternatif)\n[pendek, memukau, mudah diingat]`,
  },
  {
    role: "sintetis",
    label: "Strategi Konten & Channel",
    icon: "📡",
    color: "text-green-400",
    promptFn: (ctx: string, prev: string) =>
      `Berdasarkan positioning:\n${prev}\n\nKonteks: ${ctx}\n\n
Rancang strategi konten dan distribusi:\n
## Content Pillars (4-5 pilar)\n[tema konten yang konsisten]\n
## Channel Mix & Prioritas\n[channel utama, pendukung, eksperimental + alokasi effort]\n
## Content Calendar Framework\n[frekuensi, format, dan distribusi per channel]\n
## Hero Content Ideas (3 ide besar)\n[konten flagship yang viral-worthy]\n
## CTA Strategy\n[call-to-action utama per stage funnel]`,
  },
  {
    role: "evaluator",
    label: "Brief Kreatif Final",
    icon: "📋",
    color: "text-purple-400",
    promptFn: (ctx: string, prev: string) =>
      `Sintesiskan semua analisis:\n${prev}\n\nKonteks: ${ctx}\n\n
Buat CREATIVE BRIEF lengkap siap dieksekusi tim kreatif:\n
# 📣 CREATIVE BRIEF\n
## Ringkasan Eksekutif\n[1 paragraf — apa yang kita lakukan dan mengapa]\n
## Tujuan Kampanye\n[SMART goals: specific, measurable, achievable, relevant, time-bound]\n
## Target Audiens\n[persona utama dengan nama + quote]\n
## Single-Minded Proposition\n[SATU pesan paling penting]\n
## Mandatories\n[elemen wajib ada / tidak boleh ada]\n
## KPI & Measurement\n[metrik utama dan cara pengukurannya]\n
## Timeline & Budget Framework\n[fase dan alokasi anggaran]\n
## Deliverables yang Dibutuhkan\n[daftar aset yang perlu diproduksi]`,
  },
] as const;

interface StepState { output: string; done: boolean }

interface Props {
  workroomId: number;
  workroomName?: string;
  objective?: string;
}

export function BriefMarketingTab({ workroomId, workroomName, objective }: Props) {
  const { data: kbItems = [] } = useListKnowledgeItems(workroomId);
  const { data: brain } = useGetWorkroomBrain(workroomId);
  const { toast } = useToast();
  const abortRef = useRef<AbortController | null>(null);

  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState<StepState[]>(CHAIN.map(() => ({ output: "", done: false })));
  const [expanded, setExpanded] = useState<number | null>(null);
  const [activeStep, setActiveStep] = useState<number>(-1);
  const [customBrief, setCustomBrief] = useState("");
  const [started, setStarted] = useState(false);

  const buildContext = () => {
    const kbCtx = kbItems.slice(0, 5).map(i => `[${i.title}]: ${i.content.slice(0, 250)}`).join("\n");
    return [
      workroomName ? `Proyek: ${workroomName}` : "",
      objective ? `Objective: ${objective}` : "",
      brain?.context ? `Konteks: ${brain.context}` : "",
      brain?.goals ? `Tujuan: ${brain.goals}` : "",
      brain?.stakeholders ? `Stakeholders: ${brain.stakeholders}` : "",
      kbCtx ? `\nKnowledge Base:\n${kbCtx}` : "",
      customBrief ? `\nInfo Tambahan:\n${customBrief}` : "",
    ].filter(Boolean).join("\n");
  };

  const setStep = (i: number, patch: Partial<StepState>) =>
    setSteps(s => { const next = [...s]; next[i] = { ...next[i], ...patch }; return next; });

  const runChain = async () => {
    setRunning(true);
    setStarted(true);
    setSteps(CHAIN.map(() => ({ output: "", done: false })));
    setExpanded(0);
    setActiveStep(0);
    abortRef.current = new AbortController();

    const ctx = buildContext();
    let prev = "";

    try {
      for (let i = 0; i < CHAIN.length; i++) {
        setActiveStep(i);
        setExpanded(i);
        const step = CHAIN[i];
        const prompt = step.promptFn(ctx, prev);

        const res = await fetch("/api/agent/invoke", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: step.role, prompt, context: ctx }),
          signal: abortRef.current.signal,
        });

        const reader = res.body!.getReader();
        const dec = new TextDecoder();
        let out = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          for (const line of dec.decode(value).split("\n")) {
            if (line.startsWith("data: ")) {
              try { const d = JSON.parse(line.slice(6)); if (d.text) { out += d.text; setStep(i, { output: out }); } } catch { /**/ }
            }
          }
        }
        setStep(i, { output: out, done: true });
        prev = out;
      }
    } catch (e: unknown) {
      if ((e as { name?: string }).name !== "AbortError") {
        toast({ title: "Gagal generate brief", variant: "destructive" });
      }
    } finally {
      setRunning(false);
      setActiveStep(-1);
    }
  };

  const stop = () => { abortRef.current?.abort(); setRunning(false); setActiveStep(-1); };

  const allDone = started && steps.every(s => s.done);

  const copyAll = () => {
    const text = CHAIN.map((c, i) => `## ${c.icon} ${c.label}\n\n${steps[i].output}`).join("\n\n---\n\n");
    navigator.clipboard.writeText(text);
    toast({ title: "Brief disalin ✓" });
  };

  const downloadBrief = () => {
    const text = CHAIN.map((c, i) => `## ${c.icon} ${c.label}\n\n${steps[i].output}`).join("\n\n---\n\n");
    const blob = new Blob([`# Brief Marketing — ${workroomName ?? "Workroom"}\n\n${text}`], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `brief-marketing-${workroomName?.toLowerCase().replace(/\s+/g, "-") ?? "workroom"}.txt`;
    a.click();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">Brief Marketing AI</h3>
          <p className="text-xs text-muted-foreground">— generate marketing brief dari konteks workroom</p>
        </div>
        <div className="flex items-center gap-2">
          {allDone && (
            <>
              <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={copyAll}><Copy className="w-3 h-3" /> Salin</Button>
              <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={downloadBrief}><Download className="w-3 h-3" /> Download</Button>
            </>
          )}
          {started && !running && (
            <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={runChain}><RefreshCw className="w-3 h-3" /> Generate Ulang</Button>
          )}
          {running ? (
            <Button variant="destructive" size="sm" className="h-7 gap-1 text-xs" onClick={stop}><Square className="w-3 h-3" /> Stop</Button>
          ) : !started ? (
            <Button size="sm" className="h-7 gap-1.5 text-xs" onClick={runChain}><Play className="w-3 h-3" /> Generate Brief</Button>
          ) : null}
        </div>
      </div>

      {/* Context card */}
      <div className="rounded-lg border border-border/50 bg-muted/20 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-medium text-muted-foreground">Konteks Brief (opsional tambahan)</p>
          <div className="flex gap-1.5">
            {kbItems.length > 0 && <Badge variant="outline" className="text-[9px]">{kbItems.length} KB articles</Badge>}
            {brain?.goals && <Badge variant="outline" className="text-[9px]">Brain: goals ✓</Badge>}
          </div>
        </div>
        <Textarea
          className="resize-none text-xs min-h-[56px]"
          placeholder="Tambahkan informasi spesifik: target revenue, USP produk, kompetitor yang harus dihindari, gaya komunikasi yang diinginkan…"
          value={customBrief}
          onChange={e => setCustomBrief(e.target.value)}
          rows={2}
        />
      </div>

      {/* Chain pipeline visualization */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {CHAIN.map((step, i) => {
          const isDone = steps[i].done;
          const isActive = activeStep === i;
          return (
            <div key={i} className="flex items-center gap-1 shrink-0">
              <div className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all",
                isDone ? "bg-green-500/10 border-green-500/30 text-green-400" :
                isActive ? "bg-primary/10 border-primary/30 text-primary animate-pulse" :
                "bg-muted/30 border-border/50 text-muted-foreground"
              )}>
                {isActive ? <Loader2 className="w-3 h-3 animate-spin" /> : <span>{step.icon}</span>}
                {step.label}
                {isDone && <span className="text-green-400">✓</span>}
              </div>
              {i < CHAIN.length - 1 && <span className="text-muted-foreground text-xs">→</span>}
            </div>
          );
        })}
      </div>

      {/* Step outputs */}
      {started && (
        <div className="space-y-2">
          {CHAIN.map((step, i) => {
            const s = steps[i];
            const isActive = activeStep === i;
            const isOpen = expanded === i;
            if (!s.output && !isActive) return null;
            return (
              <div key={i} className={cn("rounded-xl border overflow-hidden transition-all", s.done ? "border-green-500/20" : isActive ? "border-primary/30" : "border-border/50")}>
                <button
                  className="flex items-center gap-2 w-full text-left px-3 py-2.5 hover:bg-muted/20 transition-colors"
                  onClick={() => setExpanded(isOpen ? null : i)}
                >
                  <span className="text-base">{step.icon}</span>
                  <span className={cn("text-xs font-semibold flex-1", step.color)}>{step.label}</span>
                  {isActive && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
                  {s.done && <span className="text-[10px] text-green-400">✓ selesai</span>}
                  {s.output && <span className="text-[10px] text-muted-foreground">{s.output.length} chars</span>}
                  {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                </button>
                {isOpen && s.output && (
                  <div className="border-t border-border/40">
                    <div className="flex justify-end px-3 pt-2 pb-1 gap-1.5">
                      <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 px-2" onClick={() => { navigator.clipboard.writeText(s.output); toast({ title: "Disalin ✓" }); }}>
                        <Copy className="w-2.5 h-2.5" /> Salin bagian ini
                      </Button>
                    </div>
                    <div className="px-3 pb-3 max-h-96 overflow-y-auto">
                      <pre className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap font-sans">{s.output}</pre>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Final actions when done */}
          {allDone && (
            <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-green-400">✓ Brief Marketing selesai</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{CHAIN.length} section · siap untuk tim kreatif</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={copyAll}><Copy className="w-3.5 h-3.5" /> Salin Semua</Button>
                  <Button size="sm" className="gap-1.5" onClick={downloadBrief}><Download className="w-3.5 h-3.5" /> Download Brief</Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {CHAIN.map((step, i) => (
                  <button
                    key={i}
                    onClick={() => setExpanded(expanded === i ? null : i)}
                    className={cn("flex items-center gap-2 p-2 rounded-lg border text-left hover:bg-muted/20 transition-colors text-xs", step.color, "border-border/50")}
                  >
                    <span>{step.icon}</span>
                    <span className="font-medium">{step.label}</span>
                    <span className="ml-auto text-[10px] text-muted-foreground">{steps[i].output.length} ch</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!started && (
        <div className="text-center py-12 border border-dashed rounded-xl text-muted-foreground space-y-3">
          <div className="text-4xl">📣</div>
          <div>
            <p className="text-sm font-medium">Generate Brief Marketing AI</p>
            <p className="text-xs opacity-60 mt-1 max-w-sm mx-auto">4-langkah chain: Riset Pasar → Positioning → Konten & Channel → Creative Brief siap eksekusi</p>
          </div>
          <Button onClick={runChain} className="gap-1.5">
            <Sparkles className="w-4 h-4" /> Generate Sekarang
          </Button>
        </div>
      )}
    </div>
  );
}
