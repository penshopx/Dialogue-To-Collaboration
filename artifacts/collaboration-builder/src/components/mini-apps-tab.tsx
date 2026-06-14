import { useState, useRef } from "react";
import { useListKnowledgeItems } from "@workspace/api-client-react";
import { Wrench, Play, Square, Copy, Download, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

/* ───── Mini App Registry ───── */
interface MiniApp {
  id: string;
  icon: string;
  title: string;
  desc: string;
  category: string;
  chain: Array<{ role: string; label: string; promptFn: (ctx: string, prev: string) => string }>;
}

const MINI_APPS: MiniApp[] = [
  {
    id: "checklist",
    icon: "✅",
    title: "Checklist Generator",
    desc: "Hasilkan checklist terstruktur dari konteks proyek",
    category: "Dokumen",
    chain: [
      {
        role: "strategis",
        label: "Analisis Kebutuhan",
        promptFn: (ctx) => `Analisis konteks proyek berikut dan identifikasi semua area yang perlu dicakup dalam checklist:\n\n${ctx}\n\nListkan 5-8 kategori utama beserta justifikasinya.`,
      },
      {
        role: "eksekutor",
        label: "Generate Checklist",
        promptFn: (ctx, prev) => `Berdasarkan analisis:\n${prev}\n\nBuat checklist komprehensif dalam format markdown dengan checkbox (- [ ]) untuk setiap item. Kelompokkan per kategori. Konteks proyek: ${ctx}`,
      },
    ],
  },
  {
    id: "risk_radar",
    icon: "🎯",
    title: "Risk Radar",
    desc: "Identifikasi dan prioritaskan risiko proyek secara otomatis",
    category: "Analisis",
    chain: [
      {
        role: "skeptis",
        label: "Identifikasi Risiko",
        promptFn: (ctx) => `Sebagai risk analyst, identifikasi semua risiko potensial dari proyek berikut:\n\n${ctx}\n\nKategorikan sebagai: Teknis, Operasional, Regulasi, SDM, Finansial, Timeline.`,
      },
      {
        role: "evaluator",
        label: "Scoring & Prioritas",
        promptFn: (_, prev) => `Berdasarkan risiko yang diidentifikasi:\n${prev}\n\nBuat Risk Matrix dengan format tabel markdown:\n| Risiko | Probabilitas (1-5) | Dampak (1-5) | Risk Score | Prioritas | Mitigasi |`,
      },
      {
        role: "eksekutor",
        label: "Rencana Mitigasi",
        promptFn: (ctx, prev) => `Berdasarkan risk matrix:\n${prev}\n\nBuat rencana mitigasi detail untuk 3 risiko tertinggi. Format: Risiko → Tindakan Pencegahan → PIC → Timeline. Konteks: ${ctx}`,
      },
    ],
  },
  {
    id: "decision_summary",
    icon: "⚖️",
    title: "Decision Summary",
    desc: "Dokumentasikan keputusan proyek dengan analisis dampak",
    category: "Dokumen",
    chain: [
      {
        role: "strategis",
        label: "Analisis Opsi",
        promptFn: (ctx) => `Berdasarkan konteks proyek:\n${ctx}\n\nIdentifikasi keputusan kunci yang perlu dibuat. Untuk setiap keputusan, tampilkan minimum 2 opsi dengan pro/kontra.`,
      },
      {
        role: "skeptis",
        label: "Kritik & Validasi",
        promptFn: (_, prev) => `Review analisis berikut dengan kritis:\n${prev}\n\nTantang asumsi yang lemah. Tambahkan risiko tersembunyi. Berikan perspektif alternatif yang mungkin terlewat.`,
      },
      {
        role: "sintetis",
        label: "Decision Summary",
        promptFn: (ctx, prev) => `Sintesiskan diskusi berikut:\n${prev}\n\nBuat Decision Summary resmi dalam format:\n## Keputusan [Nomor]\n**Pilihan:** ...\n**Alasan:** ...\n**Dampak:** ...\n**Risiko:** ...\n**PIC:** ...\n**Tanggal:** ...\n\nKonteks: ${ctx}`,
      },
    ],
  },
  {
    id: "gap_analysis",
    icon: "🔍",
    title: "Gap Analysis",
    desc: "Temukan kesenjangan antara kondisi saat ini dan target",
    category: "Analisis",
    chain: [
      {
        role: "evaluator",
        label: "Peta Kondisi Saat Ini",
        promptFn: (ctx) => `Analisis kondisi saat ini (AS-IS) dari proyek:\n${ctx}\n\nDokumentasikan kapabilitas, proses, dan resource yang tersedia saat ini.`,
      },
      {
        role: "strategis",
        label: "Definisi Target",
        promptFn: (ctx, prev) => `Berdasarkan kondisi AS-IS:\n${prev}\n\nDefinisikan kondisi target (TO-BE) yang ideal untuk proyek:\n${ctx}\n\nGambarkan kapabilitas, proses, dan resource yang dibutuhkan.`,
      },
      {
        role: "sintetis",
        label: "Gap Matrix",
        promptFn: (_, prev) => `Berdasarkan analisis AS-IS dan TO-BE:\n${prev}\n\nBuat Gap Analysis Matrix dalam format tabel markdown:\n| Dimensi | AS-IS | TO-BE | Gap | Prioritas | Rekomendasi |`,
      },
    ],
  },
  {
    id: "project_snapshot",
    icon: "📸",
    title: "Project Snapshot",
    desc: "Ringkasan status proyek satu pandang untuk stakeholder",
    category: "Laporan",
    chain: [
      {
        role: "eksekutor",
        label: "Kompilasi Data",
        promptFn: (ctx) => `Kompilasi semua data relevan dari konteks proyek berikut:\n${ctx}\n\nExtract: status terkini, capaian utama, isu aktif, resource, dan timeline.`,
      },
      {
        role: "sintetis",
        label: "Project Snapshot",
        promptFn: (ctx, prev) => `Berdasarkan data:\n${prev}\n\nBuat Project Snapshot report siap kirim ke stakeholder:\n\n## 📸 Project Snapshot\n**Tanggal:** [hari ini]\n**Status:** [traffic light 🟢/🟡/🔴]\n\n### Ringkasan Eksekutif\n...\n\n### Capaian Periode Ini\n...\n\n### Isu & Risiko Aktif\n...\n\n### Next Actions\n...\n\nKonteks: ${ctx}`,
      },
    ],
  },
  {
    id: "action_plan",
    icon: "🚀",
    title: "Action Plan Generator",
    desc: "Rencana aksi detail: siapa, apa, kapan, bagaimana",
    category: "Dokumen",
    chain: [
      {
        role: "strategis",
        label: "Dekomposisi Tujuan",
        promptFn: (ctx) => `Dari konteks proyek:\n${ctx}\n\nDekomposisi tujuan utama menjadi milestone-milestone konkret yang bisa dieksekusi. Setiap milestone: apa hasilnya, ukuran suksesnya, dan dependensinya.`,
      },
      {
        role: "eksekutor",
        label: "Action Plan",
        promptFn: (ctx, prev) => `Berdasarkan milestone:\n${prev}\n\nBuat Action Plan dalam format tabel markdown:\n| # | Aksi | PIC | Deadline | Status | Dependensi | Output |\n|---|------|-----|----------|--------|-----------|--------|\n\nKonteks: ${ctx}`,
      },
    ],
  },
  {
    id: "notulen",
    icon: "📝",
    title: "AI Notulis & Ringkas Rapat",
    desc: "Hasilkan notulen rapat + action items + keputusan",
    category: "Laporan",
    chain: [
      {
        role: "eksekutor",
        label: "Ekstraksi Poin",
        promptFn: (ctx) => `Dari konteks/catatan rapat berikut:\n${ctx}\n\nExtract semua: (1) poin diskusi utama, (2) keputusan yang dibuat, (3) action items yang disebut, (4) pertanyaan yang belum terjawab.`,
      },
      {
        role: "sintetis",
        label: "Notulen Resmi",
        promptFn: (_, prev) => `Berdasarkan ekstraksi:\n${prev}\n\nBuat notulen rapat profesional siap kirim:\n\n## 📋 Notulen Rapat\n**Tanggal:** ...\n**Peserta:** ...\n\n### Poin Diskusi\n...\n\n### Keputusan\n...\n\n### Action Items\n| Aksi | PIC | Deadline |\n|------|-----|----------|\n\n### Follow-up Berikutnya\n...`,
      },
    ],
  },
  {
    id: "brief_dokumen",
    icon: "📄",
    title: "Brief & Intake Builder",
    desc: "Draft brief proyek atau dokumen intake terstruktur",
    category: "Dokumen",
    chain: [
      {
        role: "strategis",
        label: "Analisis Kebutuhan",
        promptFn: (ctx) => `Analisis kebutuhan proyek dari konteks:\n${ctx}\n\nIdentifikasi: tujuan bisnis, stakeholder, scope, constraints, success criteria, dan deliverables utama.`,
      },
      {
        role: "eksekutor",
        label: "Draft Brief",
        promptFn: (ctx, prev) => `Berdasarkan analisis:\n${prev}\n\nBuat Project Brief lengkap:\n\n## Project Brief\n**Proyek:** ...\n**Tanggal:** ...\n\n### Background & Tujuan\n...\n\n### Scope & Out-of-Scope\n...\n\n### Stakeholder\n...\n\n### Success Criteria\n...\n\n### Deliverables\n...\n\n### Timeline & Milestone\n...\n\n### Constraints & Asumsi\n...\n\nKonteks: ${ctx}`,
      },
    ],
  },
];

const CATEGORIES = ["Semua", ...Array.from(new Set(MINI_APPS.map(a => a.category)))];

interface AppState {
  running: boolean;
  steps: Array<{ label: string; output: string; done: boolean }>;
  expanded: number | null;
  fullOutput: string;
  error?: string;
}

interface Props {
  workroomId: number;
  workroomName?: string;
  objective?: string;
}

export function MiniAppsTab({ workroomId, workroomName, objective }: Props) {
  const { data: kbItems = [] } = useListKnowledgeItems(workroomId);
  const { toast } = useToast();
  const abortRefs = useRef<Record<string, AbortController>>({});

  const [activeCategory, setActiveCategory] = useState("Semua");
  const [appStates, setAppStates] = useState<Record<string, AppState>>({});
  const [customContext, setCustomContext] = useState("");
  const [showContext, setShowContext] = useState<string | null>(null);

  const buildContext = () => {
    const kbContext = kbItems.slice(0, 6).map(i => `[${i.title}]: ${i.content.slice(0, 300)}`).join("\n\n");
    const base = [
      workroomName ? `Nama Workroom: ${workroomName}` : "",
      objective ? `Objective: ${objective}` : "",
      kbContext ? `\nKnowledge Base:\n${kbContext}` : "",
      customContext ? `\nKonteks Tambahan:\n${customContext}` : "",
    ].filter(Boolean).join("\n");
    return base;
  };

  const setStep = (appId: string, stepIdx: number, patch: Partial<AppState["steps"][0]>) => {
    setAppStates(s => {
      const prev = s[appId];
      if (!prev) return s;
      const steps = [...prev.steps];
      steps[stepIdx] = { ...steps[stepIdx], ...patch };
      return { ...s, [appId]: { ...prev, steps, expanded: stepIdx } };
    });
  };

  const runApp = async (app: MiniApp) => {
    const ctx = buildContext();
    const abort = new AbortController();
    abortRefs.current[app.id] = abort;

    setAppStates(s => ({
      ...s,
      [app.id]: {
        running: true,
        steps: app.chain.map(c => ({ label: c.label, output: "", done: false })),
        expanded: 0,
        fullOutput: "",
        error: undefined,
      },
    }));

    let prevOutput = "";
    try {
      for (let i = 0; i < app.chain.length; i++) {
        const step = app.chain[i];
        const prompt = step.promptFn(ctx, prevOutput);
        setStep(app.id, i, { output: "", done: false });
        setAppStates(s => ({ ...s, [app.id]: { ...s[app.id], expanded: i } }));

        const res = await fetch("/api/agent/invoke", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: step.role, prompt, context: ctx }),
          signal: abort.signal,
        });

        const reader = res.body!.getReader();
        const dec = new TextDecoder();
        let stepOut = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          for (const line of dec.decode(value).split("\n")) {
            if (line.startsWith("data: ")) {
              try {
                const d = JSON.parse(line.slice(6));
                if (d.text) {
                  stepOut += d.text;
                  setStep(app.id, i, { output: stepOut });
                }
              } catch { /**/ }
            }
          }
        }

        setStep(app.id, i, { output: stepOut, done: true });
        prevOutput = stepOut;
      }

      setAppStates(s => ({ ...s, [app.id]: { ...s[app.id], running: false, fullOutput: prevOutput } }));
    } catch (e: unknown) {
      if ((e as { name?: string }).name !== "AbortError") {
        setAppStates(s => ({ ...s, [app.id]: { ...s[app.id], running: false, error: "Gagal menjalankan mini app" } }));
        toast({ title: "Error menjalankan mini app", variant: "destructive" });
      } else {
        setAppStates(s => ({ ...s, [app.id]: { ...s[app.id], running: false } }));
      }
    }
  };

  const stopApp = (appId: string) => {
    abortRefs.current[appId]?.abort();
    setAppStates(s => ({ ...s, [appId]: { ...s[appId], running: false } }));
  };

  const copyOutput = (appId: string) => {
    const state = appStates[appId];
    if (!state) return;
    const text = state.steps.map(s => `## ${s.label}\n\n${s.output}`).join("\n\n---\n\n");
    navigator.clipboard.writeText(text);
    toast({ title: "Output disalin ✓" });
  };

  const downloadOutput = (app: MiniApp, appId: string) => {
    const state = appStates[appId];
    if (!state) return;
    const text = state.steps.map(s => `## ${s.label}\n\n${s.output}`).join("\n\n---\n\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${app.title.replace(/\s+/g, "-").toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = activeCategory === "Semua" ? MINI_APPS : MINI_APPS.filter(a => a.category === activeCategory);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wrench className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">Mini Apps</h3>
          <p className="text-xs text-muted-foreground">— alat AI yang memproses data workroom ini</p>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn("px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors", activeCategory === cat ? "bg-primary text-primary-foreground" : "bg-muted/40 text-muted-foreground hover:bg-muted")}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Custom context input */}
      <div className="rounded-lg border border-border/50 bg-muted/20 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-medium text-muted-foreground">Konteks tambahan (opsional)</p>
          <Badge variant="outline" className="text-[9px]">{kbItems.length} KB articles auto-injected</Badge>
        </div>
        <Textarea
          className="resize-none text-xs min-h-[60px]"
          placeholder="Tambahkan catatan rapat, data mentah, atau konteks spesifik yang akan diproses mini app…"
          value={customContext}
          onChange={e => setCustomContext(e.target.value)}
          rows={2}
        />
      </div>

      {/* App grid */}
      <div className="grid grid-cols-1 gap-3">
        {filtered.map(app => {
          const state = appStates[app.id];
          const hasOutput = state && state.steps.some(s => s.output.trim().length > 0);
          const allDone = state && state.steps.every(s => s.done);

          return (
            <div key={app.id} className={cn("rounded-xl border bg-card/60 overflow-hidden transition-all", state?.running && "border-primary/30")}>
              {/* App header */}
              <div className="flex items-center gap-3 p-3">
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-lg shrink-0">{app.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold">{app.title}</p>
                    <Badge variant="outline" className="text-[9px] h-4 px-1.5">{app.category}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{app.desc}</p>
                  {/* Chain pills */}
                  <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                    {app.chain.map((step, i) => (
                      <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground">
                        {i + 1}. {step.label}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {hasOutput && (
                    <>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyOutput(app.id)} title="Salin output"><Copy className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => downloadOutput(app, app.id)} title="Download"><Download className="w-3.5 h-3.5" /></Button>
                    </>
                  )}
                  {state?.running ? (
                    <Button variant="destructive" size="sm" className="h-7 px-2.5 gap-1 text-xs" onClick={() => stopApp(app.id)}>
                      <Square className="w-3 h-3" /> Stop
                    </Button>
                  ) : (
                    <Button size="sm" className="h-7 px-2.5 gap-1 text-xs" onClick={() => { setShowContext(showContext === app.id ? null : null); runApp(app); }}>
                      <Play className="w-3 h-3" /> Jalankan
                    </Button>
                  )}
                </div>
              </div>

              {/* Step outputs */}
              {state && state.steps.some(s => s.output || state.running) && (
                <div className="border-t border-border/50 divide-y divide-border/30">
                  {state.steps.map((step, i) => {
                    const isActive = state.expanded === i;
                    const isDone = step.done;
                    const isRunning = state.running && !isDone && i === state.steps.findIndex(s => !s.done);
                    return (
                      <div key={i} className={cn("transition-colors", isDone ? "bg-green-500/3" : isRunning ? "bg-primary/3" : "")}>
                        <button
                          className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-muted/20 transition-colors"
                          onClick={() => setAppStates(s => ({ ...s, [app.id]: { ...s[app.id], expanded: isActive ? null : i } }))}
                        >
                          {isRunning
                            ? <Loader2 className="w-3 h-3 text-primary animate-spin shrink-0" />
                            : isDone
                              ? <span className="text-green-400 text-xs shrink-0">✓</span>
                              : <span className="w-3 h-3 rounded-full border border-border/50 shrink-0" />}
                          <span className="text-[11px] font-medium flex-1">{i + 1}. {step.label}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {step.output ? `${step.output.length} chars` : isRunning ? "Streaming…" : "Menunggu"}
                          </span>
                          {isActive ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
                        </button>
                        {isActive && step.output && (
                          <div className="px-3 pb-3">
                            <div className="rounded-md bg-muted/40 p-2.5 max-h-64 overflow-y-auto">
                              <pre className="text-[11px] text-muted-foreground leading-relaxed whitespace-pre-wrap font-sans">{step.output}</pre>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* All done summary */}
                  {allDone && (
                    <div className="px-3 py-2 bg-green-500/5 flex items-center justify-between">
                      <p className="text-[11px] text-green-400 font-medium">✓ Selesai — {app.chain.length} langkah selesai</p>
                      <div className="flex gap-1.5">
                        <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1 px-2" onClick={() => copyOutput(app.id)}>
                          <Copy className="w-2.5 h-2.5" /> Salin
                        </Button>
                        <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1 px-2" onClick={() => downloadOutput(app, app.id)}>
                          <Download className="w-2.5 h-2.5" /> Download
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
