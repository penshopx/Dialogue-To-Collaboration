import { useGetWorkroom, useListWorkroomStages, useListWorkroomTasks, useListWorkroomActivity, useListDecisionLogs, useListStageExitCriteria } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import {
  ArrowLeft, CheckCircle2, Circle, Clock, AlertTriangle,
  FileText, Brain, Shield, Wrench, Star, CheckSquare, Bot,
  Printer, Calendar, Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const STAGE_STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: "Pending", color: "text-muted-foreground", icon: Circle },
  active: { label: "Aktif", color: "text-blue-400", icon: Clock },
  completed: { label: "Selesai", color: "text-green-400", icon: CheckCircle2 },
  awaiting_gate: { label: "Menunggu Gate", color: "text-amber-400", icon: AlertTriangle },
  approved: { label: "Disetujui", color: "text-green-400", icon: CheckCircle2 },
  rejected: { label: "Ditolak", color: "text-red-400", icon: AlertTriangle },
};

const ROLE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  strategis: { label: "Strategis", icon: Brain, color: "text-blue-400" },
  skeptis: { label: "Skeptis", icon: Shield, color: "text-red-400" },
  eksekutor: { label: "Eksekutor", icon: Wrench, color: "text-amber-400" },
  narasumber: { label: "Narasumber", icon: Star, color: "text-green-400" },
  pack_compiler: { label: "DocuGen", icon: FileText, color: "text-purple-400" },
  evaluator: { label: "Evaluator", icon: CheckSquare, color: "text-cyan-400" },
};

export default function WorkroomReport() {
  const { id } = useParams<{ id: string }>();
  const workroomId = parseInt(id ?? "0");

  const { data: workroom, isLoading } = useGetWorkroom(workroomId);
  const { data: stages } = useListWorkroomStages(workroomId);
  const { data: tasks } = useListWorkroomTasks(workroomId);
  const { data: activity } = useListWorkroomActivity(workroomId);
  const { data: decisionLogs } = useListDecisionLogs(workroomId);
  const firstStageId = stages?.[0]?.id;
  const { data: exitCriteriaStage1 } = useListStageExitCriteria(workroomId, firstStageId ?? 0);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto py-8">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-full" />
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
      </div>
    );
  }

  if (!workroom || !stages) return null;

  const totalTasks = tasks?.length ?? 0;
  const doneTasks = tasks?.filter(t => t.status === "done").length ?? 0;
  const gateApprovals = stages.filter(s => s.stageType === "gate" && s.gateDecision === "approved").length;
  const gateRejections = stages.filter(s => s.stageType === "gate" && s.gateDecision === "rejected").length;

  const tasksByRole: Record<string, { total: number; done: number }> = {};
  for (const t of tasks ?? []) {
    const r = t.assigneeRole ?? "unknown";
    if (!tasksByRole[r]) tasksByRole[r] = { total: 0, done: 0 };
    tasksByRole[r].total++;
    if (t.status === "done") tasksByRole[r].done++;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex items-center gap-3 print:hidden">
        <Link href={`/workrooms/${workroomId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <span className="text-muted-foreground text-sm">Kembali ke Workroom</span>
        <div className="ml-auto">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.print()}>
            <Printer className="w-3.5 h-3.5" />
            Cetak / Ekspor PDF
          </Button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-3 pb-6 border-b border-border">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <FileText className="w-5 h-5 text-primary" />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Laporan Workroom</span>
              </div>
              <h1 className="text-2xl font-bold">{workroom.name}</h1>
              {workroom.objective && (
                <p className="text-muted-foreground mt-1">{workroom.objective}</p>
              )}
            </div>
            <Badge
              variant="outline"
              className={cn(
                workroom.status === "completed" ? "border-green-500/40 text-green-400" :
                workroom.status === "active" ? "border-blue-500/40 text-blue-400" : ""
              )}
            >
              {workroom.status}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="w-3.5 h-3.5" />
            <span>Dibuat: {new Date(workroom.createdAt).toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })}</span>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress keseluruhan</span>
              <span className="font-semibold">{workroom.progress}%</span>
            </div>
            <Progress value={workroom.progress} className="h-2" />
          </div>
        </div>

        {/* KPI Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Task Selesai", value: `${doneTasks}/${totalTasks}`, icon: CheckCircle2, color: "text-green-400" },
            { label: "Gate Disetujui", value: gateApprovals, icon: CheckCircle2, color: "text-green-400" },
            { label: "Gate Ditolak", value: gateRejections, icon: AlertTriangle, color: "text-red-400" },
            { label: "Stage Aktif", value: workroom.currentStageName, icon: Target, color: "text-blue-400" },
          ].map(k => {
            const Icon = k.icon;
            return (
              <div key={k.label} className="p-3 rounded-lg border border-border bg-card/50 text-center">
                <Icon className={cn("w-4 h-4 mx-auto mb-1", k.color)} />
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <p className="font-bold text-sm mt-0.5 truncate">{k.value}</p>
              </div>
            );
          })}
        </div>

        {/* Stage-by-stage breakdown */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Ringkasan per Stage</h2>
          <div className="space-y-5">
            {stages.map(stage => {
              const conf = STAGE_STATUS_CONFIG[stage.status] ?? STAGE_STATUS_CONFIG.pending;
              const Icon = conf.icon;
              const stageTasks = tasks?.filter(t => t.stageId === stage.id) ?? [];
              const stageTasksDone = stageTasks.filter(t => t.status === "done").length;
              const isGate = stage.stageType === "gate";
              const hasContent = stage.notes || (stageTasks.length > 0) || stage.gateDecision;

              return (
                <div key={stage.id} className={cn("rounded-lg border p-4 space-y-3", isGate ? "border-amber-500/20 bg-amber-500/5" : "border-border bg-card/30")}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className={cn("w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold bg-muted shrink-0", conf.color)}>
                        {stage.order}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{stage.name}</span>
                          {isGate && <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-400 py-0 h-4">GATE</Badge>}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Icon className={cn("w-3 h-3", conf.color)} />
                          <span className={cn("text-xs", conf.color)}>{conf.label}</span>
                          {stage.completedAt && (
                            <span className="text-xs text-muted-foreground ml-1">
                              · {new Date(stage.completedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {stageTasks.length > 0 && (
                      <span className="text-xs text-muted-foreground shrink-0">{stageTasksDone}/{stageTasks.length} task</span>
                    )}
                  </div>

                  {stage.notes && (
                    <div className="bg-background/60 rounded p-3 border border-border/50">
                      <p className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
                        <FileText className="w-3 h-3" /> Catatan Stage
                      </p>
                      <p className="text-sm whitespace-pre-wrap">{stage.notes}</p>
                    </div>
                  )}

                  {stage.gateDecision && (
                    <div className={cn("rounded p-3 border", stage.gateDecision === "approved" ? "bg-green-500/5 border-green-500/20" : "bg-red-500/5 border-red-500/20")}>
                      <div className="flex items-center gap-2">
                        {stage.gateDecision === "approved"
                          ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                          : <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                        }
                        <span className="text-xs font-semibold">
                          Gate {stage.gateDecision === "approved" ? "Disetujui" : "Ditolak"}
                        </span>
                      </div>
                      {stage.gateNote && <p className="text-xs text-muted-foreground mt-1.5">{stage.gateNote}</p>}
                    </div>
                  )}

                  {stageTasks.length > 0 && (
                    <div className="space-y-1.5">
                      {stageTasks.map(task => {
                        const RoleCfg = ROLE_CONFIG[task.assigneeRole ?? ""] ?? { label: task.assigneeRole ?? "", icon: Bot, color: "text-muted-foreground" };
                        const RoleIcon = RoleCfg.icon;
                        return (
                          <div key={task.id} className="flex items-center gap-2 text-sm">
                            {task.status === "done"
                              ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                              : task.status === "doing"
                              ? <Clock className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                              : <Circle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            }
                            <span className={cn("flex-1 text-xs", task.status === "done" && "line-through text-muted-foreground")}>{task.title}</span>
                            {task.assigneeRole && (
                              <div className={cn("flex items-center gap-0.5 text-[10px]", RoleCfg.color)}>
                                <RoleIcon className="w-3 h-3" />
                                <span>{RoleCfg.label}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {!hasContent && <p className="text-xs text-muted-foreground italic">Stage belum dimulai.</p>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Agent contribution summary */}
        {Object.keys(tasksByRole).length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Kontribusi Agen</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(tasksByRole).map(([role, stats]) => {
                const cfg = ROLE_CONFIG[role] ?? { label: role, icon: Bot, color: "text-muted-foreground" };
                const Icon = cfg.icon;
                const pct = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
                return (
                  <div key={role} className="p-3 rounded-lg border border-border bg-card/50 space-y-2">
                    <div className="flex items-center gap-2">
                      <Icon className={cn("w-4 h-4 shrink-0", cfg.color)} />
                      <span className="text-sm font-medium">{cfg.label}</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{stats.done}/{stats.total} task</span>
                      <span className={pct === 100 ? "text-green-400 font-medium" : ""}>{pct}%</span>
                    </div>
                    <Progress value={pct} className="h-1" />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Decision Logs */}
        {decisionLogs && decisionLogs.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Log Keputusan</h2>
            <div className="space-y-3">
              {decisionLogs.map(log => {
                const isGateApproval = log.tipeAksi === "keputusan_gate" && log.ringkasan?.toLowerCase().includes("setuju");
                const isGateRejection = log.tipeAksi === "keputusan_gate" && (log.ringkasan?.toLowerCase().includes("tolak") || log.ringkasan?.toLowerCase().includes("revisi"));
                return (
                  <div key={log.id} className={cn(
                    "rounded-lg border p-3 space-y-1",
                    isGateApproval ? "border-green-500/20 bg-green-500/5" :
                    isGateRejection ? "border-red-500/20 bg-red-500/5" :
                    "border-border bg-card/30"
                  )}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {isGateApproval && <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />}
                        {isGateRejection && <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                        {!isGateApproval && !isGateRejection && <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                        <span className="text-sm font-medium">{log.ringkasan}</span>
                      </div>
                      <Badge variant="outline" className="text-[10px] py-0 h-4 shrink-0">{log.tipeAksi}</Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {log.aktor} · {new Date(log.createdAt).toLocaleString("id-ID")}
                    </p>
                    {log.detail && (
                      <p className="text-xs text-muted-foreground/70 mt-1 whitespace-pre-line line-clamp-3">
                        {(log.detail as { text?: string }).text ?? JSON.stringify(log.detail)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Activity log */}
        {activity && activity.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Log Aktivitas</h2>
            <div className="space-y-2.5">
              {activity.map(entry => (
                <div key={entry.id} className="flex items-start gap-3 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 mt-2 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{entry.description}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {entry.actor ?? "System"} · {new Date(entry.createdAt).toLocaleString("id-ID")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Separator />
        <p className="text-xs text-muted-foreground text-center pb-4">
          Laporan dibuat oleh CollabBuilder · {new Date().toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>
    </div>
  );
}
