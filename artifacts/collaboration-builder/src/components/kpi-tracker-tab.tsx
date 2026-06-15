import { useState } from "react";
import { useUpdateWorkroom, getGetWorkroomQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Target, Trash2, Save, TrendingUp, Trophy, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiItem {
  id: string;
  label: string;
  target?: string;
  unit?: string;
  progress: number;
}

interface KpiData {
  items: KpiItem[];
}

interface WorkroomData {
  id: number;
  name: string;
  kpiTargets?: unknown | null;
  objective?: string | null;
}

interface Props {
  workroom: WorkroomData;
}

function parseKpiData(raw: unknown): KpiData {
  if (!raw || typeof raw !== "object") return { items: [] };
  const obj = raw as Record<string, unknown>;
  if (Array.isArray(obj.items)) {
    return { items: obj.items as KpiItem[] };
  }
  if (Array.isArray(obj.targets)) {
    const items = (obj.targets as string[]).map((t) => ({
      id: t,
      label: KPI_PRESET_MAP[t] ?? t,
      progress: 0,
    }));
    return { items };
  }
  return { items: [] };
}

const KPI_PRESET_MAP: Record<string, string> = {
  revenue_growth: "Pertumbuhan Pendapatan",
  cost_reduction: "Pengurangan Biaya",
  user_acquisition: "Akuisisi Pengguna",
  market_share: "Market Share",
  customer_satisfaction: "Kepuasan Pelanggan",
  nps: "Net Promoter Score (NPS)",
  cycle_time: "Cycle Time Proses",
  defect_rate: "Tingkat Defect",
  team_velocity: "Kecepatan Tim",
  delivery_accuracy: "Akurasi Pengiriman",
  uptime: "Uptime Sistem",
  response_time: "Response Time",
};

const PROGRESS_COLOR = (v: number) =>
  v >= 80 ? "text-green-400" : v >= 50 ? "text-amber-400" : "text-red-400";

export function KpiTrackerTab({ workroom }: Props) {
  const [kpiData, setKpiData] = useState<KpiData>(() => parseKpiData(workroom.kpiTargets));
  const [newLabel, setNewLabel] = useState("");
  const [newTarget, setNewTarget] = useState("");
  const [newUnit, setNewUnit] = useState("");
  const [isDirty, setIsDirty] = useState(false);

  const update = useUpdateWorkroom();
  const qc = useQueryClient();
  const { toast } = useToast();

  function addKpi() {
    if (!newLabel.trim()) return;
    const item: KpiItem = {
      id: `kpi_${Date.now()}`,
      label: newLabel.trim(),
      target: newTarget.trim() || undefined,
      unit: newUnit.trim() || undefined,
      progress: 0,
    };
    setKpiData((d) => ({ items: [...d.items, item] }));
    setNewLabel("");
    setNewTarget("");
    setNewUnit("");
    setIsDirty(true);
  }

  function removeKpi(id: string) {
    setKpiData((d) => ({ items: d.items.filter((i) => i.id !== id) }));
    setIsDirty(true);
  }

  function setProgress(id: string, value: number) {
    setKpiData((d) => ({
      items: d.items.map((i) => (i.id === id ? { ...i, progress: value } : i)),
    }));
    setIsDirty(true);
  }

  async function save() {
    await update.mutateAsync({
      id: workroom.id,
      data: { kpiTargets: kpiData as unknown as Record<string, unknown> } as Parameters<typeof update.mutateAsync>[0]["data"],
    });
    qc.invalidateQueries({ queryKey: getGetWorkroomQueryKey(workroom.id) });
    setIsDirty(false);
    toast({ title: "KPI disimpan", description: "Progres KPI berhasil diperbarui." });
  }

  const avgProgress =
    kpiData.items.length === 0
      ? 0
      : Math.round(kpiData.items.reduce((a, b) => a + b.progress, 0) / kpiData.items.length);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            KPI Tracker
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Pantau progres KPI dan target kunci workroom ini
          </p>
        </div>
        {isDirty && (
          <Button size="sm" onClick={save} disabled={update.isPending} className="gap-1.5">
            <Save className="w-3.5 h-3.5" />
            Simpan Perubahan
          </Button>
        )}
      </div>

      {kpiData.items.length > 0 && (
        <div className="p-3 rounded-lg bg-muted/40 border border-border flex items-center gap-4">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground mb-1">Rata-rata Progres Keseluruhan</p>
            <Progress value={avgProgress} className="h-2" />
          </div>
          <div className="text-right">
            <p className={cn("text-2xl font-bold", PROGRESS_COLOR(avgProgress))}>{avgProgress}%</p>
            <p className="text-xs text-muted-foreground">{kpiData.items.length} KPI aktif</p>
          </div>
        </div>
      )}

      {kpiData.items.length === 0 ? (
        <div className="text-center py-10 border border-dashed rounded-lg text-muted-foreground space-y-2">
          <Target className="w-8 h-8 mx-auto opacity-30" />
          <p className="text-sm">Belum ada KPI yang ditambahkan.</p>
          <p className="text-xs">Tambahkan KPI di bawah untuk mulai melacak progres.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {kpiData.items.map((kpi) => (
            <div key={kpi.id} className="p-4 rounded-lg border bg-card space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-sm">{kpi.label}</p>
                  {kpi.target && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Target: <span className="text-foreground">{kpi.target}</span>
                      {kpi.unit ? ` ${kpi.unit}` : ""}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {kpi.progress >= 100 ? (
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                      <Trophy className="w-3 h-3 mr-1" /> Tercapai
                    </Badge>
                  ) : kpi.progress < 30 ? (
                    <Badge variant="outline" className="border-red-500/30 text-red-400">
                      <AlertCircle className="w-3 h-3 mr-1" /> Butuh Perhatian
                    </Badge>
                  ) : kpi.progress >= 70 ? (
                    <Badge variant="outline" className="border-green-500/30 text-green-400">
                      <TrendingUp className="w-3 h-3 mr-1" /> On Track
                    </Badge>
                  ) : null}
                  <button
                    onClick={() => removeKpi(kpi.id)}
                    className="p-1 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Progress value={kpi.progress} className="flex-1 h-2" />
                <span className={cn("text-sm font-bold w-12 text-right", PROGRESS_COLOR(kpi.progress))}>
                  {kpi.progress}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={kpi.progress}
                onChange={(e) => setProgress(kpi.id, parseInt(e.target.value))}
                className="w-full accent-primary cursor-pointer"
              />
            </div>
          ))}
        </div>
      )}

      <div className="border rounded-lg p-4 space-y-3 bg-muted/20">
        <p className="text-sm font-medium">Tambah KPI Baru</p>
        <div className="grid grid-cols-1 gap-2">
          <Input
            placeholder="Nama KPI (cth: Revenue Growth, User Acquisition...)"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addKpi()}
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="Target (cth: 20)"
              value={newTarget}
              onChange={(e) => setNewTarget(e.target.value)}
            />
            <Input
              placeholder="Satuan (cth: %, juta, unit)"
              value={newUnit}
              onChange={(e) => setNewUnit(e.target.value)}
            />
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={addKpi}
          disabled={!newLabel.trim()}
          className="gap-1.5 w-full"
        >
          <Plus className="w-3.5 h-3.5" /> Tambah KPI
        </Button>

        {Object.keys(KPI_PRESET_MAP).length > 0 && kpiData.items.length < 3 && (
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">Atau pilih preset:</p>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(KPI_PRESET_MAP)
                .filter(([id]) => !kpiData.items.some((i) => i.id === id))
                .slice(0, 8)
                .map(([id, label]) => (
                  <button
                    key={id}
                    onClick={() => {
                      setKpiData((d) => ({
                        items: [
                          ...d.items,
                          { id, label, progress: 0 },
                        ],
                      }));
                      setIsDirty(true);
                    }}
                    className="text-xs px-2 py-0.5 rounded-full border border-border hover:border-primary/40 hover:text-primary transition-colors"
                  >
                    {label}
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
