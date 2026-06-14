import { useListWorkroomTasks, useListKnowledgeItems, useGetWorkroomBrain, useGetWorkroomConfig, useListDeliverables } from "@workspace/api-client-react";
import type { WorkroomStage } from "@workspace/api-client-react";
import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  workroomId: number;
  stages: WorkroomStage[];
}

interface Dimension {
  label: string;
  icon: string;
  score: number;
  detail: string;
  color: string;
}

export function WorkroomHealth({ workroomId, stages }: Props) {
  const { data: tasks = [] } = useListWorkroomTasks(workroomId);
  const { data: kbItems = [] } = useListKnowledgeItems(workroomId);
  const { data: brain } = useGetWorkroomBrain(workroomId);
  const { data: config } = useGetWorkroomConfig(workroomId);
  const { data: deliverables = [] } = useListDeliverables(workroomId);

  /* ── Score computations ── */
  const pipelineScore = (() => {
    if (stages.length === 0) return 0;
    const done = stages.filter(s => s.status === "completed").length;
    const tasksDone = tasks.filter(t => t.status === "done").length;
    const tasksTotal = tasks.length;
    const stageScore = (done / stages.length) * 60;
    const taskScore = tasksTotal > 0 ? (tasksDone / tasksTotal) * 40 : 0;
    return Math.round(stageScore + taskScore);
  })();

  const knowledgeScore = (() => {
    const articleScore = Math.min(kbItems.length * 10, 60);
    const layerKeys = new Set(kbItems.map((i: { layer?: string }) => i.layer ?? "operational"));
    const layerScore = layerKeys.size >= 3 ? 40 : layerKeys.size * 13;
    return Math.min(Math.round(articleScore + layerScore), 100);
  })();

  const brainScore = (() => {
    if (!brain) return 0;
    const fields = [brain.context, brain.goals, brain.constraints, brain.stakeholders, brain.decisions];
    const filled = fields.filter(f => f && f.trim().length > 0).length;
    return Math.round((filled / fields.length) * 100);
  })();

  const agenScore = (() => {
    if (!config) return 0;
    let score = 0;
    if (config.personaName) score += 20;
    if (config.personaDesc) score += 15;
    try {
      const policies = JSON.parse(config.policies ?? "{}");
      if (typeof policies === "object" && !Array.isArray(policies)) {
        const filled = Object.values(policies).filter((v): v is string => typeof v === "string" && v.trim().length > 0).length;
        score += Math.round((filled / 7) * 65);
      }
    } catch { /* skip */ }
    return Math.min(score, 100);
  })();

  const deliverableScore = (() => {
    if (deliverables.length === 0) return 0;
    const approved = deliverables.filter(d => d.status === "approved").length;
    const final = deliverables.filter(d => d.status === "final").length;
    return Math.min(Math.round((approved * 20 + final * 10 + (deliverables.length - approved - final) * 5)), 100);
  })();

  const overallScore = Math.round((pipelineScore + knowledgeScore + brainScore + agenScore + deliverableScore) / 5);

  const dimensions: Dimension[] = [
    {
      label: "Pipeline",
      icon: "⚡",
      score: pipelineScore,
      detail: `${stages.filter(s => s.status === "completed").length}/${stages.length} stage`,
      color: "text-blue-400",
    },
    {
      label: "Knowledge",
      icon: "📚",
      score: knowledgeScore,
      detail: `${kbItems.length} artikel`,
      color: "text-sky-400",
    },
    {
      label: "Brain",
      icon: "🧠",
      score: brainScore,
      detail: `${Object.values({ context: brain?.context, goals: brain?.goals, constraints: brain?.constraints, stakeholders: brain?.stakeholders, decisions: brain?.decisions }).filter(v => v?.trim()).length}/5 field`,
      color: "text-purple-400",
    },
    {
      label: "Agen",
      icon: "🤖",
      score: agenScore,
      detail: config?.personaName ? config.personaName.slice(0, 12) : "Belum dikonfigurasi",
      color: "text-amber-400",
    },
    {
      label: "Output",
      icon: "📦",
      score: deliverableScore,
      detail: `${deliverables.length} deliverable`,
      color: "text-green-400",
    },
  ];

  const getScoreColor = (s: number) =>
    s >= 80 ? "text-green-400" : s >= 60 ? "text-amber-400" : s >= 30 ? "text-orange-400" : "text-red-400";
  const getBarColor = (s: number) =>
    s >= 80 ? "bg-green-400" : s >= 60 ? "bg-amber-400" : s >= 30 ? "bg-orange-400" : "bg-red-400";
  const getLabel = (s: number) =>
    s >= 80 ? "Excellent" : s >= 60 ? "Good" : s >= 40 ? "Fair" : "Needs Work";

  return (
    <div className="flex items-stretch gap-3 p-3 rounded-xl border border-border/50 bg-muted/20">
      {/* Overall ring */}
      <div className="flex flex-col items-center justify-center shrink-0 gap-0.5 px-2">
        <div className="relative w-14 h-14">
          <svg viewBox="0 0 56 56" className="w-14 h-14 -rotate-90">
            <circle cx="28" cy="28" r="24" fill="none" stroke="currentColor" strokeWidth="4" className="text-muted/40" />
            <circle
              cx="28" cy="28" r="24" fill="none" strokeWidth="4"
              className={getBarColor(overallScore).replace("bg-", "text-")}
              strokeDasharray={`${(overallScore / 100) * 150.8} 150.8`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn("text-sm font-bold", getScoreColor(overallScore))}>{overallScore}</span>
          </div>
        </div>
        <p className="text-[9px] font-medium text-muted-foreground">{getLabel(overallScore)}</p>
        <div className="flex items-center gap-0.5">
          <Activity className="w-2.5 h-2.5 text-muted-foreground/60" />
          <p className="text-[9px] text-muted-foreground/60">Health</p>
        </div>
      </div>

      {/* Dimension bars */}
      <div className="flex-1 grid grid-cols-5 gap-2">
        {dimensions.map(dim => (
          <div key={dim.label} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">{dim.icon} {dim.label}</span>
              <span className={cn("text-[10px] font-bold", getScoreColor(dim.score))}>{dim.score}</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all duration-500", getBarColor(dim.score))}
                style={{ width: `${dim.score}%` }}
              />
            </div>
            <p className="text-[9px] text-muted-foreground truncate">{dim.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
