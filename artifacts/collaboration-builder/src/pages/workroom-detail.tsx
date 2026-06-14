import {
  useGetWorkroom,
  useListWorkroomStages,
  useListWorkroomTasks,
  useListWorkroomActivity,
  useUpdateWorkroomStage,
  useUpdateTask,
  useCreateWorkroomTask,
} from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { useState } from "react";
import {
  ArrowLeft, CheckCircle2, Circle, Clock, Loader2, Plus,
  ChevronRight, AlertTriangle, FileText, MessageSquare, Bot,
  Shield, Wrench, Brain, Star, CheckSquare, ArrowRight,
  StickyNote, Save, ExternalLink, Kanban,
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
import { BriefMarketingTab } from "@/components/brief-marketing-tab";
import { WidgetTab } from "@/components/widget-tab";
import { WorkroomHealth } from "@/components/workroom-health";
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
import { getListWorkroomTasksQueryKey, getListWorkroomStagesQueryKey, getGetWorkroomQueryKey, getListWorkroomActivityQueryKey } from "@workspace/api-client-react";

const STAGE_STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: "Pending", color: "text-muted-foreground", icon: Circle },
  active: { label: "Active", color: "text-blue-400", icon: Clock },
  completed: { label: "Completed", color: "text-green-400", icon: CheckCircle2 },
  awaiting_gate: { label: "Awaiting Gate", color: "text-amber-400", icon: AlertTriangle },
  approved: { label: "Approved", color: "text-green-400", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "text-red-400", icon: AlertTriangle },
};

const ROLE_ICONS: Record<string, React.ElementType> = {
  strategis: Brain,
  skeptis: Shield,
  eksekutor: Wrench,
  narasumber: Star,
  pack_compiler: FileText,
  evaluator: CheckSquare,
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

function GateDecisionPanel({ stage, workroomId }: { stage: { id: number; name: string; gateDecision?: string | null; gateNote?: string | null }; workroomId: number }) {
  const [decision, setDecision] = useState("");
  const [note, setNote] = useState("");
  const { toast } = useToast();
  const qc = useQueryClient();
  const updateStage = useUpdateWorkroomStage();

  async function decide(action: "approved" | "rejected") {
    await updateStage.mutateAsync(
      { workroomId, stageId: stage.id, data: { gateDecision: action, gateNote: note || undefined } as Parameters<typeof updateStage.mutateAsync>[0]["data"] },
      {
        onSuccess: () => {
          toast({ title: action === "approved" ? "Gate approved ✓" : "Gate rejected", description: note || undefined });
          qc.invalidateQueries({ queryKey: getListWorkroomStagesQueryKey(workroomId) });
          qc.invalidateQueries({ queryKey: getGetWorkroomQueryKey(workroomId) });
          qc.invalidateQueries({ queryKey: getListWorkroomActivityQueryKey(workroomId) });
        },
      }
    );
    void decision;
  }

  if (stage.gateDecision) {
    return (
      <Card className={cn("border", stage.gateDecision === "approved" ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5")}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 font-medium">
            {stage.gateDecision === "approved" ? (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-500" />
            )}
            Gate {stage.gateDecision === "approved" ? "Approved" : "Rejected"}
          </div>
          {stage.gateNote && (
            <p className="text-sm text-muted-foreground mt-2">{stage.gateNote}</p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-500/30 bg-amber-500/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          Human Gate — {stage.name}
        </CardTitle>
        <CardDescription>Review the outputs from the previous stage and decide whether to proceed or reject.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Add your gate notes or decision rationale…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
        />
        <div className="flex gap-3">
          <Button
            variant="destructive"
            className="flex-1"
            disabled={updateStage.isPending}
            onClick={() => decide("rejected")}
          >
            Reject & Revise
          </Button>
          <Button
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            disabled={updateStage.isPending}
            onClick={() => decide("approved")}
          >
            {updateStage.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Approve & Continue"}
          </Button>
        </div>
      </CardContent>
    </Card>
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
  const updateTask = useUpdateTask();
  const advanceStage = useUpdateWorkroomStage();
  const qc = useQueryClient();
  const { toast } = useToast();

  const [selectedStageId, setSelectedStageId] = useState<number | null>(null);
  const [addTaskOpen, setAddTaskOpen] = useState(false);

  async function completeStage(stageId: number) {
    await advanceStage.mutateAsync(
      { workroomId, stageId, data: { status: "completed" } as Parameters<typeof advanceStage.mutateAsync>[0]["data"] },
      {
        onSuccess: () => {
          toast({ title: "Stage completed", description: "Pipeline advanced to next stage." });
          setSelectedStageId(null);
          qc.invalidateQueries({ queryKey: getListWorkroomStagesQueryKey(workroomId) });
          qc.invalidateQueries({ queryKey: getGetWorkroomQueryKey(workroomId) });
          qc.invalidateQueries({ queryKey: getListWorkroomActivityQueryKey(workroomId) });
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
              {displayStage.stageType !== "gate" && displayStage.status === "active" && (
                <div className="flex items-center gap-2 shrink-0">
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setAddTaskOpen(true)}>
                    <Plus className="w-3.5 h-3.5" />
                    Add Task
                  </Button>
                  <Button
                    size="sm"
                    className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                    disabled={advanceStage.isPending}
                    onClick={() => completeStage(displayStage.id)}
                  >
                    {advanceStage.isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ArrowRight className="w-3.5 h-3.5" />
                    )}
                    Complete Stage
                  </Button>
                </div>
              )}
            </div>
          )}

          {displayStage?.stageType === "gate" && (
            <GateDecisionPanel
              stage={{ id: displayStage.id, name: displayStage.name, gateDecision: displayStage.gateDecision, gateNote: displayStage.gateNote }}
              workroomId={workroomId}
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
                            const RoleIcon = ROLE_ICONS[task.assigneeRole ?? ""] ?? Bot;
                            return (
                              <div
                                key={task.id}
                                className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card hover:border-primary/20 transition-colors group"
                              >
                                <button
                                  onClick={() => cycleTaskStatus(task.id, task.status)}
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
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  {task.priority && (
                                    <Badge variant="outline" className={cn("text-[10px] py-0 h-4 border", PRIORITY_COLORS[task.priority])}>
                                      {task.priority}
                                    </Badge>
                                  )}
                                  {task.assigneeRole && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <RoleIcon className="w-3 h-3" />
                                    </div>
                                  )}
                                </div>
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
    </div>
  );
}
