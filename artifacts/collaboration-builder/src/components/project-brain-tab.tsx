import { useState, useEffect, useRef } from "react";
import { useGetWorkroomBrain, useUpdateWorkroomBrain, getGetWorkroomBrainQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Brain, Save, Target, Lock, Users, BookMarked, Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const FIELDS = [
  { key: "context",      label: "Konteks Proyek",      icon: Brain,       placeholder: "Deskripsi singkat latar belakang proyek, industri, dan situasi saat ini…",          color: "text-blue-400",   bg: "bg-blue-400/10",   border: "border-blue-400/20" },
  { key: "goals",        label: "Tujuan & Target",      icon: Target,      placeholder: "Apa yang ingin dicapai? Ukuran keberhasilan? Timeline?",                             color: "text-green-400",  bg: "bg-green-400/10",  border: "border-green-400/20" },
  { key: "constraints",  label: "Batasan & Hambatan",   icon: Lock,        placeholder: "Anggaran, waktu, regulasi, atau keterbatasan teknis yang harus diperhatikan…",      color: "text-red-400",    bg: "bg-red-400/10",    border: "border-red-400/20" },
  { key: "stakeholders", label: "Stakeholders Kunci",   icon: Users,       placeholder: "Siapa saja pihak yang terlibat? Peran dan kepentingan mereka?",                    color: "text-amber-400",  bg: "bg-amber-400/10",  border: "border-amber-400/20" },
  { key: "decisions",    label: "Log Keputusan",        icon: BookMarked,  placeholder: "Keputusan penting yang sudah dibuat dan alasannya…",                               color: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-400/20" },
] as const;

type BrainField = typeof FIELDS[number]["key"];

interface Props {
  workroomId: number;
  workroomName?: string;
  objective?: string;
}

export function ProjectBrainTab({ workroomId, workroomName, objective }: Props) {
  const { data: brain, isLoading } = useGetWorkroomBrain(workroomId);
  const updateBrain = useUpdateWorkroomBrain();
  const qc = useQueryClient();
  const { toast } = useToast();
  const abortRef = useRef<AbortController | null>(null);

  const [fields, setFields] = useState<Record<BrainField, string>>({
    context: "", goals: "", constraints: "", stakeholders: "", decisions: "",
  });
  const [dirty, setDirty] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [streamingField, setStreamingField] = useState<BrainField | null>(null);

  useEffect(() => {
    if (brain) {
      setFields({
        context: brain.context ?? "",
        goals: brain.goals ?? "",
        constraints: brain.constraints ?? "",
        stakeholders: brain.stakeholders ?? "",
        decisions: brain.decisions ?? "",
      });
      setDirty(false);
    }
  }, [brain]);

  const handleChange = (key: BrainField, val: string) => {
    setFields(f => ({ ...f, [key]: val }));
    setDirty(true);
  };

  const handleSave = async () => {
    await updateBrain.mutateAsync({
      workroomId,
      data: fields as Parameters<typeof updateBrain.mutateAsync>[0]["data"],
    });
    qc.invalidateQueries({ queryKey: getGetWorkroomBrainQueryKey(workroomId) });
    setDirty(false);
    toast({ title: "Otak Proyek disimpan ✓" });
  };

  const fillWithAI = async () => {
    setAiLoading(true);
    abortRef.current = new AbortController();

    const ctx = [
      workroomName ? `Workroom: ${workroomName}` : "",
      objective ? `Objective: ${objective}` : "",
    ].filter(Boolean).join(". ") || "proyek kolaborasi tim";

    const prompt = `Kamu adalah project intelligence assistant. Berdasarkan konteks proyek berikut:
"${ctx}"

Generate data Otak Proyek yang substantif dalam format JSON. Balas HANYA dengan JSON valid:
{
  "context": "...",
  "goals": "...",
  "constraints": "...",
  "stakeholders": "...",
  "decisions": "..."
}

Panduan per field:
- context: 2-3 kalimat deskripsi lengkap latar belakang, industri, situasi saat ini
- goals: tujuan SMART + KPI terukur + target timeline
- constraints: budget, waktu, regulasi, keterbatasan teknis yang perlu diperhatikan
- stakeholders: daftar pihak terlibat dengan peran dan kepentingan masing-masing
- decisions: 2-3 keputusan awal yang disarankan berdasarkan konteks proyek

Semua field dalam Bahasa Indonesia. Substantif dan actionable.`;

    try {
      const res = await fetch("/api/agent/invoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "strategis", prompt, context: ctx }),
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
            try { const d = JSON.parse(line.slice(6)); if (d.text) full += d.text; } catch { /**/ }
          }
        }
      }

      const jsonMatch = full.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const next: Record<BrainField, string> = { ...fields };
        for (const k of Object.keys(fields) as BrainField[]) {
          if (parsed[k] && typeof parsed[k] === "string") next[k] = parsed[k];
        }
        setFields(next);
        setDirty(true);
        toast({ title: "✨ Otak Proyek berhasil diisi AI" });
      }
    } catch (e: unknown) {
      if ((e as { name?: string }).name !== "AbortError") toast({ title: "Gagal generate brain", variant: "destructive" });
    } finally {
      setAiLoading(false);
      setStreamingField(null);
    }
  };

  const totalFilled = Object.values(fields).filter(v => v.trim()).length;
  const completeness = Math.round((totalFilled / FIELDS.length) * 100);

  if (isLoading) return <div className="py-12 text-center text-muted-foreground text-sm">Memuat…</div>;

  return (
    <div className="space-y-4">
      {/* Header with completeness + AI fill */}
      <div className="p-3 rounded-lg border border-border bg-muted/30 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {FIELDS.map((_, i) => (
                <div key={i} className={cn("w-2 h-2 rounded-full transition-colors", i < totalFilled ? "bg-primary" : "bg-muted")} />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">{totalFilled}/{FIELDS.length} bagian terisi</span>
          </div>
          <span className={cn("text-sm font-bold", completeness >= 80 ? "text-green-400" : completeness >= 40 ? "text-amber-400" : "text-muted-foreground")}>
            {completeness}%
          </span>
        </div>
        <Progress value={completeness} className="h-1.5" />
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-muted-foreground">Semakin lengkap Otak Proyek, semakin akurat konteks untuk semua agen AI</p>
          <div className="flex gap-1.5">
            <Button size="sm" variant="outline" className="h-6 text-[11px] gap-1 px-2" onClick={fillWithAI} disabled={aiLoading}>
              {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-violet-400" />}
              {aiLoading ? "Generating…" : "✨ Isi dengan AI"}
            </Button>
            <Button size="sm" disabled={!dirty || updateBrain.isPending} onClick={handleSave} className="h-6 text-[11px] gap-1 px-2">
              {updateBrain.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              Simpan
            </Button>
          </div>
        </div>
      </div>

      {/* Fields */}
      <div className="space-y-3">
        {FIELDS.map(field => {
          const Icon = field.icon;
          const val = fields[field.key];
          const isFilled = val.trim().length > 0;
          const isStreaming = streamingField === field.key;
          return (
            <div key={field.key} className={cn("rounded-lg border overflow-hidden transition-all", isFilled ? `${field.border} border` : "border-border")}>
              <div className={cn("flex items-center gap-2 px-3 py-2 border-b border-border/40", field.bg)}>
                <Icon className={cn("w-3.5 h-3.5 shrink-0", field.color)} />
                <span className={cn("text-xs font-semibold flex-1", field.color)}>{field.label}</span>
                {isStreaming && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
                {isFilled && !isStreaming && <CheckCircle2 className="w-3 h-3 text-green-400" />}
              </div>
              <Textarea
                rows={3}
                className="border-0 rounded-none resize-none text-sm bg-card/40 focus-visible:ring-0 focus-visible:ring-offset-0"
                placeholder={field.placeholder}
                value={val}
                onChange={e => handleChange(field.key, e.target.value)}
              />
            </div>
          );
        })}
      </div>

      {/* Bottom save */}
      <div className="flex justify-end">
        <Button disabled={!dirty || updateBrain.isPending} onClick={handleSave} className="gap-1.5">
          {updateBrain.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Simpan Otak Proyek
        </Button>
      </div>
    </div>
  );
}
