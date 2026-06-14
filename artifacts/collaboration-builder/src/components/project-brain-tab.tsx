import { useState, useEffect } from "react";
import { useGetWorkroomBrain, useUpdateWorkroomBrain, getGetWorkroomBrainQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Brain, Save, Target, Lock, Users, BookMarked, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const FIELDS = [
  { key: "context", label: "Konteks Proyek", icon: Brain, placeholder: "Deskripsi singkat latar belakang proyek, industri, dan situasi saat ini…", color: "text-blue-400", bg: "bg-blue-400/10" },
  { key: "goals", label: "Tujuan & Target", icon: Target, placeholder: "Apa yang ingin dicapai? Ukuran keberhasilan? Timeline?", color: "text-green-400", bg: "bg-green-400/10" },
  { key: "constraints", label: "Batasan & Hambatan", icon: Lock, placeholder: "Anggaran, waktu, regulasi, atau keterbatasan teknis yang harus diperhatikan…", color: "text-red-400", bg: "bg-red-400/10" },
  { key: "stakeholders", label: "Stakeholders Kunci", icon: Users, placeholder: "Siapa saja pihak yang terlibat? Peran dan kepentingan mereka?", color: "text-amber-400", bg: "bg-amber-400/10" },
  { key: "decisions", label: "Log Keputusan", icon: BookMarked, placeholder: "Keputusan penting yang sudah dibuat dan alasannya…", color: "text-purple-400", bg: "bg-purple-400/10" },
] as const;

type BrainField = typeof FIELDS[number]["key"];

interface Props { workroomId: number }

export function ProjectBrainTab({ workroomId }: Props) {
  const { data: brain, isLoading } = useGetWorkroomBrain(workroomId);
  const updateBrain = useUpdateWorkroomBrain();
  const qc = useQueryClient();
  const { toast } = useToast();

  const [fields, setFields] = useState<Record<BrainField, string>>({
    context: "", goals: "", constraints: "", stakeholders: "", decisions: "",
  });
  const [dirty, setDirty] = useState(false);

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

  const totalFilled = Object.values(fields).filter(v => v.trim()).length;

  if (isLoading) return <div className="py-12 text-center text-muted-foreground text-sm">Memuat…</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {FIELDS.map((_, i) => (
              <div key={i} className={cn("w-2 h-2 rounded-full", i < totalFilled ? "bg-primary" : "bg-muted")} />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">{totalFilled}/{FIELDS.length} bagian terisi</span>
        </div>
        <Button size="sm" disabled={!dirty || updateBrain.isPending} onClick={handleSave} className="gap-1.5">
          {updateBrain.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Simpan
        </Button>
      </div>

      <div className="space-y-3">
        {FIELDS.map(field => {
          const Icon = field.icon;
          return (
            <div key={field.key} className="rounded-lg border border-border overflow-hidden">
              <div className={cn("flex items-center gap-2 px-3 py-2 border-b border-border/50", field.bg)}>
                <Icon className={cn("w-3.5 h-3.5 shrink-0", field.color)} />
                <span className={cn("text-xs font-semibold", field.color)}>{field.label}</span>
                {fields[field.key].trim() && <span className="ml-auto text-[10px] text-muted-foreground">✓ terisi</span>}
              </div>
              <Textarea
                rows={3}
                className="border-0 rounded-none resize-none text-sm bg-card/40 focus-visible:ring-0 focus-visible:ring-offset-0"
                placeholder={field.placeholder}
                value={fields[field.key]}
                onChange={e => handleChange(field.key, e.target.value)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
