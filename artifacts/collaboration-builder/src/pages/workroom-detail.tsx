import {
  useGetWorkroom,
  useListWorkroomStages,
  useListWorkroomTasks,
  useListWorkroomActivity,
  useUpdateWorkroomStage,
  useCompleteStage,
  useUpdateTask,
  useCreateWorkroomTask,
  useListCollaborationRoles,
  useAddCollaborationRole,
  useRemoveCollaborationRole,
  useListDecisionLogs,
  useAddDecisionLog,
  useCompileFinalPack,
  useListStageExitCriteria,
  useCreateStageExitCriteria,
  useUpdateStageExitCriteria,
  useDeleteStageExitCriteria,
} from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { useState } from "react";
import {
  ArrowLeft, CheckCircle2, Circle, Clock, Loader2, Plus,
  ChevronRight, AlertTriangle, FileText, MessageSquare, Bot,
  Shield, Wrench, Brain, Star, CheckSquare, ArrowRight,
  StickyNote, Save, ExternalLink, Kanban,
  Users, Trash2, Package, ScrollText, User, ClipboardList, BarChart3,
} from "lucide-react";
import { AgentChat } from "@/components/agent-chat";
import { KanbanBoard } from "@/components/kanban-board";
import { KnowledgeBaseTab } from "@/components/knowledge-base-tab";
import { ProjectBrainTab } from "@/components/project-brain-tab";
import { DeliverablesTab } from "@/components/deliverables-tab";
import { PersonaConfigTab } from "@/components/persona-config-tab";
import { MulticlawPanel } from "@/components/multiclaw-panel";
import { OpenclawChain } from "@/components/openclaw-chain";
import { SummaryTab } from "@/components/summary-tab";
import { MiniAppsTab } from "@/components/mini-apps-tab";
import { GateRubricPanel } from "@/components/gate-rubric-panel";
import { TaskDetailPanel, RoleBadge } from "@/components/task-detail-panel";
import { BriefMarketingTab } from "@/components/brief-marketing-tab";
import { WidgetTab } from "@/components/widget-tab";
import { WorkroomHealth } from "@/components/workroom-health";
import { RangkumanTab } from "@/components/rangkuman-tab";
import { MetricsTab } from "@/components/metrics-tab";
import { StageTimelineTab } from "@/components/stage-timeline-tab";
import { ClawConfigPanel } from "@/components/claw-config-panel";
import { StageSummaryModal } from "@/components/stage-summary-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  getListWorkroomTasksQueryKey,
  getListWorkroomStagesQueryKey,
  getGetWorkroomQueryKey,
  getListWorkroomActivityQueryKey,
  getListCollaborationRolesQueryKey,
  getListDecisionLogsQueryKey,
  getListStageExitCriteriaQueryKey,
} from "@workspace/api-client-react";

const STAGE_STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: "Pending", color: "text-muted-foreground", icon: Circle },
  active: { label: "Active", color: "text-blue-400", icon: Clock },
  completed: { label: "Completed", color: "text-green-400", icon: CheckCircle2 },
  awaiting_gate: { label: "Awaiting Gate", color: "text-amber-400", icon: AlertTriangle },
  approved: { label: "Approved", color: "text-green-400", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "text-red-400", icon: AlertTriangle },
};


const PRIORITY_COLORS: Record<string, string> = {
  high: "text-red-400 border-red-400/30 bg-red-400/10",
  medium: "text-amber-400 border-amber-400/30 bg-amber-400/10",
  low: "text-green-400 border-green-400/30 bg-green-400/10",
};

const TASK_STATUS_OPTIONS = ["todo", "doing", "done", "blocked"] as const;

function StageTimeline({ stages, activeStageId, onSelect }: {
  stages: { id: number; name: string; order: number; stageType: string; status: string }[];
  activeStageId: number | null;
  onSelect: (id: number) => void;
}) {
  return (
    <div className="flex flex-col gap-0.5 w-full">
      {stages.map((stage, i) => {
        const conf = STAGE_STATUS_CONFIG[stage.status] ?? STAGE_STATUS_CONFIG.pending;
        const Icon = conf.icon;
        const isSelected = stage.id === activeStageId;
        const isGate = stage.stageType === "gate";
        return (
          <div key={stage.id}>
            <button
              onClick={() => onSelect(stage.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors text-left",
                isSelected
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <Icon className={cn("w-4 h-4 shrink-0", isSelected ? "text-primary" : conf.color)} />
              <span className="flex-1 font-medium">
                <span className="text-xs text-muted-foreground mr-1">{stage.order}.</span>
                {stage.name}
              </span>
              {isGate && (
                <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-400 py-0 h-4">GATE</Badge>
              )}
            </button>
            {i < stages.length - 1 && (
              <div className="ml-5 w-px h-2 bg-border" />
            )}
          </div>
        );
      })}
    </div>
  );
}


function StageNotesEditor({ stage, workroomId }: { stage: { id: number; notes?: string | null }; workroomId: number }) {
  const [notes, setNotes] = useState(stage.notes ?? "");
  const [dirty, setDirty] = useState(false);
  const updateStage = useUpdateWorkroomStage();
  const { toast } = useToast();
  const qc = useQueryClient();

  async function save() {
    await updateStage.mutateAsync(
      { workroomId, stageId: stage.id, data: { notes } as Parameters<typeof updateStage.mutateAsync>[0]["data"] },
      {
        onSuccess: () => {
          toast({ title: "Notes saved ✓" });
          setDirty(false);
          qc.invalidateQueries({ queryKey: getListWorkroomStagesQueryKey(workroomId) });
        },
      }
    );
  }

  return (
    <div className="space-y-3">
      <Textarea
        placeholder="Tulis catatan, konteks, keputusan, atau output untuk stage ini…"
        value={notes}
        rows={7}
        onChange={(e) => { setNotes(e.target.value); setDirty(true); }}
        className="resize-none text-sm"
      />
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Catatan tersimpan per stage — terlihat di laporan workroom.</p>
        <Button
          size="sm"
          disabled={!dirty || updateStage.isPending}
          onClick={save}
          className="gap-1.5"
        >
          {updateStage.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Simpan
        </Button>
      </div>
    </div>
  );
}

function AddTaskDialog({ workroomId, stageId, open, onClose }: { workroomId: number; stageId: number; open: boolean; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [role, setRole] = useState("eksekutor");
  const [priority, setPriority] = useState("medium");
  const { toast } = useToast();
  const qc = useQueryClient();
  const createTask = useCreateWorkroomTask();

  async function handleSubmit() {
    if (!title.trim()) return;
    await createTask.mutateAsync(
      { workroomId, data: { stageId, title: title.trim(), description: desc.trim() || undefined, assigneeRole: role, priority } as Parameters<typeof createTask.mutateAsync>[0]["data"] },
      {
        onSuccess: () => {
          toast({ title: "Task created" });
          qc.invalidateQueries({ queryKey: getListWorkroomTasksQueryKey(workroomId) });
          setTitle(""); setDesc(""); setRole("eksekutor"); setPriority("medium");
          onClose();
        },
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Task</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input placeholder="What needs to be done?" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Description <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Textarea rows={2} value={desc} onChange={(e) => setDesc(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Assigned Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="strategis">Strategis</SelectItem>
                  <SelectItem value="skeptis">Skeptis</SelectItem>
                  <SelectItem value="eksekutor">Eksekutor</SelectItem>
                  <SelectItem value="narasumber">Narasumber</SelectItem>
                  <SelectItem value="pack_compiler">Pack Compiler</SelectItem>
                  <SelectItem value="evaluator">Evaluator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={!title.trim() || createTask.isPending} onClick={handleSubmit}>
            {createTask.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function WorkroomDetail() {
  const { id } = useParams<{ id: string }>();
  const workroomId = parseInt(id ?? "0");

  const { data: workroom, isLoading } = useGetWorkroom(workroomId);
  const { data: stages } = useListWorkroomStages(workroomId);
  const { data: tasks } = useListWorkroomTasks(workroomId);
  const { data: activity } = useListWorkroomActivity(workroomId);
  const { data: roles } = useListCollaborationRoles(workroomId);
  const { data: decisionLogs } = useListDecisionLogs(workroomId);
  const updateTask = useUpdateTask();
  const advanceStage = useUpdateWorkroomStage();
  const completeStageHook = useCompleteStage();
  const addRole = useAddCollaborationRole();
  const removeRole = useRemoveCollaborationRole();
  const addDecisionLog = useAddDecisionLog();
  const compilePack = useCompileFinalPack();
  const createCriteria = useCreateStageExitCriteria();
  const updateCriteria = useUpdateStageExitCriteria();
  const deleteCriteria = useDeleteStageExitCriteria();
  const qc = useQueryClient();
  const { toast } = useToast();

  const [newRoleForm, setNewRoleForm] = useState({ namaPeran: "", fungsiPeran: "eksekutor", humanPic: "" });
  const [logForm, setLogForm] = useState({ aktor: "", tipeAksi: "keputusan_gate", ringkasan: "" });
  const [showLogForm, setShowLogForm] = useState(false);
  const [newCriteriaText, setNewCriteriaText] = useState("");
  const [showCriteriaForm, setShowCriteriaForm] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryStageId, setSummaryStageId] = useState<number | null>(null);

  const [selectedStageId, setSelectedStageId] = useState<number | null>(null);
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null);

  async function completeStage(stageId: number) {
    await completeStageHook.mutateAsync(
      { workroomId, stageId },
      {
        onSuccess: () => {
          toast({ title: "✓ Stage selesai", description: "Pipeline dilanjutkan ke stage berikutnya." });
          setSelectedStageId(null);
          qc.invalidateQueries({ queryKey: getListWorkroomStagesQueryKey(workroomId) });
          qc.invalidateQueries({ queryKey: getGetWorkroomQueryKey(workroomId) });
          qc.invalidateQueries({ queryKey: getListWorkroomActivityQueryKey(workroomId) });
          qc.invalidateQueries({ queryKey: getListDecisionLogsQueryKey(workroomId) });
        },
      }
    );
  }

  const activeStage =
    stages?.find((s) => s.id === selectedStageId) ??
    stages?.find((s) => s.status === "active") ??
    stages?.find((s) => s.status === "awaiting_gate") ??
    stages?.[0];
  const displayStageId = selectedStageId ?? activeStage?.id ?? null;
  const displayStage = stages?.find((s) => s.id === displayStageId) ?? activeStage;

  const { data: exitCriteria } = useListStageExitCriteria(workroomId, displayStageId ?? 0);

  const stageTasks = tasks?.filter((t) => t.stageId === displayStageId) ?? [];
  const todoTasks = stageTasks.filter((t) => t.status === "todo");
  const doingTasks = stageTasks.filter((t) => t.status === "doing");
  const doneTasks = stageTasks.filter((t) => t.status === "done");

  async function cycleTaskStatus(taskId: number, current: string) {
    const next = current === "todo" ? "doing" : current === "doing" ? "done" : "todo";
    await updateTask.mutateAsync(
      { id: taskId, data: { status: next } as Parameters<typeof updateTask.mutateAsync>[0]["data"] },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListWorkroomTasksQueryKey(workroomId) });
        },
      }
    );
    void toast;
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <Skeleton className="h-10 w-[300px]" />
        <Skeleton className="h-2 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Skeleton className="h-[400px] rounded-xl" />
          <Skeleton className="h-[400px] rounded-xl col-span-3" />
        </div>
      </div>
    );
  }

  if (!workroom) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <p className="text-muted-foreground">Workroom not found.</p>
        <Link href="/workrooms"><Button variant="outline">Back to Workrooms</Button></Link>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      <div className="flex items-start gap-3">
        <Link href="/workrooms">
          <Button variant="ghost" size="icon" className="mt-0.5">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight truncate">{workroom.name}</h1>
            <Badge variant={workroom.status === "active" ? "secondary" : "outline"}>
              {workroom.status}
            </Badge>
          </div>
          {workroom.objective && (
            <p className="text-muted-foreground text-sm mt-0.5 line-clamp-1">{workroom.objective}</p>
          )}
        </div>
        <Link href={`/workrooms/${workroomId}/report`}>
          <Button variant="outline" size="sm" className="gap-1.5 shrink-0">
            <FileText className="w-3.5 h-3.5" />
            Report
            <ExternalLink className="w-3 h-3 text-muted-foreground" />
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <Progress value={workroom.progress} className="flex-1 h-2" />
        <span className="text-sm text-muted-foreground font-medium w-10 text-right">{workroom.progress}%</span>
      </div>

      <WorkroomHealth workroomId={workroomId} stages={stages ?? []} />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pipeline</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              {stages ? (
                <StageTimeline
                  stages={stages.map(s => ({ id: s.id, name: s.name, order: s.order, stageType: s.stageType, status: s.status }))}
                  activeStageId={displayStageId}
                  onSelect={(id) => setSelectedStageId(id)}
                />
              ) : (
                <div className="space-y-2">
                  {[1,2,3,4,5,6,7,8].map(i => <Skeleton key={i} className="h-8 w-full" />)}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3 space-y-5">
          {displayStage && (
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">
                  Stage {displayStage.order}: {displayStage.name}
                </h2>
                <p className="text-sm text-muted-foreground capitalize">
                  {STAGE_STATUS_CONFIG[displayStage.status]?.label ?? displayStage.status}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-xs"
                  onClick={() => { setSummaryStageId(displayStage.id); setSummaryOpen(true); }}
                >
                  <FileText className="w-3.5 h-3.5" /> Ringkasan
                </Button>
              {displayStage.stageType !== "gate" && displayStage.status === "active" && (
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setAddTaskOpen(true)}>
                    <Plus className="w-3.5 h-3.5" />
                    Add Task
                  </Button>
                  {(displayStage.name.toLowerCase().includes("pack") || displayStage.name.toLowerCase().includes("release") || displayStage.name.toLowerCase().includes("rilis")) && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 border-purple-500/40 text-purple-400 hover:bg-purple-500/10"
                      disabled={compilePack.isPending}
                      onClick={async () => {
                        const result = await compilePack.mutateAsync({ workroomId });
                        toast({
                          title: "Pack Compiled! 📦",
                          description: result.message ?? `${result.deliverableCount} deliverable dikompilasi`,
                        });
                        qc.invalidateQueries({ queryKey: getListDecisionLogsQueryKey(workroomId) });
                      }}
                    >
                      {compilePack.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Package className="w-3.5 h-3.5" />}
                      Compile Pack
                    </Button>
                  )}
                  <Button
                    size="sm"
                    className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                    disabled={completeStageHook.isPending}
                    onClick={() => completeStage(displayStage.id)}
                  >
                    {completeStageHook.isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ArrowRight className="w-3.5 h-3.5" />
                    )}
                    Complete Stage
                  </Button>
                </div>
              )}
              </div>
            </div>
          )}

          {displayStage?.stageType === "gate" && (
            <GateRubricPanel
              stage={{ id: displayStage.id, name: displayStage.name, gateDecision: displayStage.gateDecision, gateNote: displayStage.gateNote }}
              workroomId={workroomId}
              workroomName={workroom?.name}
              objective={workroom?.objective ?? undefined}
            />
          )}

          <Tabs defaultValue="tasks">
            <TabsList>
              <TabsTrigger value="tasks">
                Tasks
                {stageTasks.length > 0 && (
                  <Badge variant="secondary" className="ml-1.5 text-xs h-4 px-1.5">{stageTasks.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="notes" className="gap-1.5">
                <StickyNote className="w-3.5 h-3.5" />
                Notes
                {displayStage?.notes && <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />}
              </TabsTrigger>
              <TabsTrigger value="board" className="gap-1.5">
                <Kanban className="w-3.5 h-3.5" />
                Board
              </TabsTrigger>
              <TabsTrigger value="agent" className="gap-1.5">
                <Bot className="w-3.5 h-3.5" />
                Agent
              </TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="knowledge" className="gap-1.5">
                <span>📚</span> Knowledge
              </TabsTrigger>
              <TabsTrigger value="brain" className="gap-1.5">
                <span>🧠</span> Otak
              </TabsTrigger>
              <TabsTrigger value="deliverables" className="gap-1.5">
                <span>📦</span> Deliverables
              </TabsTrigger>
              <TabsTrigger value="persona" className="gap-1.5">
                <span>🤖</span> Persona
              </TabsTrigger>
              <TabsTrigger value="claw-setup" className="gap-1.5">
                <span>🦾</span> Claw
              </TabsTrigger>
              <TabsTrigger value="multiclaw" className="gap-1.5">
                <span>⚡</span> Multiclaw
              </TabsTrigger>
              <TabsTrigger value="openclaw" className="gap-1.5">
                <span>🌀</span> Openclaw
              </TabsTrigger>
              <TabsTrigger value="summary" className="gap-1.5">
                <span>📊</span> Rangkuman
              </TabsTrigger>
              <TabsTrigger value="miniapps" className="gap-1.5">
                <span>🛠️</span> Mini Apps
              </TabsTrigger>
              <TabsTrigger value="brief" className="gap-1.5">
                <span>📣</span> Brief
              </TabsTrigger>
              <TabsTrigger value="widget" className="gap-1.5">
                <span>🔗</span> Widget
              </TabsTrigger>
              <TabsTrigger value="rangkuman" className="gap-1.5">
                <span>✨</span> AI Rangkuman
              </TabsTrigger>
              <TabsTrigger value="roles" className="gap-1.5">
                <Users className="w-3.5 h-3.5" /> Tim
                {roles && roles.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-[10px] h-4 px-1">{roles.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="decision-log" className="gap-1.5">
                <ScrollText className="w-3.5 h-3.5" /> Log Keputusan
                {decisionLogs && decisionLogs.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-[10px] h-4 px-1">{decisionLogs.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="exit-criteria" className="gap-1.5">
                <ClipboardList className="w-3.5 h-3.5" /> Exit Criteria
                {exitCriteria && exitCriteria.length > 0 && (
                  <Badge variant="secondary" className={cn("ml-1 text-[10px] h-4 px-1", exitCriteria.every(c => c.isMet) ? "bg-green-500/20 text-green-400" : "")}>
                    {exitCriteria.filter(c => c.isMet).length}/{exitCriteria.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="metrics" className="gap-1.5">
                <BarChart3 className="w-3.5 h-3.5" /> Metrik
              </TabsTrigger>
              <TabsTrigger value="timeline" className="gap-1.5">
                <span>🗺️</span> Timeline
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tasks" className="mt-4 space-y-5">
              {stageTasks.length === 0 ? (
                <div className="text-center py-12 border border-dashed rounded-lg text-muted-foreground">
                  <Bot className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No tasks in this stage yet.</p>
                  {displayStage?.stageType !== "gate" && (
                    <Button size="sm" variant="outline" className="mt-3 gap-1.5" onClick={() => setAddTaskOpen(true)}>
                      <Plus className="w-3.5 h-3.5" /> Add Task
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {[
                    { label: "In Progress", items: doingTasks },
                    { label: "To Do", items: todoTasks },
                    { label: "Done", items: doneTasks },
                  ].map(({ label, items }) =>
                    items.length === 0 ? null : (
                      <div key={label}>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{label} ({items.length})</p>
                        <div className="space-y-2">
                          {items.map((task) => {
                            const isExpanded = expandedTaskId === task.id;
                            return (
                              <div key={task.id} className="space-y-1">
                                <div
                                  className={cn(
                                    "flex items-start gap-3 p-3 rounded-lg border bg-card transition-colors group cursor-pointer",
                                    isExpanded ? "border-primary/40 bg-primary/5" : "border-border hover:border-primary/20"
                                  )}
                                  onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                                >
                                  <button
                                    onClick={(e) => { e.stopPropagation(); cycleTaskStatus(task.id, task.status); }}
                                    className="mt-0.5 shrink-0"
                                  >
                                    {task.status === "done" ? (
                                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                                    ) : task.status === "doing" ? (
                                      <Clock className="w-5 h-5 text-blue-400" />
                                    ) : (
                                      <Circle className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                                    )}
                                  </button>
                                  <div className="flex-1 min-w-0">
                                    <p className={cn("text-sm font-medium", task.status === "done" && "line-through text-muted-foreground")}>
                                      {task.title}
                                    </p>
                                    {task.description && (
                                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{task.description}</p>
                                    )}
                                    {task.output && (
                                      <p className="text-xs text-muted-foreground/60 mt-0.5 line-clamp-1 italic">
                                        Output: {task.output.slice(0, 80)}…
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    {task.priority && (
                                      <Badge variant="outline" className={cn("text-[10px] py-0 h-4 border", PRIORITY_COLORS[task.priority])}>
                                        {task.priority}
                                      </Badge>
                                    )}
                                    <RoleBadge role={task.assigneeRole} size="xs" />
                                  </div>
                                </div>
                                {isExpanded && (
                                  <TaskDetailPanel
                                    task={task}
                                    workroomId={workroomId}
                                    workroomName={workroom?.name}
                                    stageName={displayStage?.name}
                                    objective={workroom?.objective ?? undefined}
                                    onClose={() => setExpandedTaskId(null)}
                                    onDeleted={() => setExpandedTaskId(null)}
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="notes" className="mt-4">
              {displayStage ? (
                <StageNotesEditor
                  key={displayStage.id}
                  stage={{ id: displayStage.id, notes: displayStage.notes }}
                  workroomId={workroomId}
                />
              ) : (
                <p className="text-sm text-muted-foreground py-8 text-center">Pilih stage untuk menulis catatan.</p>
              )}
            </TabsContent>

            <TabsContent value="board" className="mt-4">
              <KanbanBoard
                tasks={tasks ?? []}
                stages={stages ?? []}
                workroomId={workroomId}
              />
            </TabsContent>

            <TabsContent value="agent" className="mt-4">
              <AgentChat
                workroomName={workroom?.name ?? ""}
                stageName={displayStage?.name ?? ""}
                objective={workroom?.objective}
                stageNotes={displayStage?.notes}
                onSaveToNotes={displayStage ? (text) => {
                  const existing = displayStage.notes ?? "";
                  const combined = existing ? `${existing}\n\n---\n${text}` : text;
                  advanceStage.mutateAsync({ workroomId, stageId: displayStage.id, data: { notes: combined } as Parameters<typeof advanceStage.mutateAsync>[0]["data"] }).then(() => {
                    qc.invalidateQueries({ queryKey: getListWorkroomStagesQueryKey(workroomId) });
                  });
                } : undefined}
              />
            </TabsContent>

            <TabsContent value="activity" className="mt-4">
              {!activity || activity.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm border border-dashed rounded-lg">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  No activity logged yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {activity.map((entry) => (
                    <div key={entry.id} className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{entry.description}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                          <span>{entry.actor ?? "System"}</span>
                          <span>·</span>
                          <span>{new Date(entry.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="knowledge" className="mt-4">
              <KnowledgeBaseTab workroomId={workroomId} workroomName={workroom?.name} objective={workroom?.objective ?? undefined} />
            </TabsContent>

            <TabsContent value="brain" className="mt-4">
              <ProjectBrainTab workroomId={workroomId} workroomName={workroom?.name} objective={workroom?.objective ?? undefined} />
            </TabsContent>

            <TabsContent value="deliverables" className="mt-4">
              <DeliverablesTab workroomId={workroomId} stages={stages ?? []} />
            </TabsContent>

            <TabsContent value="persona" className="mt-4">
              <PersonaConfigTab workroomId={workroomId} workroomName={workroom?.name} objective={workroom?.objective ?? undefined} />
            </TabsContent>

            <TabsContent value="claw-setup" className="mt-4">
              <ClawConfigPanel workroomId={workroomId} />
            </TabsContent>

            <TabsContent value="multiclaw" className="mt-4">
              <MulticlawPanel
                workroomId={workroomId}
                workroomName={workroom?.name}
                objective={workroom?.objective ?? undefined}
              />
            </TabsContent>

            <TabsContent value="openclaw" className="mt-4">
              <OpenclawChain
                workroomId={workroomId}
                workroomName={workroom?.name}
                objective={workroom?.objective ?? undefined}
              />
            </TabsContent>

            <TabsContent value="summary" className="mt-4">
              <SummaryTab workroomId={workroomId} />
            </TabsContent>

            <TabsContent value="miniapps" className="mt-4">
              <MiniAppsTab
                workroomId={workroomId}
                workroomName={workroom?.name}
                objective={workroom?.objective ?? undefined}
              />
            </TabsContent>

            <TabsContent value="brief" className="mt-4">
              <BriefMarketingTab
                workroomId={workroomId}
                workroomName={workroom?.name}
                objective={workroom?.objective ?? undefined}
              />
            </TabsContent>

            <TabsContent value="widget" className="mt-4">
              <WidgetTab
                workroomId={workroomId}
                workroomName={workroom?.name}
              />
            </TabsContent>

            <TabsContent value="rangkuman" className="mt-4">
              <RangkumanTab workroomId={workroomId} workroomName={workroom?.name} />
            </TabsContent>

            {/* ── Collaboration Roles Tab ─────────────────────────────────── */}
            <TabsContent value="roles" className="mt-4 space-y-4">
              <div>
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" /> Tim Kolaborasi
                </h3>
                {roles && roles.length > 0 ? (
                  <div className="space-y-2">
                    {roles.map((role) => (
                      <div key={role.id} className="flex items-center justify-between p-3 border rounded-lg bg-card">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                            <User className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{role.namaPeran}</p>
                            <p className="text-xs text-muted-foreground">{role.fungsiPeran}</p>
                            {role.humanPic && (
                              <p className="text-xs text-primary mt-0.5">PIC: {role.humanPic}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {role.isPic && (
                            <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">PIC</Badge>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-muted-foreground hover:text-red-400"
                            onClick={async () => {
                              await removeRole.mutateAsync({ workroomId, roleId: role.id });
                              qc.invalidateQueries({ queryKey: getListCollaborationRolesQueryKey(workroomId) });
                              toast({ title: "Peran dihapus" });
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 border border-dashed rounded-lg text-muted-foreground text-sm">
                    Belum ada peran yang ditambahkan.
                  </div>
                )}
              </div>
              <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Tambah Peran</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Nama Peran</Label>
                    <Input
                      placeholder="mis. Lead Tender"
                      value={newRoleForm.namaPeran}
                      onChange={(e) => setNewRoleForm(f => ({ ...f, namaPeran: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Fungsi</Label>
                    <Select value={newRoleForm.fungsiPeran} onValueChange={(v) => setNewRoleForm(f => ({ ...f, fungsiPeran: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="strategis">Strategis</SelectItem>
                        <SelectItem value="skeptis">Skeptis</SelectItem>
                        <SelectItem value="eksekutor">Eksekutor</SelectItem>
                        <SelectItem value="narasumber">Narasumber</SelectItem>
                        <SelectItem value="pack_compiler">Pack Compiler</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">PIC (opsional)</Label>
                  <Input
                    placeholder="Nama orang yang bertanggung jawab"
                    value={newRoleForm.humanPic}
                    onChange={(e) => setNewRoleForm(f => ({ ...f, humanPic: e.target.value }))}
                  />
                </div>
                <Button
                  size="sm"
                  disabled={!newRoleForm.namaPeran.trim() || addRole.isPending}
                  className="gap-1.5"
                  onClick={async () => {
                    await addRole.mutateAsync({
                      workroomId,
                      data: {
                        namaPeran: newRoleForm.namaPeran.trim(),
                        fungsiPeran: newRoleForm.fungsiPeran,
                        humanPic: newRoleForm.humanPic.trim() || undefined,
                      },
                    });
                    qc.invalidateQueries({ queryKey: getListCollaborationRolesQueryKey(workroomId) });
                    setNewRoleForm({ namaPeran: "", fungsiPeran: "eksekutor", humanPic: "" });
                    toast({ title: "Peran ditambahkan" });
                  }}
                >
                  {addRole.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Tambah
                </Button>
              </div>
            </TabsContent>

            {/* ── Decision Log Tab ────────────────────────────────────────── */}
            <TabsContent value="decision-log" className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <ScrollText className="w-4 h-4" /> Log Keputusan
                </h3>
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setShowLogForm(f => !f)}>
                  <Plus className="w-3.5 h-3.5" />
                  Tambah Log
                </Button>
              </div>

              {showLogForm && (
                <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Aktor</Label>
                      <Input
                        placeholder="Nama / peran"
                        value={logForm.aktor}
                        onChange={(e) => setLogForm(f => ({ ...f, aktor: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Tipe Aksi</Label>
                      <Select value={logForm.tipeAksi} onValueChange={(v) => setLogForm(f => ({ ...f, tipeAksi: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="usulan">Usulan</SelectItem>
                          <SelectItem value="tantangan_skeptis">Tantangan Skeptis</SelectItem>
                          <SelectItem value="keputusan_gate">Keputusan Gate</SelectItem>
                          <SelectItem value="revisi">Revisi</SelectItem>
                          <SelectItem value="rilis">Rilis</SelectItem>
                          <SelectItem value="stage_complete">Stage Selesai</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Ringkasan Keputusan</Label>
                    <Textarea
                      placeholder="Apa yang diputuskan atau dicatat?"
                      rows={3}
                      value={logForm.ringkasan}
                      onChange={(e) => setLogForm(f => ({ ...f, ringkasan: e.target.value }))}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={!logForm.aktor.trim() || !logForm.ringkasan.trim() || addDecisionLog.isPending}
                      className="gap-1.5"
                      onClick={async () => {
                        await addDecisionLog.mutateAsync({
                          workroomId,
                          data: {
                            aktor: logForm.aktor.trim(),
                            tipeAksi: logForm.tipeAksi,
                            ringkasan: logForm.ringkasan.trim(),
                            stageId: displayStageId ?? undefined,
                          },
                        });
                        qc.invalidateQueries({ queryKey: getListDecisionLogsQueryKey(workroomId) });
                        setLogForm({ aktor: "", tipeAksi: "keputusan_gate", ringkasan: "" });
                        setShowLogForm(false);
                        toast({ title: "Log keputusan disimpan" });
                      }}
                    >
                      {addDecisionLog.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      Simpan
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowLogForm(false)}>Batal</Button>
                  </div>
                </div>
              )}

              {!decisionLogs || decisionLogs.length === 0 ? (
                <div className="text-center py-12 border border-dashed rounded-lg text-muted-foreground text-sm">
                  <ScrollText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  Belum ada log keputusan tercatat.
                </div>
              ) : (
                <div className="space-y-3">
                  {decisionLogs.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 p-3 border rounded-lg bg-card">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <ScrollText className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{log.aktor}</span>
                          <Badge variant="outline" className="text-[10px] py-0 h-4">{log.tipeAksi.replace(/_/g, " ")}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">{log.ringkasan}</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">{new Date(log.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ── Exit Criteria Tab ── */}
            <TabsContent value="exit-criteria" className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-sm">Stage Exit Criteria</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Kriteria yang harus terpenuhi sebelum stage ini bisa diselesaikan.
                    {exitCriteria && exitCriteria.length > 0 && (
                      <span className={cn("ml-2 font-medium", exitCriteria.every(c => c.isMet) ? "text-green-400" : "text-amber-400")}>
                        {exitCriteria.filter(c => c.isMet).length}/{exitCriteria.length} terpenuhi
                      </span>
                    )}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-xs"
                  onClick={() => setShowCriteriaForm(v => !v)}
                >
                  <Plus className="w-3.5 h-3.5" /> Tambah Kriteria
                </Button>
              </div>

              {showCriteriaForm && (
                <div className="rounded-lg border bg-card/50 p-3 space-y-3">
                  <Label className="text-xs">Kriteria Baru</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="cth: Semua dokumen persyaratan telah diverifikasi"
                      value={newCriteriaText}
                      onChange={e => setNewCriteriaText(e.target.value)}
                      className="text-sm flex-1"
                    />
                    <Button
                      size="sm"
                      disabled={!newCriteriaText.trim() || createCriteria.isPending || !displayStageId}
                      onClick={async () => {
                        if (!displayStageId) return;
                        await createCriteria.mutateAsync({
                          workroomId,
                          stageId: displayStageId,
                          data: { criteriaText: newCriteriaText.trim() },
                        });
                        qc.invalidateQueries({ queryKey: getListStageExitCriteriaQueryKey(workroomId, displayStageId) });
                        setNewCriteriaText("");
                        setShowCriteriaForm(false);
                        toast({ title: "Kriteria ditambahkan ✓" });
                      }}
                    >
                      {createCriteria.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowCriteriaForm(false)}>Batal</Button>
                  </div>
                </div>
              )}

              {!exitCriteria || exitCriteria.length === 0 ? (
                <div className="text-center py-12 border border-dashed rounded-lg text-muted-foreground text-sm">
                  <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  Belum ada exit criteria untuk stage ini.
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Progress bar */}
                  {exitCriteria.length > 0 && (
                    <div className="flex items-center gap-3 mb-3 p-3 rounded-lg border bg-card/30">
                      <div className="flex-1">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Progres Kriteria</span>
                          <span className={exitCriteria.every(c => c.isMet) ? "text-green-400 font-medium" : "text-amber-400"}>
                            {Math.round((exitCriteria.filter(c => c.isMet).length / exitCriteria.length) * 100)}%
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className={cn("h-full rounded-full transition-all", exitCriteria.every(c => c.isMet) ? "bg-green-500" : "bg-amber-500")}
                            style={{ width: `${(exitCriteria.filter(c => c.isMet).length / exitCriteria.length) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {exitCriteria.map(criterion => (
                    <div
                      key={criterion.id}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                        criterion.isMet ? "bg-green-500/5 border-green-500/20" : "bg-card/30 border-border"
                      )}
                    >
                      <button
                        onClick={async () => {
                          if (!displayStageId) return;
                          await updateCriteria.mutateAsync({
                            workroomId,
                            stageId: displayStageId,
                            criteriaId: criterion.id,
                            data: { isMet: !criterion.isMet, verifiedBy: "Human Gate" },
                          });
                          qc.invalidateQueries({ queryKey: getListStageExitCriteriaQueryKey(workroomId, displayStageId) });
                        }}
                        className={cn(
                          "mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors",
                          criterion.isMet ? "bg-green-500 border-green-500 text-white" : "border-border hover:border-green-500/50"
                        )}
                      >
                        {criterion.isMet && <CheckSquare className="w-3 h-3" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-sm", criterion.isMet ? "line-through text-muted-foreground" : "")}>
                          {criterion.criteriaText}
                        </p>
                        {criterion.isMet && criterion.verifiedBy && (
                          <p className="text-[10px] text-green-400/70 mt-0.5">✓ Diverifikasi oleh {criterion.verifiedBy}</p>
                        )}
                      </div>
                      <button
                        onClick={async () => {
                          if (!displayStageId) return;
                          await deleteCriteria.mutateAsync({ workroomId, stageId: displayStageId, criteriaId: criterion.id });
                          qc.invalidateQueries({ queryKey: getListStageExitCriteriaQueryKey(workroomId, displayStageId) });
                        }}
                        className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  {exitCriteria.every(c => c.isMet) && (
                    <div className="flex items-center gap-2 text-xs text-green-400 bg-green-400/5 border border-green-400/20 rounded-lg px-3 py-2 mt-2">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      Semua kriteria terpenuhi — stage siap untuk diselesaikan.
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="metrics" className="mt-4">
              <MetricsTab workroomId={workroomId} stages={stages ?? []} />
            </TabsContent>

            <TabsContent value="timeline" className="mt-4">
              <StageTimelineTab stages={stages ?? []} currentStageId={displayStageId ?? undefined} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {displayStageId && (
        <AddTaskDialog
          workroomId={workroomId}
          stageId={displayStageId}
          open={addTaskOpen}
          onClose={() => setAddTaskOpen(false)}
        />
      )}

      <StageSummaryModal
        open={summaryOpen}
        onClose={() => setSummaryOpen(false)}
        workroomId={workroomId}
        stageId={summaryStageId}
        stageName={stages?.find(s => s.id === summaryStageId)?.name}
      />
    </div>
  );
}
