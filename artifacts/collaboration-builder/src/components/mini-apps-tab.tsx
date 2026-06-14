import { useState, useRef } from "react";
import { useListKnowledgeItems, useListDeliverables, useGetWorkroomBrain } from "@workspace/api-client-react";
import { Wrench, Play, Square, Copy, Download, ChevronDown, ChevronUp, Loader2, Package } from "lucide-react";
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
  {
    id: "pack_compiler",
    icon: "📦",
    title: "Pack Compiler — Output Final",
    desc: "Kompilasi SEMUA output workroom menjadi satu dokumen final siap kirim (dari Gustafta)",
    category: "Kompilasi",
    chain: [
      {
        role: "eksekutor",
        label: "Ekstraksi & Inventaris Output",
        promptFn: (ctx) => `Kamu adalah Pack Compiler. Dari semua konteks workroom berikut:\n\n${ctx}\n\nLakukan inventaris lengkap:\n1. Daftar semua deliverable dan statusnya\n2. Keputusan kunci yang sudah dibuat\n3. Temuan penting dari setiap stage\n4. Knowledge base yang relevan\n5. Gap yang masih ada\n\nFormat sebagai inventaris terstruktur — ini akan jadi bahan kompilasi dokumen final.`,
      },
      {
        role: "sintetis",
        label: "Sintesis & Konsolidasi",
        promptFn: (ctx, prev) => `Berdasarkan inventaris output:\n${prev}\n\nKonteks proyek: ${ctx}\n\nSintesiskan semua output:\n- Temukan benang merah dari semua keputusan\n- Konsolidasi rekomendasi yang konsisten\n- Identifikasi area yang memerlukan klarifikasi\n- Buat narrative yang koheren dari semua stage\n\nHasil sintesis ini akan menjadi backbone dokumen final.`,
      },
      {
        role: "pack_compiler",
        label: "Compile Dokumen Final",
        promptFn: (ctx, prev) => `Kamu adalah DocuGen — Pack Compiler. Berdasarkan sintesis:\n${prev}\n\nBuat DOKUMEN FINAL yang komprehensif dan siap diserahkan:\n\n# 📦 LAPORAN FINAL WORKROOM\n**Proyek:** ...\n**Tanggal Kompilasi:** ...\n**Status:** ...\n\n## 1. RINGKASAN EKSEKUTIF\n[2-3 paragraf — ditulis untuk decision maker]\n\n## 2. KONTEKS & LATAR BELAKANG\n[Dari Otak Proyek]\n\n## 3. PROSES & PIPELINE\n[Ringkasan 8-stage journey]\n\n## 4. OUTPUT & DELIVERABLES\n[Semua artefak yang dihasilkan dengan statusnya]\n\n## 5. KEPUTUSAN STRATEGIS\n[Decision log — semua gate decision dan keputusan kunci]\n\n## 6. TEMUAN & INSIGHTS\n[Dari Knowledge Base dan analisis agen]\n\n## 7. RISIKO & MITIGASI\n[Yang berhasil ditangani dan yang masih terbuka]\n\n## 8. REKOMENDASI & NEXT STEPS\n[Langkah konkret untuk stakeholder]\n\n## CHECKLIST KELENGKAPAN DOKUMEN\n- [ ] Ringkasan eksekutif tersedia\n- [ ] Semua deliverable tercantum\n- [ ] Keputusan gate terdokumentasi\n- [ ] Next steps jelas dan actionable\n\nKonteks: ${ctx}`,
      },
    ],
  },
  {
    id: "gate_rubric_ai",
    icon: "◆",
    title: "Gate Rubric AI",
    desc: "Analisis kesiapan gate dengan rubrik 4 kriteria (Kelengkapan, Kepatuhan, Risiko, Kesiapan)",
    category: "Analisis",
    chain: [
      {
        role: "evaluator",
        label: "Evaluasi Rubrik Gate",
        promptFn: (ctx) => `Kamu adalah gate evaluator. Evaluasi kesiapan gate workroom berdasarkan konteks:\n\n${ctx}\n\nNilai 4 kriteria (1-4):\n1. 📋 Kelengkapan Output — apakah semua deliverable selesai?\n2. ✅ Kepatuhan Standar — apakah sesuai standar/regulasi?\n3. ⚠️ Risiko Terkontrol — seberapa terkontrol risikonya?\n4. 💰 Kesiapan Lanjut — siapkah budget/jadwal untuk lanjut?\n\nBuat Gate Assessment Report:\n| Kriteria | Skor | Level | Temuan | Rekomendasi |\n|----------|------|-------|--------|-------------|\n\nTotal: ?/16\nRekomendasi: Setujui (13-16) / Revisi (9-12) / Tolak (≤8)`,
      },
      {
        role: "skeptis",
        label: "Review & Tantangan",
        promptFn: (_, prev) => `Review gate assessment berikut dengan kritis:\n${prev}\n\nIdentifikasi:\n- Asumsi yang terlalu optimis\n- Risiko yang mungkin terlewat\n- Kondisi tambahan yang sebaiknya disyaratkan sebelum approve\n- Apakah rekomendasi sudah tepat?\n\nBerikan "Devil's Advocate" perspective.`,
      },
      {
        role: "sintetis",
        label: "Gate Decision Brief",
        promptFn: (ctx, prev) => `Berdasarkan evaluasi dan review:\n${prev}\n\nBuat Gate Decision Brief siap presentasi ke PIC:\n\n## ◆ GATE DECISION BRIEF\n**Stage:** ...\n**Workroom:** ...\n\n### Skor Rubrik\n...\n\n### Rekomendasi Final\n...\n\n### Kondisi / Syarat\n...\n\n### Risiko Jika Dilanjutkan\n...\n\n### Risiko Jika Ditolak\n...\n\nKonteks: ${ctx}`,
      },
    ],
  },
];

const CATEGORIES = ["Semua", ...Array.from(new Set(MINI_APPS.map(a => a.category)))];

interface AppState {
  running: boolean;
  steps: Array<{ label: string; output: string; done: boolean }>;
  expanded: number | null;
  started: boolean;
}

const defaultState = (): AppState => ({ running: false, steps: [], expanded: null, started: false });

interface Props {
  workroomId: number;
  workroomName?: string;
  objective?: string;
}

export function MiniAppsTab({ workroomId, workroomName, objective }: Props) {
  const { data: kbItems = [] } = useListKnowledgeItems(workroomId);
  const { data: deliverables = [] } = useListDeliverables(workroomId);
  const { data: brain } = useGetWorkroomBrain(workroomId);
  const { toast } = useToast();

  const [activeCategory, setActiveCategory] = useState("Semua");
  const [activeApp, setActiveApp] = useState<string | null>(null);
  const [appStates, setAppStates] = useState<Record<string, AppState>>({});
  const [customPrompt, setCustomPrompt] = useState("");
  const abortRefs = useRef<Record<string, AbortController>>({});

  const getState = (id: string): AppState => appStates[id] ?? defaultState();
  const patchState = (id: string, patch: Partial<AppState>) =>
    setAppStates(prev => ({ ...prev, [id]: { ...getState(id), ...patch } }));
  const patchStep = (id: string, idx: number, patch: Partial<AppState["steps"][number]>) =>
    setAppStates(prev => {
      const cur = prev[id] ?? defaultState();
      const steps = [...cur.steps];
      steps[idx] = { ...steps[idx], ...patch };
      return { ...prev, [id]: { ...cur, steps } };
    });

  const buildContext = () => {
    const kbCtx = kbItems.slice(0, 5).map(i => `[KB] ${i.title}: ${i.content.slice(0, 200)}`).join("\n");
    const brainCtx = brain ? [
      brain.context ? `Konteks: ${brain.context}` : "",
      brain.goals ? `Tujuan: ${brain.goals}` : "",
      brain.constraints ? `Batasan: ${brain.constraints}` : "",
      brain.stakeholders ? `Stakeholders: ${brain.stakeholders}` : "",
    ].filter(Boolean).join("\n") : "";
    const delivCtx = deliverables.length > 0
      ? `Deliverables (${deliverables.length}): ` + deliverables.map(d => `${d.title} [${d.status}]`).join(", ")
      : "";

    return [
      workroomName ? `Workroom: ${workroomName}` : "",
      objective ? `Objective: ${objective}` : "",
      brainCtx,
      delivCtx,
      kbCtx ? `\nKnowledge Base:\n${kbCtx}` : "",
      customPrompt ? `\nKonteks tambahan:\n${customPrompt}` : "",
    ].filter(Boolean).join("\n");
  };

  const runApp = async (app: MiniApp) => {
    const initialSteps = app.chain.map(s => ({ label: s.label, output: "", done: false }));
    patchState(app.id, { running: true, started: true, steps: initialSteps, expanded: 0 });
    abortRefs.current[app.id] = new AbortController();

    const ctx = buildContext();
    let prev = "";

    try {
      for (let i = 0; i < app.chain.length; i++) {
        patchState(app.id, { expanded: i });
        const step = app.chain[i];
        const prompt = step.promptFn(ctx, prev);

        const res = await fetch("/api/agent/openclaw", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt,
            chain: [step.role],
            context: { workroomName, objective, knowledgeBase: kbItems.slice(0, 3).map(k => `${k.title}: ${k.content.slice(0, 150)}`).join("\n") },
          }),
          signal: abortRefs.current[app.id].signal,
        });

        const reader = res.body!.getReader();
        const dec = new TextDecoder();
        let out = "";
        let leftover = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const text = leftover + dec.decode(value, { stream: true });
          const lines = text.split("\n");
          leftover = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const d = JSON.parse(line.slice(6));
              if (d.content) { out += d.content; patchStep(app.id, i, { output: out }); }
              if (d.phase === "chain_complete") break;
            } catch { /**/ }
          }
        }
        patchStep(app.id, i, { output: out, done: true });
        prev = out;
      }
    } catch (e: unknown) {
      if ((e as { name?: string }).name !== "AbortError") toast({ title: `${app.title} gagal`, variant: "destructive" });
    } finally {
      patchState(app.id, { running: false });
    }
  };

  const stopApp = (id: string) => {
    abortRefs.current[id]?.abort();
    patchState(id, { running: false });
  };

  const copyOutput = (app: MiniApp, state: AppState) => {
    const text = state.steps.map((s, i) => `## ${app.chain[i].label}\n\n${s.output}`).join("\n\n---\n\n");
    navigator.clipboard.writeText(text);
    toast({ title: "Output disalin ✓" });
  };

  const downloadOutput = (app: MiniApp, state: AppState) => {
    const text = state.steps.map((s, i) => `## ${app.chain[i].label}\n\n${s.output}`).join("\n\n---\n\n");
    const blob = new Blob([`# ${app.title}\n\n${text}`], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${app.id}-output.txt`;
    a.click();
  };

  const filtered = activeCategory === "Semua" ? MINI_APPS : MINI_APPS.filter(a => a.category === activeCategory);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wrench className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">Mini Apps AI</h3>
          <p className="text-xs text-muted-foreground">— tools siap pakai untuk workroom ini</p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          {kbItems.length > 0 && <Badge variant="outline" className="text-[9px]">{kbItems.length} KB</Badge>}
          {deliverables.length > 0 && <Badge variant="outline" className="text-[9px]">{deliverables.length} deliverables</Badge>}
          {brain?.context && <Badge variant="outline" className="text-[9px]">Brain ✓</Badge>}
        </div>
      </div>

      {/* Context input */}
      <div className="rounded-lg border border-border/50 bg-muted/20 p-3 space-y-2">
        <p className="text-[11px] font-medium text-muted-foreground">Konteks Tambahan (opsional — diinjeksikan ke semua mini apps)</p>
        <Textarea
          className="resize-none text-xs min-h-[48px]"
          placeholder="Masukkan detail spesifik: catatan rapat, data aktual, kondisi khusus yang relevan untuk mini app ini…"
          value={customPrompt}
          onChange={e => setCustomPrompt(e.target.value)}
          rows={2}
        />
      </div>

      {/* Category filter */}
      <div className="flex gap-1.5 flex-wrap">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "text-xs px-3 py-1 rounded-full border transition-colors",
              activeCategory === cat ? "bg-primary text-primary-foreground border-primary" : "border-border/60 text-muted-foreground hover:bg-muted/40"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* App cards grid */}
      <div className="space-y-3">
        {filtered.map(app => {
          const state = getState(app.id);
          const isActive = activeApp === app.id;
          const hasOutput = state.started && state.steps.some(s => s.output);
          const isPackCompiler = app.id === "pack_compiler";

          return (
            <div key={app.id} className={cn("rounded-xl border overflow-hidden transition-all", isActive ? "border-primary/40" : "border-border/60", isPackCompiler && "border-violet-500/30")}>
              {/* App header */}
              <div
                className={cn("flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/20 transition-colors", isPackCompiler && "bg-violet-500/5")}
                onClick={() => setActiveApp(isActive ? null : app.id)}
              >
                <span className="text-2xl shrink-0">{app.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{app.title}</p>
                    <Badge variant="outline" className="text-[9px] h-4 px-1.5">{app.category}</Badge>
                    {isPackCompiler && <Badge className="text-[9px] h-4 px-1.5 bg-violet-500/20 text-violet-400 border-violet-500/30">Gustafta</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{app.desc}</p>
                  <div className="flex gap-1 mt-1">
                    {app.chain.map((s, i) => (
                      <span key={i} className={cn("text-[9px] px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground", state.steps[i]?.done && "bg-green-500/10 text-green-400")}>
                        {s.label}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {hasOutput && !state.running && (
                    <>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={e => { e.stopPropagation(); copyOutput(app, state); }}><Copy className="w-3 h-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={e => { e.stopPropagation(); downloadOutput(app, state); }}><Download className="w-3 h-3" /></Button>
                    </>
                  )}
                  {state.running ? (
                    <Button variant="destructive" size="sm" className="h-7 text-xs gap-1" onClick={e => { e.stopPropagation(); stopApp(app.id); }}>
                      <Square className="w-3 h-3" /> Stop
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className={cn("h-7 text-xs gap-1", isPackCompiler && "bg-violet-600 hover:bg-violet-700")}
                      onClick={e => { e.stopPropagation(); setActiveApp(app.id); runApp(app); }}
                    >
                      {state.started ? "▶ Ulang" : <><Play className="w-3 h-3" /> Jalankan</>}
                    </Button>
                  )}
                </div>
              </div>

              {/* Step outputs (visible when expanded) */}
              {isActive && state.started && (
                <div className="border-t border-border/40 divide-y divide-border/30">
                  {state.steps.map((step, i) => {
                    const stepConf = app.chain[i];
                    const isStepOpen = state.expanded === i;
                    const isRunning = state.running && !step.done && state.steps.slice(0, i).every(s => s.done);
                    if (!step.output && !isRunning) return null;
                    return (
                      <div key={i}>
                        <button
                          className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-muted/10 transition-colors"
                          onClick={() => patchState(app.id, { expanded: isStepOpen ? null : i })}
                        >
                          <span className="w-5 h-5 rounded-full bg-muted/40 text-[10px] flex items-center justify-center shrink-0">{i + 1}</span>
                          <span className="text-xs font-medium flex-1">{stepConf.label}</span>
                          {isRunning && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
                          {step.done && <span className="text-[10px] text-green-400">✓</span>}
                          {step.output && (isStepOpen ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />)}
                        </button>
                        {isStepOpen && step.output && (
                          <div className="px-3 pb-3 max-h-72 overflow-y-auto">
                            <pre className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap font-sans">{step.output}</pre>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* All done */}
                  {!state.running && state.steps.every(s => s.done) && (
                    <div className="flex items-center justify-between px-3 py-2 bg-green-500/5">
                      <span className="text-[11px] text-green-400">✓ Selesai — {app.title}</span>
                      <div className="flex gap-1.5">
                        <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1" onClick={() => copyOutput(app, state)}><Copy className="w-3 h-3" /> Salin</Button>
                        <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1" onClick={() => downloadOutput(app, state)}><Download className="w-3 h-3" /> Download</Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Pack Compiler empty state hint */}
              {isActive && !state.started && isPackCompiler && (
                <div className="border-t border-violet-500/20 p-4 bg-violet-500/5">
                  <div className="flex items-center gap-2 text-xs text-violet-400">
                    <Package className="w-4 h-4" />
                    <span className="font-medium">Pack Compiler akan mengambil seluruh konteks workroom</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1.5">
                    Inventaris output → Sintesis → Dokumen final yang komprehensif dan siap diserahkan ke stakeholder.
                    Pastikan Brain, KB, dan Deliverables sudah terisi untuk hasil terbaik.
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
