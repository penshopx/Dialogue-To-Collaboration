import { useUpdateTask, getListWorkroomTasksQueryKey } from "@workspace/api-client-react";
import { CheckCircle2, Circle, Clock, AlertOctagon, Brain, Shield, Wrench, Star, FileText, CheckSquare, Bot } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import type { WorkroomTask, WorkroomStage } from "@workspace/api-client-react";

const COLUMNS = [
  { id: "todo", label: "To Do", icon: Circle, color: "text-muted-foreground", headerBg: "bg-muted/40", dotColor: "bg-muted-foreground/40" },
  { id: "doing", label: "In Progress", icon: Clock, color: "text-blue-400", headerBg: "bg-blue-400/10", dotColor: "bg-blue-400" },
  { id: "done", label: "Done", icon: CheckCircle2, color: "text-green-400", headerBg: "bg-green-400/10", dotColor: "bg-green-400" },
  { id: "blocked", label: "Blocked", icon: AlertOctagon, color: "text-red-400", headerBg: "bg-red-400/10", dotColor: "bg-red-400" },
] as const;

type TaskStatus = typeof COLUMNS[number]["id"];

const ROLE_ICONS: Record<string, React.ElementType> = {
  strategis: Brain, skeptis: Shield, eksekutor: Wrench,
  narasumber: Star, pack_compiler: FileText, evaluator: CheckSquare,
};

const ROLE_COLORS: Record<string, string> = {
  strategis: "text-blue-400", skeptis: "text-red-400", eksekutor: "text-amber-400",
  narasumber: "text-green-400", pack_compiler: "text-purple-400", evaluator: "text-cyan-400",
};

const PRIORITY_DOT: Record<string, string> = {
  high: "bg-red-400", medium: "bg-amber-400", low: "bg-green-400",
};

const STATUS_CYCLE: Record<string, TaskStatus> = {
  todo: "doing", doing: "done", done: "todo", blocked: "todo",
};

interface Props {
  tasks: WorkroomTask[];
  stages: WorkroomStage[];
  workroomId: number;
}

export function KanbanBoard({ tasks, stages, workroomId }: Props) {
  const updateTask = useUpdateTask();
  const qc = useQueryClient();

  const stageMap: Record<number, string> = {};
  for (const s of stages) stageMap[s.id] = s.name;

  async function cycleStatus(taskId: number, current: string) {
    const next = STATUS_CYCLE[current] ?? "todo";
    await updateTask.mutateAsync(
      { id: taskId, data: { status: next } as Parameters<typeof updateTask.mutateAsync>[0]["data"] },
      { onSuccess: () => qc.invalidateQueries({ queryKey: getListWorkroomTasksQueryKey(workroomId) }) }
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 min-h-[300px]">
      {COLUMNS.map(col => {
        const ColIcon = col.icon;
        const colTasks = tasks.filter(t => t.status === col.id);
        return (
          <div key={col.id} className="flex flex-col gap-2">
            <div className={cn("flex items-center gap-2 px-3 py-2 rounded-lg", col.headerBg)}>
              <ColIcon className={cn("w-3.5 h-3.5 shrink-0", col.color)} />
              <span className={cn("text-xs font-semibold", col.color)}>{col.label}</span>
              <span className={cn("ml-auto text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center text-white", col.dotColor)}>
                {colTasks.length}
              </span>
            </div>

            <div className="flex flex-col gap-2 flex-1">
              {colTasks.length === 0 ? (
                <div className="flex-1 rounded-lg border border-dashed border-border/50 flex items-center justify-center min-h-[80px]">
                  <p className="text-[10px] text-muted-foreground/40">Kosong</p>
                </div>
              ) : (
                colTasks.map(task => {
                  const RoleIcon = ROLE_ICONS[task.assigneeRole ?? ""] ?? Bot;
                  const roleColor = ROLE_COLORS[task.assigneeRole ?? ""] ?? "text-muted-foreground";
                  const stageName = stageMap[task.stageId] ?? `Stage ${task.stageId}`;
                  return (
                    <div
                      key={task.id}
                      className="group rounded-lg border border-border bg-card/80 p-3 space-y-2 hover:border-primary/20 hover:shadow-sm transition-all cursor-pointer"
                      onClick={() => cycleStatus(task.id, task.status)}
                      title="Klik untuk ganti status"
                    >
                      <div className="flex items-start gap-2">
                        {task.priority && (
                          <div className={cn("w-1.5 h-1.5 rounded-full mt-1.5 shrink-0", PRIORITY_DOT[task.priority])} />
                        )}
                        <p className={cn("text-xs font-medium leading-tight flex-1", task.status === "done" && "line-through text-muted-foreground")}>
                          {task.title}
                        </p>
                      </div>
                      {task.description && (
                        <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">{task.description}</p>
                      )}
                      <div className="flex items-center justify-between gap-1">
                        <Badge variant="outline" className="text-[9px] py-0 h-4 px-1.5 truncate max-w-[70px]">
                          {stageName}
                        </Badge>
                        {task.assigneeRole && (
                          <div className={cn("flex items-center gap-0.5 text-[10px] shrink-0", roleColor)}>
                            <RoleIcon className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
