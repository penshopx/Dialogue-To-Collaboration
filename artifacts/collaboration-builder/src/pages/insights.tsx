import { useGetInsights } from "@workspace/api-client-react";
import {
  Brain, Shield, Wrench, FileText, Star, CheckSquare,
  TrendingUp, Target, Layers, Zap, CheckCircle2, AlertTriangle,
  BarChart3, Activity,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const ROLE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; bg: string; description: string }> = {
  strategis: { label: "Rekan Strategis", icon: Brain, color: "text-blue-400", bg: "bg-blue-400/10", description: "Framing, prioritas, peta jalan" },
  skeptis: { label: "Rekan Skeptis", icon: Shield, color: "text-red-400", bg: "bg-red-400/10", description: "Validasi asumsi, risk register" },
  eksekutor: { label: "Rekan Eksekutor", icon: Wrench, color: "text-amber-400", bg: "bg-amber-400/10", description: "SOP, checklist, rencana aksi" },
  pack_compiler: { label: "DocuGen", icon: FileText, color: "text-purple-400", bg: "bg-purple-400/10", description: "Kompilasi output final" },
  narasumber: { label: "Narasumber", icon: Star, color: "text-green-400", bg: "bg-green-400/10", description: "Domain expertise" },
  evaluator: { label: "Evaluator", icon: CheckSquare, color: "text-cyan-400", bg: "bg-cyan-400/10", description: "Penilaian kualitas" },
};

const LIFE_APPLICATIONS = [
  {
    icon: Target,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    title: "Keputusan Besar",
    subtitle: "Pindah kota, beli rumah, ganti karier",
    description: "Rekan Skeptis memastikan Anda tidak terjebak bias konfirmasi. Rekan Strategis memetakan konsekuensi jangka panjang. Rekan Eksekutor membuat checklist langkah nyata.",
    stages: ["Intake konteks", "Framing opsi", "Skeptic Gate", "Blueprint aksi"],
  },
  {
    icon: Zap,
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    title: "Proyek Pribadi",
    subtitle: "Renovasi rumah, startup, buku",
    description: "Multi-agent workflow memecah kompleksitas menjadi tahap-tahap yang bisa dikelola. Gate mencegah Anda melompat ke eksekusi sebelum strategi matang.",
    stages: ["Riset & Intake", "Blueprint desain", "Delivery", "QA & Release"],
  },
  {
    icon: TrendingUp,
    color: "text-green-400",
    bg: "bg-green-400/10",
    title: "Pengembangan Diri",
    subtitle: "Skill baru, karier pivot, branding",
    description: "Framework 8 tahap memaksa refleksi mendalam sebelum aksi. Retro stage memastikan setiap siklus menghasilkan pembelajaran nyata.",
    stages: ["Audit diri", "Gap analysis", "Blueprint belajar", "Retro & iterasi"],
  },
  {
    icon: Layers,
    color: "text-violet-400",
    bg: "bg-violet-400/10",
    title: "Riset & Analisis",
    subtitle: "White paper, laporan, business case",
    description: "Ketiga agen bekerja bersama: Strategis memetakan scope, Skeptis mengkritisi metodologi, Eksekutor menyusun output yang actionable.",
    stages: ["Scoping", "Riset & Framing", "Analisis kritis", "Kompilasi & Release"],
  },
];

function StatCard({ label, value, sub, icon: Icon, color }: { label: string; value: number | string; sub?: string; icon: React.ElementType; color: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">{label}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", color.replace("text-", "bg-").replace("-400", "-400/15"))}>
            <Icon className={cn("w-5 h-5", color)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FunnelBar({ entry, maxTotal }: { entry: { stageName: string; order: number; completed: number; active: number; pending: number; awaitingGate: number }; maxTotal: number }) {
  const total = entry.completed + entry.active + entry.pending + entry.awaitingGate;
  const completedPct = maxTotal > 0 ? (entry.completed / maxTotal) * 100 : 0;

  return (
    <div className="flex items-center gap-3">
      <div className="w-5 h-5 rounded flex items-center justify-center bg-muted shrink-0">
        <span className="text-[10px] font-bold text-muted-foreground">{entry.order}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium truncate">{entry.stageName}</span>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground shrink-0 ml-2">
            {entry.completed > 0 && <span className="text-green-400">{entry.completed} ✓</span>}
            {entry.active > 0 && <span className="text-blue-400">{entry.active} ▶</span>}
            {entry.awaitingGate > 0 && <span className="text-amber-400">{entry.awaitingGate} ⬡</span>}
            {entry.pending > 0 && <span className="text-muted-foreground">{entry.pending} ○</span>}
          </div>
        </div>
        <div className="relative h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full bg-green-500 rounded-full transition-all"
            style={{ width: `${completedPct}%` }}
          />
          {entry.awaitingGate > 0 && (
            <div
              className="absolute top-0 h-full bg-amber-400/60"
              style={{ left: `${completedPct}%`, width: `${(entry.awaitingGate / maxTotal) * 100}%` }}
            />
          )}
          {entry.active > 0 && (
            <div
              className="absolute top-0 h-full bg-blue-400/60"
              style={{ left: `${(completedPct + (entry.awaitingGate / maxTotal) * 100)}%`, width: `${(entry.active / maxTotal) * 100}%` }}
            />
          )}
        </div>
      </div>
      <span className="text-xs text-muted-foreground w-6 text-right shrink-0">{total}</span>
    </div>
  );
}

export default function Insights() {
  const { data: insights, isLoading } = useGetInsights();

  const completionRate = insights && insights.totalTasksAll > 0
    ? Math.round((insights.totalTasksDone / insights.totalTasksAll) * 100)
    : 0;

  const maxFunnelTotal = insights?.stageCompletionFunnel.reduce((max, e) => {
    const t = e.completed + e.active + e.pending + e.awaitingGate;
    return Math.max(max, t);
  }, 1) ?? 1;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Insights</h1>
        <p className="text-muted-foreground mt-1">
          Pola dan pembelajaran dari semua workroom Anda — kekuatan agen mana yang paling banyak digunakan, di mana alur tersendat, dan lebih banyak lagi.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Task Selesai" value={`${insights?.totalTasksDone ?? 0}/${insights?.totalTasksAll ?? 0}`} sub={`${completionRate}% completion rate`} icon={CheckCircle2} color="text-green-400" />
          <StatCard label="Workroom Aktif" value={insights?.activeWorkrooms ?? 0} sub="pipeline berjalan" icon={Activity} color="text-blue-400" />
          <StatCard label="Workroom Selesai" value={insights?.completedWorkrooms ?? 0} sub="berhasil diselesaikan" icon={Target} color="text-violet-400" />
          <StatCard label="Template Digunakan" value={insights?.templateUsage.length ?? 0} sub="sektor berbeda" icon={BarChart3} color="text-amber-400" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="w-4 h-4 text-primary" />
              Funnel Penyelesaian Stage
            </CardTitle>
            <CardDescription>Berapa banyak workroom yang berhasil melalui setiap tahap pipeline</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-8" />)
            ) : (
              <>
                {insights?.stageCompletionFunnel.map(entry => (
                  <FunnelBar key={entry.stageName} entry={entry} maxTotal={maxFunnelTotal} />
                ))}
                <div className="flex items-center gap-4 pt-2 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-green-500 inline-block" /> Selesai</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-amber-400/60 inline-block" /> Menunggu Gate</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-blue-400/60 inline-block" /> Aktif</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-muted inline-block border" /> Pending</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Brain className="w-4 h-4 text-primary" />
              Distribusi Beban Agen
            </CardTitle>
            <CardDescription>Role mana yang paling banyak menangani task di seluruh workroom</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-14" />)
            ) : insights?.tasksByRole.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Belum ada data task.</p>
            ) : (
              insights?.tasksByRole.map(role => {
                const cfg = ROLE_CONFIG[role.role] ?? { label: role.role, icon: Brain, color: "text-muted-foreground", bg: "bg-muted", description: "" };
                const Icon = cfg.icon;
                const donePct = role.total > 0 ? Math.round((role.done / role.total) * 100) : 0;
                return (
                  <div key={role.role} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-6 h-6 rounded flex items-center justify-center shrink-0", cfg.bg)}>
                        <Icon className={cn("w-3.5 h-3.5", cfg.color)} />
                      </div>
                      <span className="text-sm font-medium flex-1">{cfg.label}</span>
                      <span className="text-xs text-muted-foreground">{role.done}/{role.total} done</span>
                      <Badge variant="outline" className={cn("text-[10px] h-4 py-0", donePct >= 80 ? "border-green-500/40 text-green-400" : "")}>
                        {donePct}%
                      </Badge>
                    </div>
                    <div className="relative h-1.5 bg-muted rounded-full overflow-hidden ml-8">
                      <div
                        className={cn("absolute left-0 top-0 h-full rounded-full transition-all", cfg.color.replace("text-", "bg-"))}
                        style={{ width: `${donePct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Layers className="w-4 h-4 text-primary" />
            Template Paling Aktif
          </CardTitle>
          <CardDescription>Workflow mana yang paling banyak digunakan dan seberapa jauh progress rata-ratanya</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[1,2,3].map(i => <Skeleton key={i} className="h-20" />)}
            </div>
          ) : insights?.templateUsage.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Belum ada workroom dari template.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {insights?.templateUsage.map(t => (
                <div key={t.templateName} className="flex flex-col gap-2 p-3 rounded-lg border border-border bg-card/50">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium leading-tight">{t.templateName}</p>
                    <Badge variant="outline" className="text-[10px] shrink-0">{t.sector}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{t.workroomCount} workroom</span>
                    <span>avg {t.avgProgress}%</span>
                  </div>
                  <Progress value={t.avgProgress} className="h-1" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div>
        <div className="mb-6">
          <h2 className="text-xl font-semibold">Kehidupan Sehari-hari × Multi-Agent Workflow</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Framework ini bukan hanya untuk bisnis. Setiap keputusan besar dalam hidup bisa mendapat manfaat dari perspektif tiga agen yang berbeda.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {LIFE_APPLICATIONS.map(app => {
            const Icon = app.icon;
            return (
              <Card key={app.title} className="group hover-elevate transition-all">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", app.bg)}>
                      <Icon className={cn("w-5 h-5", app.color)} />
                    </div>
                    <div>
                      <p className="font-semibold">{app.title}</p>
                      <p className="text-xs text-muted-foreground">{app.subtitle}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{app.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {app.stages.map((s, i) => (
                      <span key={s} className="flex items-center gap-1 text-[11px] bg-muted/80 px-2 py-1 rounded-full text-muted-foreground">
                        <span className="text-primary/60 font-bold">{i + 1}</span>
                        {s}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Insight Kunci: Mengapa Keputusan Sendiri Sering Gagal</h3>
              <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
                Pikiran manusia punya 3 kecenderungan yang menghambat: <strong className="text-foreground">bias optimisme</strong> (Strategis tanpa Skeptis), 
                <strong className="text-foreground"> analysis paralysis</strong> (Skeptis tanpa Eksekutor), dan <strong className="text-foreground">eksekusi tanpa arah</strong> (Eksekutor tanpa Strategis). 
                Multi-agent workflow memaksa ketiga perspektif ini bekerja secara berurutan — itulah mengapa hasilnya lebih baik dari berpikir sendiri.
              </p>
              <div className="flex flex-wrap gap-3 mt-4">
                {[
                  { role: "Strategis", desc: "Bertanya: Apa tujuan sebenarnya?", icon: Brain, color: "text-blue-400", bg: "bg-blue-400/10" },
                  { role: "Skeptis", desc: "Bertanya: Apa yang bisa salah?", icon: Shield, color: "text-red-400", bg: "bg-red-400/10" },
                  { role: "Eksekutor", desc: "Bertanya: Langkah konkret apa?", icon: Wrench, color: "text-amber-400", bg: "bg-amber-400/10" },
                ].map(a => {
                  const Icon = a.icon;
                  return (
                    <div key={a.role} className={cn("flex items-center gap-2 px-3 py-2 rounded-lg border text-xs", a.bg, a.color.replace("text-", "border-").replace("-400", "-400/30"))}>
                      <Icon className={cn("w-3.5 h-3.5 shrink-0", a.color)} />
                      <div>
                        <span className="font-semibold">{a.role}</span>
                        <span className="text-muted-foreground ml-1">{a.desc}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
