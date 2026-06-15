import type { WorkroomStage } from "@workspace/api-client-react";
import { CheckCircle2, Circle, Clock, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface Props {
  stages: WorkroomStage[];
  currentStageId?: number;
}

const STATUS_CFG: Record<string, { icon: React.ElementType; color: string; label: string; ring: string }> = {
  completed:    { icon: CheckCircle2,   color: "text-green-400",            label: "Selesai",         ring: "border-green-500 bg-green-500/10" },
  approved:     { icon: CheckCircle2,   color: "text-green-400",            label: "Disetujui",       ring: "border-green-500 bg-green-500/10" },
  active:       { icon: Clock,          color: "text-blue-400",             label: "Aktif",           ring: "border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/20" },
  awaiting_gate:{ icon: AlertTriangle,  color: "text-amber-400",            label: "Menunggu Gate",   ring: "border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/20 animate-pulse" },
  rejected:     { icon: XCircle,        color: "text-red-400",              label: "Ditolak",         ring: "border-red-500 bg-red-500/10" },
  pending:      { icon: Circle,         color: "text-muted-foreground/50",  label: "Belum Mulai",     ring: "border-border bg-muted/20" },
};

const LINE_COLOR: Record<string, string> = {
  completed: "bg-green-500/50",
  approved:  "bg-green-500/50",
  active:    "bg-blue-500/30",
};

export function StageTimelineTab({ stages, currentStageId }: Props) {
  const sorted = [...stages].sort((a, b) => a.order - b.order);

  return (
    <div className="py-1">
      {sorted.map((stage, idx) => {
        const cfg = STATUS_CFG[stage.status] ?? STATUS_CFG.pending;
        const Icon = cfg.icon;
        const isCurrent = stage.id === currentStageId;
        const isGate = stage.stageType === "gate";
        const isLast = idx === sorted.length - 1;
        const lineColor = LINE_COLOR[stage.status] ?? "bg-border/60";

        return (
          <div key={stage.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={cn(
                "w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                cfg.ring
              )}>
                <Icon className={cn("w-3.5 h-3.5", cfg.color)} />
              </div>
              {!isLast && (
                <div className={cn("w-0.5 flex-1 min-h-[20px] my-1 transition-colors", lineColor)} />
              )}
            </div>

            <div className={cn("flex-1 pt-0.5", isLast ? "pb-0" : "pb-4")}>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn(
                  "text-sm font-medium",
                  isCurrent ? "text-primary" : stage.status === "pending" ? "text-muted-foreground/60" : "text-foreground"
                )}>
                  {stage.order}. {stage.name}
                </span>
                {isGate && (
                  <Badge variant="outline" className="text-[9px] py-0 h-4 border-amber-500/40 text-amber-400 font-mono">GATE</Badge>
                )}
                {isCurrent && (
                  <Badge className="text-[9px] py-0 h-4 bg-blue-500/10 text-blue-400 border border-blue-500/30 font-medium">● Saat ini</Badge>
                )}
              </div>

              <div className="flex items-center gap-2 mt-0.5">
                <span className={cn("text-[11px] font-medium", cfg.color)}>{cfg.label}</span>
                {stage.gateDecision && (
                  <span className={cn(
                    "inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold",
                    stage.gateDecision === "approved"
                      ? "bg-green-500/10 text-green-400"
                      : "bg-red-500/10 text-red-400"
                  )}>
                    {stage.gateDecision === "approved" ? "✓ Disetujui" : "✗ Ditolak"}
                  </span>
                )}
              </div>

              {stage.gateNote && stage.gateNote.trim() && (
                <p className="text-[11px] text-muted-foreground mt-1 italic line-clamp-2 leading-relaxed">
                  "{stage.gateNote}"
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
