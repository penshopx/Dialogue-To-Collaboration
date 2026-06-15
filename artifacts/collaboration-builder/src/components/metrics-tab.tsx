import { useState } from "react";
import {
  useListWorkroomMetrics,
  useUpsertWorkroomMetrics,
  getListWorkroomMetricsQueryKey,
} from "@workspace/api-client-react";
import type { WorkroomStage } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  BarChart3, RefreshCw, Clock, Save, Loader2,
  TrendingUp, Award, Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Props {
  workroomId: number;
  stages: WorkroomStage[];
}

interface MetricKpiProps {
  value: number | null | undefined;
  label: string;
  color: string;
  icon: React.ElementType;
}

function MetricKpi({ value, label, color, icon: Icon }: MetricKpiProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-4 rounded-xl border gap-1.5 text-center", color)}>
      <Icon className="w-4 h-4 opacity-70" />
      <span className="text-2xl font-bold">{value != null ? value : "—"}</span>
      <span className="text-[10px] text-muted-foreground leading-tight">{label}</span>
    </div>
  );
}

interface MetricRowProps {
  stageId: number;
  stageName: string;
  existing?: { reworkCount: number; timeSavedHours?: number | null; decisionLatencyHours?: number | null };
  workroomId: number;
  onSaved: () => void;
}

function MetricRow({ stageId, stageName, existing, workroomId, onSaved }: MetricRowProps) {
  const [rework, setRework] = useState(String(existing?.reworkCount ?? 0));
  const [timeSaved, setTimeSaved] = useState(existing?.timeSavedHours != null ? String(existing.timeSavedHours) : "");
  const [latency, setLatency] = useState(existing?.decisionLatencyHours != null ? String(existing.decisionLatencyHours) : "");
  const [saving, setSaving] = useState(false);
  const upsert = useUpsertWorkroomMetrics();
  const { toast } = useToast();

  const dirty =
    String(existing?.reworkCount ?? 0) !== rework ||
    (existing?.timeSavedHours != null ? String(existing.timeSavedHours) : "") !== timeSaved ||
    (existing?.decisionLatencyHours != null ? String(existing.decisionLatencyHours) : "") !== latency;

  async function save() {
    setSaving(true);
    try {
      await upsert.mutateAsync({
        workroomId,
        data: {
          stageId,
          reworkCount: parseInt(rework) || 0,
          timeSavedHours: timeSaved ? parseFloat(timeSaved) : undefined,
          decisionLatencyHours: latency ? parseFloat(latency) : undefined,
        } as Parameters<typeof upsert.mutateAsync>[0]["data"],
      });
      toast({ title: `Metrik stage "${stageName}" disimpan ✓` });
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid grid-cols-[1fr_70px_70px_70px_32px] gap-2 items-center py-2 border-b border-border/40 last:border-0">
      <span className="text-sm truncate">{stageName}</span>
      <Input
        type="number" min="0"
        value={rework}
        onChange={e => setRework(e.target.value)}
        className="h-7 text-xs text-center px-1"
      />
      <Input
        type="number" min="0" step="0.5" placeholder="—"
        value={timeSaved}
        onChange={e => setTimeSaved(e.target.value)}
        className="h-7 text-xs text-center px-1"
      />
      <Input
        type="number" min="0" step="0.5" placeholder="—"
        value={latency}
        onChange={e => setLatency(e.target.value)}
        className="h-7 text-xs text-center px-1"
      />
      <Button
        size="icon"
        variant={dirty ? "default" : "ghost"}
        className="h-7 w-7 shrink-0"
        disabled={!dirty || saving}
        onClick={save}
      >
        {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
      </Button>
    </div>
  );
}

export function MetricsTab({ workroomId, stages }: Props) {
  const { data: metrics = [], isLoading } = useListWorkroomMetrics(workroomId);
  const qc = useQueryClient();

  const invalidate = () => qc.invalidateQueries({ queryKey: getListWorkroomMetricsQueryKey(workroomId) });

  const metricsMap = Object.fromEntries(metrics.map(m => [m.stageId, m]));

  const totalRework = metrics.reduce((s, m) => s + m.reworkCount, 0);
  const totalTimeSaved = metrics.reduce((s, m) => s + (m.timeSavedHours ?? 0), 0);
  const latencyVals = metrics.filter(m => m.decisionLatencyHours != null);
  const avgLatency = latencyVals.length > 0
    ? latencyVals.reduce((s, m) => s + (m.decisionLatencyHours ?? 0), 0) / latencyVals.length
    : null;

  const reworkColor = totalRework === 0
    ? "border-green-500/30 bg-green-500/5 text-green-400"
    : totalRework <= 2
      ? "border-amber-500/30 bg-amber-500/5 text-amber-400"
      : "border-red-500/30 bg-red-500/5 text-red-400";

  const latencyColor = avgLatency == null || avgLatency <= 8
    ? "border-green-500/30 bg-green-500/5 text-green-400"
    : avgLatency <= 24
      ? "border-amber-500/30 bg-amber-500/5 text-amber-400"
      : "border-red-500/30 bg-red-500/5 text-red-400";

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <MetricKpi
          value={totalRework}
          label="Total Rework"
          icon={RefreshCw}
          color={reworkColor}
        />
        <MetricKpi
          value={totalTimeSaved > 0 ? Math.round(totalTimeSaved * 10) / 10 : null}
          label="Jam Dihemat (total)"
          icon={Clock}
          color="border-blue-500/30 bg-blue-500/5 text-blue-400"
        />
        <MetricKpi
          value={avgLatency != null ? Math.round(avgLatency * 10) / 10 : null}
          label="Avg Latency Gate (j)"
          icon={TrendingUp}
          color={latencyColor}
        />
      </div>

      <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30 border text-[11px] text-muted-foreground">
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span>
          <strong className="text-foreground">Rework</strong> = revisi setelah gate rejection. &nbsp;
          <strong className="text-foreground">Jam Dihemat</strong> = estimasi efisiensi vs proses manual. &nbsp;
          <strong className="text-foreground">Latency Gate</strong> = waktu dari raised issue ke keputusan.
        </span>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            Metrik per Stage
          </CardTitle>
          <CardDescription className="text-[11px]">
            Edit angka dan klik ikon save untuk memperbarui. Nilai kosong = belum tercatat.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Memuat…</p>
          ) : (
            <div>
              <div className="grid grid-cols-[1fr_70px_70px_70px_32px] gap-2 mb-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                <span>Stage</span>
                <span className="text-center">Rework</span>
                <span className="text-center">Dihemat (j)</span>
                <span className="text-center">Latency (j)</span>
                <span />
              </div>
              {stages.map(stage => (
                <MetricRow
                  key={stage.id}
                  stageId={stage.id}
                  stageName={`${stage.order}. ${stage.name}`}
                  existing={metricsMap[stage.id]}
                  workroomId={workroomId}
                  onSaved={invalidate}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {totalRework === 0 && metrics.length === 0 && (
        <div className="text-center py-4 text-xs text-muted-foreground">
          <Award className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p>Belum ada metrik dicatat. Isi angka di tabel atas untuk mulai tracking efisiensi.</p>
        </div>
      )}
    </div>
  );
}
