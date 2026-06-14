import { useState, useRef } from "react";
import {
  Brain, Shield, Wrench, Star, FileText, CheckSquare, Bot,
  Loader2, Save, Trash2, X, Sparkles, Copy, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpdateTask, useDeleteTask } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListWorkroomTasksQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const ROLE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  strategis:     { label: "Strategis",    icon: Brain,       color: "text-blue-400",   bg: "bg-blue-400/10",   border: "border-blue-400/30" },
  skeptis:       { label: "Skeptis",      icon: Shield,      color: "text-red-400",    bg: "bg-red-400/10",    border: "border-red-400/30" },
  eksekutor:     { label: "Eksekutor",    icon: Wrench,      color: "text-amber-400",  bg: "bg-amber-400/10",  border: "border-amber-400/30" },
  narasumber:    { label: "Narasumber",   icon: Star,        color: "text-green-400",  bg: "bg-green-400/10",  border: "border-green-400/30" },
  pack_compiler: { label: "Pack Compiler",icon: FileText,    color: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-400/30" },
  evaluator:     { label: "Evaluator",    icon: CheckSquare, color: "text-cyan-400",   bg: "bg-cyan-400/10",   border: "border-cyan-400/30" },
};

const PRIORITY_BADGE: Record<string, string> = {
  high:   "text-red-400 border-red-400/30 bg-red-400/10",
  medium: "text-amber-400 border-amber-400/30 bg-amber-400/10",
  low:    "text-green-400 border-green-400/30 bg-green-400/10",
};

interface Task {
  id: number;
  title: string;
  description?: string | null;
  assigneeRole?: string | null;
  priority: string;
  status: string;
  output?: string | null;
  stageId: number;
}

interface Props {
  task: Task;
  workroomId: number;
  workroomName?: string;
  stageName?: string;
  objective?: string;
  onClose: () => void;
  onDeleted: () => void;
}

export function TaskDetailPanel({ task, workroomId, workroomName, stageName, objective, onClose, onDeleted }: Props) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [role, setRole] = useState(task.assigneeRole ?? "eksekutor");
  const [priority, setPriority] = useState(task.priority);
  const [output, setOutput] = useState(task.output ?? "");
  const [streaming, setStreaming] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const qc = useQueryClient();
  const { toast } = useToast();

  const roleConf = ROLE_CONFIG[role] ?? { label: role, icon: Bot, color: "text-muted-foreground", bg: "bg-muted", border: "border-border" };
  const RoleIcon = roleConf.icon;

  async function saveAll() {
    setSaving(true);
    await updateTask.mutateAsync(
      {
        id: task.id,
        data: {
          title: title.trim() || task.title,
          description: description.trim() || undefined,
          assigneeRole: role,
          priority,
          output: output || undefined,
        } as Parameters<typeof updateTask.mutateAsync>[0]["data"],
      },
      {
        onSuccess: () => {
          toast({ title: "Task disimpan ✓" });
          qc.invalidateQueries({ queryKey: getListWorkroomTasksQueryKey(workroomId) });
        },
      }
    );
    setSaving(false);
  }

  async function saveOutput() {
    await updateTask.mutateAsync(
      {
        id: task.id,
        data: { output: output || undefined } as Parameters<typeof updateTask.mutateAsync>[0]["data"],
      },
      {
        onSuccess: () => {
          toast({ title: "Output disimpan ✓" });
          qc.invalidateQueries({ queryKey: getListWorkroomTasksQueryKey(workroomId) });
        },
      }
    );
  }

  async function handleDelete() {
    if (!confirm(`Hapus task "${task.title}"?`)) return;
    await deleteTask.mutateAsync(
      { id: task.id },
      {
        onSuccess: () => {
          toast({ title: "Task dihapus" });
          qc.invalidateQueries({ queryKey: getListWorkroomTasksQueryKey(workroomId) });
          onDeleted();
        },
      }
    );
  }

  async function generateOutput() {
    if (streaming) {
      abortRef.current?.abort();
      return;
    }

    setStreaming(true);
    setOutput("");

    const prompt = [
      `Kamu adalah agen dengan peran **${roleConf.label}** dalam workroom multi-agen.`,
      ``,
      `Workroom: ${workroomName ?? "—"}`,
      objective ? `Objektif: ${objective}` : "",
      stageName ? `Stage saat ini: ${stageName}` : "",
      ``,
      `Task yang perlu dikerjakan: **${title}**`,
      description ? `Detail task: ${description}` : "",
      ``,
      `Hasilkan output berkualitas tinggi untuk task ini sesuai peranmu. Gunakan format yang jelas, terstruktur, dan actionable. Tulis dalam Bahasa Indonesia.`,
    ].filter(Boolean).join("\n");

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch("/api/agent/invoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: ctrl.signal,
        body: JSON.stringify({
          agentRole: role,
          messages: [{ role: "user", content: prompt }],
          context: { workroomName, stageName, objective },
        }),
      });

      if (!res.ok || !res.body) throw new Error("API error");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.content) {
              full += data.content;
              setOutput(full);
            }
            if (data.done || data.error) break;
          } catch { /* skip malformed */ }
        }
      }

      if (full) {
        await updateTask.mutateAsync(
          { id: task.id, data: { output: full } as Parameters<typeof updateTask.mutateAsync>[0]["data"] },
          { onSuccess: () => qc.invalidateQueries({ queryKey: getListWorkroomTasksQueryKey(workroomId) }) }
        );
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") {
        toast({ title: "Gagal generate output", variant: "destructive" });
      }
    } finally {
      setStreaming(false);
    }
  }

  function copyOutput() {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className={cn("rounded-lg border bg-card/60 p-4 space-y-4 animate-in fade-in slide-in-from-top-1 duration-150", roleConf.border)}>
      <div className="flex items-start justify-between gap-2">
        <div className={cn("flex items-center gap-2 px-2 py-1 rounded-md text-xs font-medium", roleConf.bg, roleConf.color)}>
          <RoleIcon className="w-3.5 h-3.5" />
          {roleConf.label}
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1.5 text-destructive hover:text-destructive"
            disabled={deleteTask.isPending}
            onClick={handleDelete}
          >
            {deleteTask.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            Hapus
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onClose}>
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2 space-y-1">
          <Label className="text-xs">Judul Task</Label>
          <Input value={title} onChange={e => setTitle(e.target.value)} className="text-sm h-8" />
        </div>
        <div className="sm:col-span-2 space-y-1">
          <Label className="text-xs">Deskripsi <span className="text-muted-foreground">(opsional)</span></Label>
          <Textarea
            rows={2}
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="text-sm resize-none"
            placeholder="Tambah konteks atau petunjuk untuk agen…"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Peran Agen</Label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(ROLE_CONFIG).map(([k, v]) => (
                <SelectItem key={k} value={k} className="text-xs">
                  <span className={v.color}>{v.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Prioritas</Label>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="high" className="text-xs">High</SelectItem>
              <SelectItem value="medium" className="text-xs">Medium</SelectItem>
              <SelectItem value="low" className="text-xs">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end">
        <Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs" disabled={saving} onClick={saveAll}>
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
          Simpan Perubahan
        </Button>
      </div>

      <div className="border-t pt-3 space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold">Output / Hasil Kerja Agen</Label>
          <div className="flex items-center gap-1.5">
            {output && (
              <Button size="sm" variant="ghost" className="h-6 gap-1 text-[11px]" onClick={copyOutput}>
                {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                {copied ? "Tersalin" : "Salin"}
              </Button>
            )}
            <Button
              size="sm"
              className={cn(
                "h-7 gap-1.5 text-xs",
                streaming ? "bg-red-600 hover:bg-red-700 text-white" : "bg-primary"
              )}
              onClick={generateOutput}
            >
              {streaming ? (
                <><Loader2 className="w-3 h-3 animate-spin" />Stop</>
              ) : (
                <><Sparkles className="w-3 h-3" />AI Generate</>
              )}
            </Button>
          </div>
        </div>

        <Textarea
          rows={6}
          value={output}
          onChange={e => setOutput(e.target.value)}
          className="text-sm resize-none font-mono text-xs leading-relaxed"
          placeholder={streaming ? "Agen sedang menulis output…" : "Output belum ada. Tulis manual atau klik AI Generate untuk membiarkan agen mengerjakan task ini."}
        />

        {output && !streaming && (
          <div className="flex justify-end">
            <Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs" onClick={saveOutput}>
              <Save className="w-3 h-3" />
              Simpan Output
            </Button>
          </div>
        )}
      </div>

      {task.output && task.output !== output && (
        <div className="text-[10px] text-muted-foreground text-right">
          Output sebelumnya tersimpan. Simpan untuk memperbarui.
        </div>
      )}
    </div>
  );
}

export function RoleBadge({ role, size = "sm" }: { role?: string | null; size?: "sm" | "xs" }) {
  if (!role) return null;
  const conf = ROLE_CONFIG[role];
  if (!conf) return null;
  const Icon = conf.icon;
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 font-medium border",
        size === "xs" ? "text-[10px] py-0 h-4 px-1.5" : "text-[11px] py-0 h-5",
        conf.color, conf.border, conf.bg
      )}
    >
      <Icon className={size === "xs" ? "w-2.5 h-2.5" : "w-3 h-3"} />
      {conf.label}
    </Badge>
  );
}
