import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import {
  Wand2, Users, GitBranch, Shield, FileText, Package,
  ChevronRight, ChevronLeft, Check, Plus, Trash2,
  AlertTriangle, Brain, Wrench, Star, Loader2, Target,
  Clock, TrendingUp, BookOpen, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useListTemplates, useListAgents, useListTemplateStages, useListTemplateRoles, useCreateWorkroom } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

const STORAGE_KEY = "collab-wizard-state";

interface WizardState {
  // Step 1 — Spec
  name: string;
  objective: string;
  kpiTargets: string[];
  deadline: string;
  riskLevel: "low" | "medium" | "high";
  constraints: string;
  // Step 2 — Team
  templateId: number | null;
  selectedRoles: { namaPeran: string; fungsiPeran: string; agentId?: number; agentName?: string }[];
  teamMode: "template" | "manual";
  // Step 3 — Workflow
  workflowStages: { namaTahap: string; tipeTahap: "kerja" | "gate"; polaOperan: string; order: number }[];
  // Step 4 — Gates
  gateConfig: Record<number, { gateType: string; picName: string; responseHours: number; autoReject: string[]; requiredEvidence: string[] }>;
  // Step 5 — Logging
  loggingConfig: {
    decisionLog: boolean;
    assumptionLog: boolean;
    riskRegister: boolean;
    changeLog: boolean;
    meetingNotes: boolean;
    autoSummaryDaily: boolean;
    autoSummaryGate: boolean;
    evidenceRequired: "strict" | "optional" | "auto";
    retentionPolicy: string;
  };
  // Step 6 — Deliverables
  outputTypes: string[];
  outputFormat: "pdf" | "zip" | "notion" | "gdrive";
  versioningMode: "final" | "draft" | "controlled";
  approvalWorkflow: "single" | "sequential" | "parallel";
}

const DEFAULT_STATE: WizardState = {
  name: "",
  objective: "",
  kpiTargets: [],
  deadline: "",
  riskLevel: "medium",
  constraints: "",
  templateId: null,
  selectedRoles: [],
  teamMode: "template",
  workflowStages: [],
  gateConfig: {},
  loggingConfig: {
    decisionLog: true,
    assumptionLog: true,
    riskRegister: true,
    changeLog: false,
    meetingNotes: false,
    autoSummaryDaily: false,
    autoSummaryGate: true,
    evidenceRequired: "optional",
    retentionPolicy: "3 tahun",
  },
  outputTypes: [],
  outputFormat: "pdf",
  versioningMode: "controlled",
  approvalWorkflow: "sequential",
};

const KPI_OPTIONS = [
  { id: "win-rate", label: "Win-rate", icon: Target },
  { id: "decision-latency", label: "Decision Latency", icon: Clock },
  { id: "rework-rate", label: "Rework Rate", icon: TrendingUp },
  { id: "compliance-rate", label: "Compliance Pass Rate", icon: Check },
  { id: "margin-target", label: "Margin Target", icon: BookOpen },
];

const OUTPUT_TYPES = [
  "Tender Submission Pack", "Proposal Penawaran", "SOP Set",
  "Audit Report + CAPA", "Progress Report", "Risk Register",
  "Meeting Minutes",
];

const ROLE_ICON: Record<string, React.ElementType> = {
  strategis: Brain,
  skeptis: Shield,
  eksekutor: Wrench,
  narasumber: Star,
  pack_compiler: FileText,
};

const ROLE_COLOR: Record<string, string> = {
  strategis: "text-blue-400 bg-blue-400/10 border-blue-400/30",
  skeptis: "text-red-400 bg-red-400/10 border-red-400/30",
  eksekutor: "text-amber-400 bg-amber-400/10 border-amber-400/30",
  narasumber: "text-green-400 bg-green-400/10 border-green-400/30",
  pack_compiler: "text-purple-400 bg-purple-400/10 border-purple-400/30",
};

const STAGE_TYPE_COLOR = {
  kerja: "bg-blue-500/10 border-blue-500/30 text-blue-400",
  gate: "bg-amber-500/10 border-amber-500/30 text-amber-400",
};

const STEPS = [
  { id: 1, label: "Spec", icon: FileText, desc: "Tujuan & KPI" },
  { id: 2, label: "Team", icon: Users, desc: "Rakit Tim Agen" },
  { id: 3, label: "Workflow", icon: GitBranch, desc: "Pipeline & Pola" },
  { id: 4, label: "Gates", icon: Shield, desc: "Titik Keputusan" },
  { id: 5, label: "Logging", icon: BookOpen, desc: "Jejak Keputusan" },
  { id: 6, label: "Deliverables", icon: Package, desc: "Format Output" },
];

export default function CollaborationWizard() {
  const [step, setStep] = useState(1);
  const [state, setState] = useState<WizardState>(DEFAULT_STATE);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: templates } = useListTemplates();
  const { data: agents } = useListAgents();
  const { data: templateStages } = useListTemplateStages(state.templateId ?? 0);
  const { data: templateRoles } = useListTemplateRoles(state.templateId ?? 0);
  const createWorkroom = useCreateWorkroom();

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setState(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    if (state.templateId && templateStages && templateStages.length > 0 && state.workflowStages.length === 0) {
      setState(prev => ({
        ...prev,
        workflowStages: templateStages.map((s, i) => ({
          namaTahap: s.namaTahap,
          tipeTahap: (s.tipeTahap as "kerja" | "gate"),
          polaOperan: s.polaOperan,
          order: i + 1,
        })),
      }));
    }
  }, [templateStages, state.templateId, state.workflowStages.length]);

  useEffect(() => {
    if (state.templateId && templateRoles && templateRoles.length > 0 && state.selectedRoles.length === 0 && state.teamMode === "template") {
      setState(prev => ({
        ...prev,
        selectedRoles: templateRoles.map(r => ({
          namaPeran: r.namaPeran,
          fungsiPeran: r.fungsiPeran,
          agentId: r.agentId ?? undefined,
        })),
      }));
    }
  }, [templateRoles, state.templateId, state.selectedRoles.length, state.teamMode]);

  const update = useCallback(<K extends keyof WizardState>(key: K, value: WizardState[K]) => {
    setState(prev => ({ ...prev, [key]: value }));
  }, []);

  async function handleGenerate() {
    if (!state.name.trim() || !state.templateId) {
      toast({ title: "Nama workroom dan template wajib diisi", variant: "destructive" });
      return;
    }
    await createWorkroom.mutateAsync({
      data: {
        name: state.name.trim(),
        templateId: state.templateId,
        objective: state.objective.trim() || undefined,
        riskLevel: state.riskLevel,
        deadline: state.deadline || undefined,
        kpiTargets: state.kpiTargets.length > 0 ? { targets: state.kpiTargets } : undefined,
      },
    }, {
      onSuccess: (workroom) => {
        localStorage.removeItem(STORAGE_KEY);
        toast({ title: "Workroom berhasil dibuat ✓" });
        navigate(`/workrooms/${workroom.id}`);
      },
      onError: () => toast({ title: "Gagal membuat workroom", variant: "destructive" }),
    });
  }

  const canProceed = (() => {
    if (step === 1) return state.name.trim().length > 0;
    if (step === 2) return state.templateId !== null;
    return true;
  })();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <Wand2 className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">Collaboration Wizard</h1>
          </div>
          <p className="text-sm text-muted-foreground">Rakit tim agen, workflow, dan gate dalam 6 langkah</p>
        </div>

        {/* Step Nav */}
        <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-2">
          {STEPS.map((s, idx) => {
            const Icon = s.icon;
            const isActive = step === s.id;
            const isDone = step > s.id;
            return (
              <div key={s.id} className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setStep(s.id)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors",
                    isActive ? "bg-primary text-primary-foreground" :
                    isDone ? "bg-primary/20 text-primary hover:bg-primary/30" :
                    "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  {isDone ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                  <span>{s.label}</span>
                </button>
                {idx < STEPS.length - 1 && <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />}
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <div className="rounded-xl border bg-card/50 p-6 min-h-[480px]">
          {step === 1 && <StepSpec state={state} update={update} />}
          {step === 2 && <StepTeam state={state} update={update} templates={templates ?? []} agents={agents ?? []} />}
          {step === 3 && <StepWorkflow state={state} update={update} />}
          {step === 4 && <StepGates state={state} update={update} />}
          {step === 5 && <StepLogging state={state} update={update} />}
          {step === 6 && <StepDeliverables state={state} update={update} />}
        </div>

        {/* Nav Buttons */}
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => setStep(s => Math.max(1, s - 1))}
            disabled={step === 1}
          >
            <ChevronLeft className="w-4 h-4 mr-1.5" /> Sebelumnya
          </Button>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Langkah {step} dari 6</span>
            {[1,2,3,4,5,6].map(s => (
              <div key={s} className={cn("w-1.5 h-1.5 rounded-full", s === step ? "bg-primary" : s < step ? "bg-primary/40" : "bg-muted")} />
            ))}
          </div>

          {step < 6 ? (
            <Button onClick={() => setStep(s => Math.min(6, s + 1))} disabled={!canProceed}>
              Lanjut <ChevronRight className="w-4 h-4 ml-1.5" />
            </Button>
          ) : (
            <Button onClick={handleGenerate} disabled={createWorkroom.isPending || !state.name.trim() || !state.templateId} className="gap-2">
              {createWorkroom.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              Generate Workroom
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Step 1: Spec ──────────────────────────────────────────────────────────────
function StepSpec({ state, update }: { state: WizardState; update: (k: keyof WizardState, v: WizardState[typeof k]) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold mb-1">Spesifikasi Workroom</h2>
        <p className="text-sm text-muted-foreground">Definisikan tujuan, KPI, dan parameter risiko workroom ini.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2 space-y-1.5">
          <Label className="text-xs">Nama Workroom <span className="text-red-400">*</span></Label>
          <Input
            value={state.name}
            onChange={e => update("name", e.target.value)}
            placeholder="cth: Tender Jembatan XYZ – Mei 2026"
            className="text-sm"
          />
        </div>

        <div className="sm:col-span-2 space-y-1.5">
          <Label className="text-xs">Tujuan / Outcome <span className="text-muted-foreground">(opsional)</span></Label>
          <Textarea
            rows={2}
            value={state.objective}
            onChange={e => update("objective", e.target.value)}
            placeholder="Apa hasil akhir yang ingin dicapai?"
            className="text-sm resize-none"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Deadline</Label>
          <Input
            type="date"
            value={state.deadline}
            onChange={e => update("deadline", e.target.value)}
            className="text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Level Risiko</Label>
          <div className="flex gap-2">
            {(["low", "medium", "high"] as const).map(level => (
              <button
                key={level}
                onClick={() => update("riskLevel", level)}
                className={cn(
                  "flex-1 py-2 rounded-md border text-xs font-medium transition-colors capitalize",
                  state.riskLevel === level
                    ? level === "low" ? "bg-green-500/20 border-green-500/50 text-green-400"
                      : level === "medium" ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                      : "bg-red-500/20 border-red-500/50 text-red-400"
                    : "border-border text-muted-foreground hover:border-border/80"
                )}
              >
                {level === "low" ? "Rendah" : level === "medium" ? "Sedang" : "Tinggi"}
              </button>
            ))}
          </div>
        </div>

        <div className="sm:col-span-2 space-y-1.5">
          <Label className="text-xs">KPI Utama <span className="text-muted-foreground">(pilih semua yang relevan)</span></Label>
          <div className="flex flex-wrap gap-2">
            {KPI_OPTIONS.map(kpi => {
              const isSelected = state.kpiTargets.includes(kpi.id);
              const Icon = kpi.icon;
              return (
                <button
                  key={kpi.id}
                  onClick={() => update("kpiTargets", isSelected ? state.kpiTargets.filter(k => k !== kpi.id) : [...state.kpiTargets, kpi.id])}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors",
                    isSelected ? "bg-primary/20 border-primary/50 text-primary" : "border-border text-muted-foreground hover:border-border/80"
                  )}
                >
                  <Icon className="w-3 h-3" />
                  {kpi.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="sm:col-span-2 space-y-1.5">
          <Label className="text-xs">Batasan / Kendala <span className="text-muted-foreground">(opsional)</span></Label>
          <Textarea
            rows={2}
            value={state.constraints}
            onChange={e => update("constraints", e.target.value)}
            placeholder="Regulasi, resource terbatas, dependensi eksternal…"
            className="text-sm resize-none"
          />
        </div>
      </div>
    </div>
  );
}

// ── Step 2: Team ──────────────────────────────────────────────────────────────
function StepTeam({ state, update, templates, agents }: {
  state: WizardState;
  update: (k: keyof WizardState, v: WizardState[typeof k]) => void;
  templates: { id: number; name: string; sector: string }[];
  agents: { id: number; name: string; functionRole: string; category: string; isCoreTeam?: boolean | null }[];
}) {
  const coreTeam = agents.filter(a => a.isCoreTeam);
  const specialists = agents.filter(a => !a.isCoreTeam);

  function addRole(role: string, agentId?: number, agentName?: string) {
    update("selectedRoles", [
      ...state.selectedRoles,
      { namaPeran: agentName ?? role, fungsiPeran: role, agentId, agentName },
    ]);
  }

  function removeRole(idx: number) {
    update("selectedRoles", state.selectedRoles.filter((_, i) => i !== idx));
  }

  const REQUIRED_ROLES = ["strategis", "skeptis", "eksekutor"];
  const missingRoles = REQUIRED_ROLES.filter(r => !state.selectedRoles.some(sr => sr.fungsiPeran === r));

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold mb-1">Rakit Tim Agen</h2>
        <p className="text-sm text-muted-foreground">Pilih template atau rakit manual. Trio inti (Strategis + Skeptis + Eksekutor) wajib ada.</p>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-2">
        {(["template", "manual"] as const).map(mode => (
          <button
            key={mode}
            onClick={() => update("teamMode", mode)}
            className={cn(
              "px-4 py-2 rounded-lg border text-sm font-medium transition-colors",
              state.teamMode === mode ? "bg-primary/20 border-primary/50 text-primary" : "border-border text-muted-foreground"
            )}
          >
            {mode === "template" ? "📦 Mode Template" : "🛠 Rakit Manual"}
          </button>
        ))}
      </div>

      {state.teamMode === "template" && (
        <div className="space-y-2">
          <Label className="text-xs">Pilih Template <span className="text-red-400">*</span></Label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 max-h-48 overflow-y-auto">
            {templates.map(t => (
              <button
                key={t.id}
                onClick={() => {
                  update("templateId", t.id);
                  update("selectedRoles", []);
                  update("workflowStages", []);
                }}
                className={cn(
                  "text-left p-3 rounded-lg border text-sm transition-colors",
                  state.templateId === t.id ? "bg-primary/10 border-primary/50" : "border-border hover:border-border/80 hover:bg-accent/50"
                )}
              >
                <div className="font-medium text-xs">{t.name}</div>
                <div className="text-[11px] text-muted-foreground">{t.sector}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {state.teamMode === "manual" && (
        <div className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground mb-2">Core Trio (wajib)</p>
            <div className="flex gap-2">
              {coreTeam.map(a => {
                const Icon = ROLE_ICON[a.functionRole] ?? Brain;
                return (
                  <button
                    key={a.id}
                    onClick={() => addRole(a.functionRole, a.id, a.name)}
                    className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium", ROLE_COLOR[a.functionRole])}
                  >
                    <Icon className="w-3 h-3" /> {a.name}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-2">Spesialis Domain</p>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
              {specialists.map(a => (
                <button
                  key={a.id}
                  onClick={() => addRole(a.functionRole, a.id, a.name)}
                  className="px-2.5 py-1 rounded-full border border-border text-xs text-muted-foreground hover:text-foreground hover:border-border/80 transition-colors"
                >
                  + {a.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Selected Roles */}
      {state.selectedRoles.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground font-medium">Tim terpilih ({state.selectedRoles.length})</p>
          <div className="flex flex-wrap gap-1.5">
            {state.selectedRoles.map((role, idx) => {
              const Icon = ROLE_ICON[role.fungsiPeran] ?? Brain;
              return (
                <div key={idx} className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium", ROLE_COLOR[role.fungsiPeran])}>
                  <Icon className="w-3 h-3" />
                  {role.namaPeran}
                  <button onClick={() => removeRole(idx)} className="ml-0.5 opacity-60 hover:opacity-100">
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {missingRoles.length > 0 && state.selectedRoles.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-400/5 border border-amber-400/20 rounded-lg px-3 py-2">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          Peran wajib belum ada: {missingRoles.join(", ")}
        </div>
      )}
    </div>
  );
}

// ── Step 3: Workflow ──────────────────────────────────────────────────────────
function StepWorkflow({ state, update }: { state: WizardState; update: (k: keyof WizardState, v: WizardState[typeof k]) => void }) {
  const stages = state.workflowStages;

  function addStage() {
    update("workflowStages", [...stages, { namaTahap: "Tahap Baru", tipeTahap: "kerja", polaOperan: "sequential", order: stages.length + 1 }]);
  }

  function updateStage(idx: number, field: string, value: string) {
    update("workflowStages", stages.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  }

  function removeStage(idx: number) {
    update("workflowStages", stages.filter((_, i) => i !== idx).map((s, i) => ({ ...s, order: i + 1 })));
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold mb-1">Konfigurasi Workflow</h2>
          <p className="text-sm text-muted-foreground">Atur pipeline tahapan dan pola operan setiap tahap.</p>
        </div>
        <Button size="sm" variant="outline" onClick={addStage} className="gap-1.5 text-xs">
          <Plus className="w-3.5 h-3.5" /> Tambah Tahap
        </Button>
      </div>

      {stages.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <GitBranch className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Pilih template di langkah 2 untuk auto-load tahapan,</p>
          <p className="text-sm">atau klik "Tambah Tahap" untuk rakit manual.</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {stages.map((stage, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 rounded-lg border bg-card/30">
              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold shrink-0">
                {idx + 1}
              </div>
              <Input
                value={stage.namaTahap}
                onChange={e => updateStage(idx, "namaTahap", e.target.value)}
                className="text-xs h-7 flex-1"
              />
              <div className="flex gap-1.5">
                {(["kerja", "gate"] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => updateStage(idx, "tipeTahap", type)}
                    className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-medium border transition-colors",
                      stage.tipeTahap === type ? STAGE_TYPE_COLOR[type] : "border-border text-muted-foreground"
                    )}
                  >
                    {type === "gate" ? "◆ Gate" : "Kerja"}
                  </button>
                ))}
              </div>
              <select
                value={stage.polaOperan}
                onChange={e => updateStage(idx, "polaOperan", e.target.value)}
                className="h-7 rounded-md border border-input bg-background px-2 text-[10px] text-muted-foreground"
              >
                <option value="sequential">Sequential</option>
                <option value="multiclaw">Multiclaw</option>
                <option value="ai_first_review">AI First</option>
                <option value="human_first_assist">Human First</option>
              </select>
              <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => removeStage(idx)}>
                <Trash2 className="w-3 h-3 text-muted-foreground" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Step 4: Gates ──────────────────────────────────────────────────────────────
function StepGates({ state, update }: { state: WizardState; update: (k: keyof WizardState, v: WizardState[typeof k]) => void }) {
  const gates = state.workflowStages.filter(s => s.tipeTahap === "gate");

  function updateGate(order: number, field: string, value: unknown) {
    update("gateConfig", {
      ...state.gateConfig,
      [order]: { ...state.gateConfig[order], [field]: value },
    });
  }

  function addEvidence(order: number, text: string) {
    const cfg = state.gateConfig[order] ?? { gateType: "qa", picName: "", responseHours: 24, autoReject: [], requiredEvidence: [] };
    updateGate(order, "requiredEvidence", [...(cfg.requiredEvidence ?? []), text]);
  }

  function addAutoReject(order: number, text: string) {
    const cfg = state.gateConfig[order] ?? { gateType: "qa", picName: "", responseHours: 24, autoReject: [], requiredEvidence: [] };
    updateGate(order, "autoReject", [...(cfg.autoReject ?? []), text]);
  }

  if (gates.length === 0) {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold mb-1">Konfigurasi Gate</h2>
          <p className="text-sm text-muted-foreground">Tidak ada gate dalam workflow ini. Tandai tahap sebagai "gate" di langkah 3.</p>
        </div>
        <div className="text-center py-12 text-muted-foreground">
          <Shield className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Belum ada gate yang dikonfigurasi.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold mb-1">Konfigurasi Gate</h2>
        <p className="text-sm text-muted-foreground">Atur tipe, PIC, bukti wajib, dan kondisi auto-reject untuk setiap gate.</p>
      </div>

      <div className="space-y-4 max-h-80 overflow-y-auto">
        {gates.map(gate => {
          const cfg = state.gateConfig[gate.order] ?? { gateType: "qa", picName: "", responseHours: 24, autoReject: [], requiredEvidence: [] };
          return (
            <div key={gate.order} className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
                <Shield className="w-3.5 h-3.5" />
                ◆ {gate.namaTahap}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px]">Tipe Gate</Label>
                  <select
                    value={cfg.gateType ?? "qa"}
                    onChange={e => updateGate(gate.order, "gateType", e.target.value)}
                    className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground"
                  >
                    <option value="skeptic">Skeptic Gate</option>
                    <option value="qa">QA Gate</option>
                    <option value="approval">Approval Gate</option>
                    <option value="compliance">Compliance Gate</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Waktu Respons (jam)</Label>
                  <Input
                    type="number"
                    value={cfg.responseHours ?? 24}
                    onChange={e => updateGate(gate.order, "responseHours", parseInt(e.target.value) || 24)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label className="text-[10px]">PIC (penanggung jawab)</Label>
                  <Input
                    value={cfg.picName ?? ""}
                    onChange={e => updateGate(gate.order, "picName", e.target.value)}
                    placeholder="cth: Branch Manager"
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <GateListEditor
                label="Bukti Wajib"
                items={cfg.requiredEvidence ?? []}
                onAdd={text => addEvidence(gate.order, text)}
                onRemove={i => updateGate(gate.order, "requiredEvidence", (cfg.requiredEvidence ?? []).filter((_, idx) => idx !== i))}
                placeholder="cth: Compliance matrix 100%"
                color="text-blue-400"
              />
              <GateListEditor
                label="Auto-Reject Conditions"
                items={cfg.autoReject ?? []}
                onAdd={text => addAutoReject(gate.order, text)}
                onRemove={i => updateGate(gate.order, "autoReject", (cfg.autoReject ?? []).filter((_, idx) => idx !== i))}
                placeholder="cth: Margin < 5% tanpa justifikasi"
                color="text-red-400"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GateListEditor({ label, items, onAdd, onRemove, placeholder, color }: {
  label: string; items: string[]; onAdd: (s: string) => void; onRemove: (i: number) => void; placeholder: string; color: string;
}) {
  const [input, setInput] = useState("");
  return (
    <div className="space-y-1.5">
      <p className={cn("text-[10px] font-medium", color)}>{label}</p>
      <div className="flex gap-1.5">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && input.trim()) { onAdd(input.trim()); setInput(""); } }}
          placeholder={placeholder}
          className="h-7 text-[11px]"
        />
        <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => { if (input.trim()) { onAdd(input.trim()); setInput(""); } }}>
          <Plus className="w-3 h-3" />
        </Button>
      </div>
      {items.map((item, i) => (
        <div key={i} className="flex items-center justify-between text-[11px] text-muted-foreground bg-muted/30 rounded px-2 py-1">
          <span>• {item}</span>
          <button onClick={() => onRemove(i)}><Trash2 className="w-2.5 h-2.5 opacity-50 hover:opacity-100" /></button>
        </div>
      ))}
    </div>
  );
}

// ── Step 5: Logging ───────────────────────────────────────────────────────────
function StepLogging({ state, update }: { state: WizardState; update: (k: keyof WizardState, v: WizardState[typeof k]) => void }) {
  const lc = state.loggingConfig;
  function updateLog<K extends keyof typeof lc>(key: K, value: (typeof lc)[K]) {
    update("loggingConfig", { ...lc, [key]: value });
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold mb-1">Konfigurasi Logging</h2>
        <p className="text-sm text-muted-foreground">Tentukan jenis log, bukti, dan kebijakan retensi untuk jejak audit.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Jenis Log</p>
          {([
            { key: "decisionLog", label: "Decision Log", desc: "Setiap keputusan tercatat" },
            { key: "assumptionLog", label: "Assumption Log", desc: "Asumsi yang diterima" },
            { key: "riskRegister", label: "Risk Register", desc: "Risiko teridentifikasi" },
            { key: "changeLog", label: "Change Log", desc: "Perubahan scope & rencana" },
            { key: "meetingNotes", label: "Meeting Notes", desc: "Notulen rapat" },
          ] as const).map(item => (
            <div key={item.key} className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium">{item.label}</p>
                <p className="text-[10px] text-muted-foreground">{item.desc}</p>
              </div>
              <Switch
                checked={lc[item.key]}
                onCheckedChange={v => updateLog(item.key, v)}
              />
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Auto Summary</p>
          {([
            { key: "autoSummaryDaily", label: "Ringkasan Harian" },
            { key: "autoSummaryGate", label: "Ringkasan per Gate" },
          ] as const).map(item => (
            <div key={item.key} className="flex items-center justify-between">
              <p className="text-xs font-medium">{item.label}</p>
              <Switch
                checked={lc[item.key]}
                onCheckedChange={v => updateLog(item.key, v)}
              />
            </div>
          ))}

          <div className="space-y-1.5 mt-3">
            <Label className="text-xs">Bukti Wajib</Label>
            <div className="flex gap-2">
              {(["strict", "optional", "auto"] as const).map(v => (
                <button
                  key={v}
                  onClick={() => updateLog("evidenceRequired", v)}
                  className={cn(
                    "flex-1 py-1.5 rounded border text-[10px] font-medium capitalize transition-colors",
                    lc.evidenceRequired === v ? "bg-primary/20 border-primary/50 text-primary" : "border-border text-muted-foreground"
                  )}
                >
                  {v === "strict" ? "Ketat" : v === "optional" ? "Opsional" : "Auto-capture"}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Retensi Data</Label>
            <select
              value={lc.retentionPolicy}
              onChange={e => updateLog("retentionPolicy", e.target.value)}
              className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground"
            >
              <option>1 tahun</option>
              <option>3 tahun</option>
              <option>5 tahun</option>
              <option>Permanent (audit-critical)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Step 6: Deliverables ──────────────────────────────────────────────────────
function StepDeliverables({ state, update }: { state: WizardState; update: (k: keyof WizardState, v: WizardState[typeof k]) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold mb-1">Konfigurasi Deliverables</h2>
        <p className="text-sm text-muted-foreground">Pilih jenis output, format, versioning, dan alur persetujuan.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-xs">Jenis Output</Label>
          <div className="space-y-1.5">
            {OUTPUT_TYPES.map(type => {
              const isSelected = state.outputTypes.includes(type);
              return (
                <button
                  key={type}
                  onClick={() => update("outputTypes", isSelected ? state.outputTypes.filter(t => t !== type) : [...state.outputTypes, type])}
                  className={cn(
                    "w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg border text-xs transition-colors",
                    isSelected ? "bg-primary/10 border-primary/50 text-primary" : "border-border text-muted-foreground hover:bg-accent/50"
                  )}
                >
                  {isSelected ? <Check className="w-3 h-3" /> : <div className="w-3 h-3 rounded border border-current opacity-30" />}
                  {type}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Format Final</Label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { value: "pdf", label: "📄 PDF Pack" },
                { value: "zip", label: "🗜 ZIP Files" },
                { value: "notion", label: "📝 Notion" },
                { value: "gdrive", label: "☁️ Google Drive" },
              ] as const).map(fmt => (
                <button
                  key={fmt.value}
                  onClick={() => update("outputFormat", fmt.value)}
                  className={cn(
                    "py-2 rounded-lg border text-xs font-medium transition-colors",
                    state.outputFormat === fmt.value ? "bg-primary/20 border-primary/50 text-primary" : "border-border text-muted-foreground"
                  )}
                >
                  {fmt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Versioning</Label>
            <div className="space-y-1.5">
              {([
                { value: "final", label: "v1.0 Final" },
                { value: "draft", label: "Draft (multiple revisions)" },
                { value: "controlled", label: "Controlled (with revision log)" },
              ] as const).map(v => (
                <button
                  key={v.value}
                  onClick={() => update("versioningMode", v.value)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-xs transition-colors",
                    state.versioningMode === v.value ? "bg-primary/10 border-primary/50 text-primary" : "border-border text-muted-foreground hover:bg-accent/50"
                  )}
                >
                  {state.versioningMode === v.value ? <Check className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border border-current opacity-30" />}
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Alur Persetujuan</Label>
            <div className="grid grid-cols-3 gap-1.5">
              {([
                { value: "single", label: "Single" },
                { value: "sequential", label: "Sequential" },
                { value: "parallel", label: "Parallel" },
              ] as const).map(a => (
                <button
                  key={a.value}
                  onClick={() => update("approvalWorkflow", a.value)}
                  className={cn(
                    "py-1.5 rounded border text-[11px] font-medium transition-colors",
                    state.approvalWorkflow === a.value ? "bg-primary/20 border-primary/50 text-primary" : "border-border text-muted-foreground"
                  )}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-2">
        <p className="text-xs font-semibold text-primary">Ringkasan Konfigurasi</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
          <span>Workroom: <span className="text-foreground font-medium">{state.name || "—"}</span></span>
          <span>Risiko: <Badge variant="outline" className="text-[10px] py-0 h-4">{state.riskLevel}</Badge></span>
          <span>Template ID: <span className="text-foreground">{state.templateId ?? "—"}</span></span>
          <span>Tahapan: <span className="text-foreground">{state.workflowStages.length}</span></span>
          <span>Gates: <span className="text-foreground">{state.workflowStages.filter(s => s.tipeTahap === "gate").length}</span></span>
          <span>Tim: <span className="text-foreground">{state.selectedRoles.length} peran</span></span>
          <span>Output: <span className="text-foreground">{state.outputTypes.length} jenis</span></span>
          <span>Format: <span className="text-foreground capitalize">{state.outputFormat}</span></span>
        </div>
      </div>
    </div>
  );
}
