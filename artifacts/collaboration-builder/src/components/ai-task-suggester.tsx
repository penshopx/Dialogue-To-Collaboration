import { useState } from "react";
import { Sparkles, Loader2, X, Plus, Brain, Shield, Wrench, Star, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface SuggestedTask {
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  functionRole: string;
}

const ROLE_META: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  strategis: { label: "Strategis", icon: Brain, color: "text-blue-400", bg: "bg-blue-400/10" },
  skeptis: { label: "Skeptis", icon: Shield, color: "text-red-400", bg: "bg-red-400/10" },
  eksekutor: { label: "Eksekutor", icon: Wrench, color: "text-amber-400", bg: "bg-amber-400/10" },
  narasumber: { label: "Narasumber", icon: Star, color: "text-green-400", bg: "bg-green-400/10" },
  pack_compiler: { label: "DocuGen", icon: FileText, color: "text-purple-400", bg: "bg-purple-400/10" },
};

const PRIORITY_COLOR: Record<string, string> = {
  high: "text-red-400 border-red-400/30 bg-red-400/10",
  medium: "text-amber-400 border-amber-400/30 bg-amber-400/10",
  low: "text-muted-foreground border-border",
};

interface Props {
  workroomId: number;
  stageId: number;
  stageName: string;
  onAdded: () => void;
}

export function AiTaskSuggester({ workroomId, stageId, stageName, onAdded }: Props) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<SuggestedTask[]>([]);
  const [adding, setAdding] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());

  const suggest = async () => {
    if (loading) return;
    setLoading(true);
    setOpen(true);
    setTasks([]);
    setDismissed(new Set());
    try {
      const res = await fetch(`/api/workrooms/${workroomId}/stages/${stageId}/suggest-tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json() as { tasks?: SuggestedTask[]; error?: string };
      if (data.error) throw new Error(data.error);
      setTasks(data.tasks ?? []);
    } catch (err) {
      toast({ title: "Gagal generate saran", description: (err as Error).message, variant: "destructive" });
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const addTask = async (task: SuggestedTask, idx: number) => {
    setAdding(idx);
    try {
      const res = await fetch(`/api/workrooms/${workroomId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stageId,
          title: task.title,
          description: task.description,
          assigneeRole: task.functionRole,
          priority: task.priority,
        }),
      });
      if (!res.ok) throw new Error("Failed to create task");
      toast({ title: `✓ Task ditambahkan`, description: task.title });
      setDismissed(prev => new Set([...prev, idx]));
      onAdded();
    } catch (err) {
      toast({ title: "Gagal menambahkan task", variant: "destructive" });
    } finally {
      setAdding(null);
    }
  };

  const visibleTasks = tasks.filter((_, i) => !dismissed.has(i));

  return (
    <div className="flex flex-col gap-2">
      <Button
        size="sm"
        variant="outline"
        className="gap-1.5 border-violet-500/40 text-violet-400 hover:bg-violet-500/10"
        onClick={suggest}
        disabled={loading}
      >
        {loading
          ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating…</>
          : <><Sparkles className="w-3.5 h-3.5" /> Saran AI</>
        }
      </Button>

      {open && (
        <div className="w-full mt-1">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
              Saran AI untuk "{stageName}"
            </p>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className="h-16 rounded-lg bg-muted/20 animate-pulse border border-border/40" />
              ))}
            </div>
          ) : visibleTasks.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              {tasks.length === 0 ? "Tidak ada saran yang dihasilkan." : "Semua saran sudah ditambahkan! ✓"}
            </p>
          ) : (
            <div className="space-y-2">
              {tasks.map((task, i) => {
                if (dismissed.has(i)) return null;
                const meta = ROLE_META[task.functionRole] ?? ROLE_META.eksekutor;
                const Icon = meta.icon;
                return (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-lg border border-border/60 bg-card/30 hover:bg-card/60 transition-colors"
                  >
                    <div className={cn("w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5", meta.bg)}>
                      <Icon className={cn("w-3 h-3", meta.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium leading-tight">{task.title}</p>
                      {task.description && (
                        <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">{task.description}</p>
                      )}
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <Badge variant="outline" className={cn("text-[9px] h-4 px-1.5", PRIORITY_COLOR[task.priority])}>
                          {task.priority}
                        </Badge>
                        <Badge variant="outline" className={cn("text-[9px] h-4 px-1.5", meta.color, meta.bg)}>
                          {meta.label}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setDismissed(prev => new Set([...prev, i]))}
                        className="text-muted-foreground hover:text-foreground p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <Button
                        size="sm"
                        className="h-6 px-2 text-[10px] gap-1"
                        onClick={() => addTask(task, i)}
                        disabled={adding === i}
                      >
                        {adding === i
                          ? <Loader2 className="w-2.5 h-2.5 animate-spin" />
                          : <><Plus className="w-2.5 h-2.5" /> Tambah</>
                        }
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
