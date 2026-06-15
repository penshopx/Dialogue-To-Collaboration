import { useState, useEffect } from "react";
import { useUpdateWorkroom, getGetWorkroomQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save } from "lucide-react";

interface WorkroomData {
  id: number;
  name: string;
  objective?: string | null;
  riskLevel?: string | null;
  deadline?: string | null;
  status: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  workroom: WorkroomData;
}

const RISK_OPTIONS = [
  { value: "low", label: "Low Risk" },
  { value: "medium", label: "Medium Risk" },
  { value: "high", label: "High Risk" },
  { value: "critical", label: "Critical" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
];

export function EditWorkroomModal({ open, onClose, workroom }: Props) {
  const [name, setName] = useState(workroom.name);
  const [objective, setObjective] = useState(workroom.objective ?? "");
  const [riskLevel, setRiskLevel] = useState(workroom.riskLevel ?? "medium");
  const [status, setStatus] = useState(workroom.status);
  const [deadline, setDeadline] = useState(() => {
    if (!workroom.deadline) return "";
    try {
      return new Date(workroom.deadline).toISOString().split("T")[0];
    } catch {
      return "";
    }
  });

  useEffect(() => {
    if (open) {
      setName(workroom.name);
      setObjective(workroom.objective ?? "");
      setRiskLevel(workroom.riskLevel ?? "medium");
      setStatus(workroom.status);
      setDeadline(() => {
        if (!workroom.deadline) return "";
        try { return new Date(workroom.deadline).toISOString().split("T")[0]; }
        catch { return ""; }
      });
    }
  }, [open, workroom]);

  const update = useUpdateWorkroom();
  const qc = useQueryClient();
  const { toast } = useToast();

  async function handleSave() {
    if (!name.trim()) return;
    await update.mutateAsync({
      id: workroom.id,
      data: {
        name: name.trim(),
        objective: objective.trim() || undefined,
        riskLevel,
        status,
        deadline: deadline || null,
      } as Parameters<typeof update.mutateAsync>[0]["data"],
    });
    qc.invalidateQueries({ queryKey: getGetWorkroomQueryKey(workroom.id) });
    toast({ title: "Workroom diperbarui", description: `"${name.trim()}" berhasil disimpan.` });
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Workroom</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-1">
          <div className="space-y-1.5">
            <Label htmlFor="wr-name">Nama Workroom</Label>
            <Input
              id="wr-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama workroom..."
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="wr-obj">Objektif</Label>
            <Textarea
              id="wr-obj"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="Jelaskan tujuan workroom ini..."
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Tingkat Risiko</Label>
              <Select value={riskLevel} onValueChange={setRiskLevel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RISK_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="wr-deadline">Deadline</Label>
            <Input
              id="wr-deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={update.isPending}>
            Batal
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || update.isPending} className="gap-1.5">
            {update.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
