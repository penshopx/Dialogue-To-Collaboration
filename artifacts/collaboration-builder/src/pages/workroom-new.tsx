import { useListTemplates, useCreateWorkroom } from "@workspace/api-client-react";
import { useLocation, useSearch } from "wouter";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, HardHat, BadgeCheck, GraduationCap, BookOpen, TrendingUp, Building2, Loader2, ShieldAlert, Calendar, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const SECTOR_ICONS: Record<string, React.ElementType> = {
  Konstruksi: HardHat,
  "ISO-KAN": BadgeCheck,
  Edutech: GraduationCap,
  BNSP: BookOpen,
  Marketing: TrendingUp,
};

const MODE_LABELS: Record<string, string> = {
  profesional: "Professional",
  organisasi: "Organization",
  komunitas: "Community",
};

const PIPELINE_STAGES = [
  { name: "Intake", type: "kerja", desc: "Gather all context and requirements" },
  { name: "Framing", type: "kerja", desc: "Strategize, frame, and map priorities" },
  { name: "Skeptic Gate", type: "gate", desc: "Human review — challenge assumptions" },
  { name: "Blueprint", type: "kerja", desc: "Design solution and detailed plan" },
  { name: "Delivery", type: "kerja", desc: "Execute and produce outputs" },
  { name: "QA Gate", type: "gate", desc: "Human review — validate quality" },
  { name: "Release", type: "kerja", desc: "Package and release final deliverables" },
  { name: "Retro", type: "kerja", desc: "Retrospective and lessons learned" },
];

export default function WorkroomNew() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const preselected = params.get("templateId");

  const { data: templates, isLoading } = useListTemplates();
  const createWorkroom = useCreateWorkroom();
  const { toast } = useToast();

  const [step, setStep] = useState<1 | 2>(preselected ? 2 : 1);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(
    preselected ? parseInt(preselected) : null
  );
  const [name, setName] = useState("");
  const [objective, setObjective] = useState("");
  const [riskLevel, setRiskLevel] = useState<"low" | "medium" | "high">("medium");
  const [deadline, setDeadline] = useState("");
  const [kpiText, setKpiText] = useState("");

  const selectedTemplate = templates?.find((t) => t.id === selectedTemplateId);

  const grouped = templates?.reduce<Record<string, typeof templates>>((acc, t) => {
    if (!acc[t.sector]) acc[t.sector] = [];
    acc[t.sector].push(t);
    return acc;
  }, {}) ?? {};

  async function handleCreate() {
    if (!selectedTemplateId || !name.trim()) return;
    const kpiLines = kpiText.split("\n").map(l => l.trim()).filter(Boolean);
    try {
      const result = await createWorkroom.mutateAsync({
        data: {
          name: name.trim(),
          templateId: selectedTemplateId,
          objective: objective.trim() || undefined,
          riskLevel,
          deadline: deadline || undefined,
          kpiTargets: kpiLines.length > 0 ? { targets: kpiLines } : undefined,
        },
      });
      toast({ title: "Workroom created!", description: `"${result.name}" is ready.` });
      navigate(`/workrooms/${result.id}`);
    } catch {
      toast({ title: "Error", description: "Failed to create workroom.", variant: "destructive" });
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => (step === 2 ? setStep(1) : navigate("/workrooms"))}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Workroom</h1>
          <p className="text-muted-foreground text-sm">
            {step === 1 ? "Step 1 of 2 — Choose a template" : "Step 2 of 2 — Configure your workroom"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <div className={cn("flex items-center gap-1.5", step === 1 ? "text-primary" : "text-muted-foreground")}>
          <div className={cn("w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold", step === 1 ? "bg-primary text-primary-foreground" : "bg-muted")}>
            {step === 2 ? <Check className="w-3 h-3" /> : "1"}
          </div>
          Select Template
        </div>
        <div className="h-px flex-1 bg-border" />
        <div className={cn("flex items-center gap-1.5", step === 2 ? "text-primary" : "text-muted-foreground")}>
          <div className={cn("w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold", step === 2 ? "bg-primary text-primary-foreground" : "bg-muted")}>
            2
          </div>
          Configure
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-6">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-[140px] rounded-xl" />)}
            </div>
          ) : (
            Object.entries(grouped).map(([sector, tmpl]) => {
              const Icon = SECTOR_ICONS[sector] ?? Building2;
              return (
                <div key={sector}>
                  <div className="flex items-center gap-2 mb-3 text-sm font-medium text-muted-foreground">
                    <Icon className="w-4 h-4" />
                    {sector}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {tmpl.map((t) => (
                      <Card
                        key={t.id}
                        onClick={() => setSelectedTemplateId(t.id)}
                        className={cn(
                          "cursor-pointer transition-all hover-elevate",
                          selectedTemplateId === t.id
                            ? "border-primary ring-1 ring-primary bg-primary/5"
                            : "hover:border-primary/30"
                        )}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start gap-2">
                            <CardTitle className="text-sm font-semibold leading-tight">{t.name}</CardTitle>
                            {selectedTemplateId === t.id && (
                              <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                                <Check className="w-3 h-3 text-primary-foreground" />
                              </div>
                            )}
                          </div>
                          <CardDescription className="text-xs line-clamp-2">{t.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="pb-3">
                          <Badge variant="outline" className="text-xs capitalize">
                            {MODE_LABELS[t.mode] ?? t.mode}
                          </Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })
          )}

          <Button
            className="w-full gap-2"
            disabled={!selectedTemplateId}
            onClick={() => setStep(2)}
          >
            Continue
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {step === 2 && selectedTemplate && (
        <div className="space-y-6">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                {(() => { const Icon = SECTOR_ICONS[selectedTemplate.sector] ?? Building2; return <Icon className="w-4 h-4 text-primary" />; })()}
              </div>
              <div>
                <p className="text-sm font-semibold">{selectedTemplate.name}</p>
                <p className="text-xs text-muted-foreground">{selectedTemplate.sector} · {MODE_LABELS[selectedTemplate.mode] ?? selectedTemplate.mode}</p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Workroom Name *</Label>
              <Input
                id="name"
                placeholder={`e.g., ${selectedTemplate.sector} Project — ${new Date().getFullYear()}`}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="objective">Objective <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Textarea
                id="objective"
                placeholder="What is the goal of this workroom? Include deadlines, constraints, or success criteria."
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                rows={3}
              />
            </div>

            {/* Risk Level */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-muted-foreground" />
                Tingkat Risiko
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {(["low", "medium", "high"] as const).map(r => {
                  const cfg = {
                    low:    { label: "Rendah", color: "border-green-500/40 text-green-400 bg-green-500/10", inactive: "border-border text-muted-foreground hover:border-green-500/20" },
                    medium: { label: "Sedang", color: "border-amber-500/40 text-amber-400 bg-amber-500/10", inactive: "border-border text-muted-foreground hover:border-amber-500/20" },
                    high:   { label: "Tinggi",  color: "border-red-500/40 text-red-400 bg-red-500/10",     inactive: "border-border text-muted-foreground hover:border-red-500/20" },
                  }[r];
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRiskLevel(r)}
                      className={cn(
                        "px-3 py-2 rounded-lg border text-xs font-medium transition-all",
                        riskLevel === r ? cfg.color : cfg.inactive
                      )}
                    >
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Deadline */}
            <div className="space-y-1.5">
              <Label htmlFor="deadline" className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                Target Deadline <span className="text-muted-foreground text-xs">(optional)</span>
              </Label>
              <Input
                id="deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="text-sm"
              />
            </div>

            {/* KPI Targets */}
            <div className="space-y-1.5">
              <Label htmlFor="kpiTargets" className="flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-muted-foreground" />
                Target KPI <span className="text-muted-foreground text-xs">(optional — satu per baris)</span>
              </Label>
              <Textarea
                id="kpiTargets"
                placeholder={"Dokumen sertifikasi ISO 9001 tersertifikasi\nTingkat kelulusan peserta ≥ 85%\nDeadline deliver dalam 60 hari"}
                value={kpiText}
                onChange={(e) => setKpiText(e.target.value)}
                rows={3}
                className="text-sm"
              />
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-3">Pipeline — 8 Stages</p>
            <div className="flex flex-wrap gap-2">
              {PIPELINE_STAGES.map((s, i) => (
                <div
                  key={s.name}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border",
                    s.type === "gate"
                      ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
                      : "border-border bg-muted/50 text-muted-foreground"
                  )}
                >
                  <span className="font-medium text-foreground/50">{i + 1}.</span>
                  <span className="font-medium">{s.name}</span>
                  {s.type === "gate" && <span className="text-amber-500">⬡</span>}
                </div>
              ))}
            </div>
          </div>

          <Button
            className="w-full gap-2"
            disabled={!name.trim() || createWorkroom.isPending}
            onClick={handleCreate}
          >
            {createWorkroom.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating…
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Create Workroom
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
