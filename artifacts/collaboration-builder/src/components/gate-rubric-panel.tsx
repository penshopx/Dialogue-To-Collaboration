import { useState, useRef } from "react";
import { useUpdateWorkroomStage, useAddDecisionLog, getListWorkroomStagesQueryKey, getGetWorkroomQueryKey, getListWorkroomActivityQueryKey, getListDecisionLogsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, XCircle, RefreshCw, Sparkles, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

/* ─── Rubric criteria — from Gustafta ebook ─── */
const CRITERIA = [
  {
    key: "completeness",
    icon: "📋",
    label: "Kelengkapan Output",
    desc: "Apakah semua deliverable dan output stage selesai dan terdokumentasi?",
    levels: ["Tidak ada output yang selesai", "Sebagian kecil output selesai", "Sebagian besar output selesai", "Semua output selesai dan terdokumentasi"],
  },
  {
    key: "compliance",
    icon: "✅",
    label: "Kepatuhan Standar",
    desc: "Apakah output sesuai dengan standar, regulasi, dan prosedur yang berlaku?",
    levels: ["Banyak pelanggaran standar", "Ada beberapa ketidaksesuaian", "Sesuai standar dengan catatan minor", "Fully compliant — tidak ada catatan"],
  },
  {
    key: "risk",
    icon: "⚠️",
    label: "Risiko Terkontrol",
    desc: "Seberapa terkontrol risiko yang teridentifikasi? (4 = risiko sangat rendah/tertangani)",
    levels: ["Risiko kritis tidak tertangani", "Risiko tinggi masih terbuka", "Risiko sedang — mitigasi ada", "Semua risiko terkontrol/dimitigasi"],
  },
  {
    key: "readiness",
    icon: "💰",
    label: "Kesiapan Lanjut",
    desc: "Apakah budget, jadwal, dan sumber daya siap untuk tahap berikutnya?",
    levels: ["Tidak siap lanjut — butuh revisi besar", "Siap lanjut dengan reservasi besar", "Siap lanjut dengan catatan minor", "Fully ready — semua resource terkonfirmasi"],
  },
] as const;

type CriterionKey = typeof CRITERIA[number]["key"];

const SCORE_LABEL: Record<number, string> = { 1: "Sangat Kurang", 2: "Cukup", 3: "Baik", 4: "Sangat Baik" };
const SCORE_COLOR: Record<number, string> = { 1: "text-red-400", 2: "text-orange-400", 3: "text-amber-400", 4: "text-green-400" };
const SCORE_BG: Record<number, string> = { 1: "bg-red-400/10 border-red-400/30", 2: "bg-orange-400/10 border-orange-400/30", 3: "bg-amber-400/10 border-amber-400/30", 4: "bg-green-400/10 border-green-400/30" };

function getRecommendation(total: number): { label: string; action: "approved" | "rejected"; color: string; icon: React.ReactNode; desc: string } {
  if (total >= 13) return { label: "Setujui", action: "approved", color: "text-green-400", icon: <CheckCircle2 className="w-4 h-4" />, desc: "Semua kriteria terpenuhi — lanjut ke stage berikutnya" };
  if (total >= 9) return { label: "Revisi", action: "rejected", color: "text-amber-400", icon: <RefreshCw className="w-4 h-4" />, desc: "Ada area yang perlu diperbaiki sebelum lanjut" };
  return { label: "Tolak", action: "rejected", color: "text-red-400", icon: <XCircle className="w-4 h-4" />, desc: "Output belum memenuhi standar minimum — perlu perbaikan signifikan" };
}

interface GateRubricPanelProps {
  stage: {
    id: number;
    name: string;
    gateDecision?: string | null;
    gateNote?: string | null;
    gateType?: string | null;
    autoRejectConditions?: string[] | null;
    requiredEvidence?: string[] | null;
  };
  workroomId: number;
  workroomName?: string;
  objective?: string;
}

export function GateRubricPanel({ stage, workroomId, workroomName, objective }: GateRubricPanelProps) {
  const qc = useQueryClient();
  const updateStage = useUpdateWorkroomStage();
  const addDecisionLog = useAddDecisionLog();
  const { toast } = useToast();
  const abortRef = useRef<AbortController | null>(null);

  const [scores, setScores] = useState<Record<CriterionKey, number>>({ completeness: 0, compliance: 0, risk: 0, readiness: 0 });
  const [note, setNote] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInsight, setAiInsight] = useState("");

  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const maxScore = CRITERIA.length * 4;
  const allScored = Object.values(scores).every(s => s > 0);
  const recommendation = allScored ? getRecommendation(totalScore) : null;

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: getListWorkroomStagesQueryKey(workroomId) });
    qc.invalidateQueries({ queryKey: getGetWorkroomQueryKey(workroomId) });
    qc.invalidateQueries({ queryKey: getListWorkroomActivityQueryKey(workroomId) });
    qc.invalidateQueries({ queryKey: getListDecisionLogsQueryKey(workroomId) });
  };

  const decide = async (action: "approved" | "rejected", label: string) => {
    const rubricLines = CRITERIA.map(c => `- ${c.icon} ${c.label}: ${scores[c.key]}/4 — ${SCORE_LABEL[scores[c.key]] ?? "—"}`).join("\n");
    const rubricNote = allScored
      ? `◆ Gate Rubric (${totalScore}/${maxScore})\n${rubricLines}\nRekomendasi AI: ${label}\n\n${note || "(tanpa catatan tambahan)"}`
      : note || "(tanpa catatan)";

    await updateStage.mutateAsync(
      { workroomId, stageId: stage.id, data: { gateDecision: action, gateNote: rubricNote } as Parameters<typeof updateStage.mutateAsync>[0]["data"] },
      {
        onSuccess: async () => {
          toast({ title: `◆ Gate ${label} ✓` });
          invalidate();
          await addDecisionLog.mutateAsync({
            workroomId,
            data: {
              aktor: "Gate Evaluator",
              tipeAksi: "keputusan_gate",
              ringkasan: `Gate "${stage.name}" ${label} — Skor Rubrik: ${allScored ? `${totalScore}/${maxScore}` : "tanpa skor"}`,
              detail: { text: rubricNote } as Record<string, unknown>,
              stageId: stage.id,
            },
          });
          invalidate();
        },
      }
    );
  };

  const analyzeWithAI = async () => {
    setAiLoading(true);
    setAiInsight("");
    abortRef.current = new AbortController();

    const ctx = [
      workroomName ? `Workroom: ${workroomName}` : "",
      objective ? `Objective: ${objective}` : "",
      `Gate Stage: ${stage.name}`,
    ].filter(Boolean).join(". ");

    const scoredCriteria = CRITERIA.map(c =>
      scores[c.key] > 0
        ? `- ${c.label}: ${scores[c.key]}/4 (${SCORE_LABEL[scores[c.key]]})`
        : ""
    ).filter(Boolean).join("\n");

    const prompt = `Kamu adalah gate evaluator untuk workroom multi-agen. Analisis stage gate berikut dan berikan rekomendasi.

KONTEKS:
${ctx}

SKOR RUBRIK SAAT INI${scoredCriteria ? `:\n${scoredCriteria}` : ": (belum ada skor — gunakan konteks untuk mengestimasi)"}

TUGAS:
1. Estimasi skor rubrik untuk 4 kriteria berdasarkan konteks (jika belum diisi):
   - Kelengkapan Output (1-4)
   - Kepatuhan Standar (1-4)  
   - Risiko Terkontrol (1-4)
   - Kesiapan Lanjut (1-4)

2. Beri reasoning singkat per kriteria

3. Total skor dan rekomendasi: Setujui (13-16) / Revisi (9-12) / Tolak (4-8)

4. Satu catatan paling penting untuk gate decision ini

Format: JSON valid seperti ini:
{
  "completeness": <1-4>,
  "compliance": <1-4>,
  "risk": <1-4>,
  "readiness": <1-4>,
  "reasoning": {
    "completeness": "...",
    "compliance": "...",
    "risk": "...",
    "readiness": "..."
  },
  "recommendation": "Setujui|Revisi|Tolak",
  "keyNote": "..."
}`;

    try {
      const res = await fetch("/api/agent/invoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "evaluator",
          messages: [{ role: "user", content: prompt }],
          context: { workroomName, objective, stageName: stage.name },
        }),
        signal: abortRef.current.signal,
      });

      const reader = res.body!.getReader();
      const dec = new TextDecoder();
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of dec.decode(value).split("\n")) {
          if (line.startsWith("data: ")) {
            try {
              const d = JSON.parse(line.slice(6));
              if (d.content) full += d.content;
              if (d.done) break;
            } catch { /**/ }
          }
        }
      }

      const jsonMatch = full.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const newScores = { ...scores };
        for (const k of ["completeness", "compliance", "risk", "readiness"] as CriterionKey[]) {
          if (parsed[k] && typeof parsed[k] === "number" && parsed[k] >= 1 && parsed[k] <= 4) {
            newScores[k] = parsed[k];
          }
        }
        setScores(newScores);
        const lines = CRITERIA.map(c => {
          const reasoning = parsed.reasoning?.[c.key] ? ` — ${parsed.reasoning[c.key]}` : "";
          return `${c.icon} ${c.label}: ${newScores[c.key]}/4${reasoning}`;
        });
        const insight = `${lines.join("\n")}\n\n💡 ${parsed.keyNote ?? ""}`;
        setAiInsight(insight);
        if (parsed.keyNote) setNote(parsed.keyNote);
        toast({ title: `✨ AI Rubrik: ${parsed.recommendation ?? "Analisis selesai"}` });
      }
    } catch (e: unknown) {
      if ((e as { name?: string }).name !== "AbortError") toast({ title: "Analisis AI gagal", variant: "destructive" });
    } finally {
      setAiLoading(false);
    }
  };

  /* ─── Already decided ─── */
  if (stage.gateDecision) {
    const isApproved = stage.gateDecision === "approved";
    return (
      <Card className={cn("border", isApproved ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5")}>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-medium">
              {isApproved ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-500" />}
              Gate {isApproved ? "Disetujui" : "Ditolak / Revisi"}
            </div>
            <Button
              variant="ghost" size="sm" className="h-6 text-[10px] gap-1 text-muted-foreground hover:text-foreground"
              onClick={async () => {
                await updateStage.mutateAsync({
                  workroomId, stageId: stage.id,
                  data: { gateDecision: null as unknown as string, gateNote: null as unknown as string } as Parameters<typeof updateStage.mutateAsync>[0]["data"],
                });
                invalidate();
              }}
            >
              <RotateCcw className="w-3 h-3" /> Reset Gate
            </Button>
          </div>
          {stage.gateNote && (
            <pre className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed font-sans bg-muted/30 rounded p-3 max-h-40 overflow-y-auto">{stage.gateNote}</pre>
          )}
        </CardContent>
      </Card>
    );
  }

  /* ─── Rubric panel ─── */
  return (
    <Card className="border-amber-500/30 bg-amber-500/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            ◆ Human Gate — {stage.name}
          </CardTitle>
          <Button
            variant="outline" size="sm" className="h-7 gap-1.5 text-xs"
            onClick={analyzeWithAI}
            disabled={aiLoading}
          >
            {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-violet-400" />}
            {aiLoading ? "Menganalisis…" : "Analisis AI"}
          </Button>
        </div>
        <CardDescription>Nilai setiap kriteria (1–4) lalu konfirmasi keputusan gate.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Gate metadata — auto-reject + required evidence */}
        {((stage.requiredEvidence && stage.requiredEvidence.length > 0) || (stage.autoRejectConditions && stage.autoRejectConditions.length > 0)) && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {stage.requiredEvidence && stage.requiredEvidence.length > 0 && (
              <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 space-y-2">
                <p className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider">Bukti Wajib</p>
                <ul className="space-y-1">
                  {stage.requiredEvidence.map((ev, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                      <span className="text-blue-400 mt-0.5">•</span> {ev}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {stage.autoRejectConditions && stage.autoRejectConditions.length > 0 && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 space-y-2">
                <p className="text-[10px] font-semibold text-red-400 uppercase tracking-wider">Auto-Reject Conditions</p>
                <ul className="space-y-1">
                  {stage.autoRejectConditions.map((cond, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                      <span className="text-red-400 mt-0.5">✕</span> {cond}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Score grid */}
        <div className="space-y-3">
          {CRITERIA.map(c => {
            const score = scores[c.key];
            return (
              <div key={c.key} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{c.icon}</span>
                    <span className="text-xs font-semibold">{c.label}</span>
                  </div>
                  {score > 0 && (
                    <span className={cn("text-xs font-bold", SCORE_COLOR[score])}>{score}/4 — {SCORE_LABEL[score]}</span>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground pl-6">{c.desc}</p>
                <div className="grid grid-cols-4 gap-1.5 pl-6">
                  {[1, 2, 3, 4].map(v => (
                    <button
                      key={v}
                      onClick={() => setScores(s => ({ ...s, [c.key]: v }))}
                      className={cn(
                        "flex flex-col items-center py-1.5 px-1 rounded-lg border text-[10px] leading-tight transition-all",
                        score === v
                          ? cn(SCORE_BG[v], "font-semibold", SCORE_COLOR[v])
                          : "border-border/50 text-muted-foreground hover:bg-muted/30"
                      )}
                    >
                      <span className="text-sm font-bold">{v}</span>
                      <span className="text-center mt-0.5 opacity-70">{c.levels[v - 1]}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Score tally */}
        {allScored && (
          <div className={cn("rounded-xl border p-3 space-y-2", recommendation!.action === "approved" ? "border-green-500/30 bg-green-500/5" : recommendation!.label === "Revisi" ? "border-amber-500/30 bg-amber-500/5" : "border-red-500/30 bg-red-500/5")}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={recommendation!.color}>{recommendation!.icon}</span>
                <span className={cn("text-sm font-bold", recommendation!.color)}>Rekomendasi: {recommendation!.label}</span>
              </div>
              <Badge variant="outline" className={cn("text-sm font-bold", recommendation!.color)}>{totalScore}/{maxScore}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">{recommendation!.desc}</p>

            {/* Progress bar */}
            <div className="h-2 bg-muted/40 rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all", recommendation!.action === "approved" ? "bg-green-400" : recommendation!.label === "Revisi" ? "bg-amber-400" : "bg-red-400")}
                style={{ width: `${(totalScore / maxScore) * 100}%` }}
              />
            </div>

            <div className="flex gap-1 text-[10px] text-muted-foreground">
              <span className="text-red-400">Tolak ≤8</span>
              <span className="flex-1 text-center text-amber-400">Revisi 9–12</span>
              <span className="text-green-400">Setujui 13–16</span>
            </div>
          </div>
        )}

        {/* AI Insight */}
        {aiInsight && (
          <div className="rounded-lg bg-violet-500/5 border border-violet-500/20 p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3 h-3 text-violet-400" />
              <p className="text-[11px] font-semibold text-violet-400">Analisis AI</p>
            </div>
            <pre className="text-[10px] text-muted-foreground whitespace-pre-wrap leading-relaxed font-sans">{aiInsight}</pre>
          </div>
        )}

        {/* Note */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Catatan Keputusan</label>
          <Textarea
            placeholder="Tambahkan catatan, kondisi, atau syarat keputusan gate…"
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={3}
            className="text-sm"
          />
        </div>

        {/* Decision buttons */}
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="outline"
            className="border-green-500/40 text-green-400 hover:bg-green-500/10 gap-1.5"
            disabled={updateStage.isPending}
            onClick={() => decide("approved", "Setujui")}
          >
            <CheckCircle2 className="w-4 h-4" /> Setujui
          </Button>
          <Button
            variant="outline"
            className="border-amber-500/40 text-amber-400 hover:bg-amber-500/10 gap-1.5"
            disabled={updateStage.isPending}
            onClick={() => decide("rejected", "Revisi")}
          >
            <RefreshCw className="w-4 h-4" /> Revisi
          </Button>
          <Button
            variant="outline"
            className="border-red-500/40 text-red-400 hover:bg-red-500/10 gap-1.5"
            disabled={updateStage.isPending}
            onClick={() => decide("rejected", "Tolak")}
          >
            <XCircle className="w-4 h-4" /> Tolak
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
