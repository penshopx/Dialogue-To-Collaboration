import {
  useGetDashboardSummary,
  useGetRecentWorkrooms,
  useListWorkrooms,
  useGetEarlyWarnings,
} from "@workspace/api-client-react";
import { Link } from "wouter";
import {
  Plus, Activity, CheckCircle, Clock, BookOpen, Bot,
  AlertTriangle, ArrowRight, Flame, Zap, ShieldAlert, Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const GATE_STAGE_NAMES = new Set(["Skeptic Gate", "QA Gate"]);

const SEVERITY_CONFIG: Record<string, { color: string; bg: string; border: string; icon: React.ElementType }> = {
  critical: { color: "text-red-400", bg: "bg-red-500/5", border: "border-red-500/40", icon: Flame },
  warning:  { color: "text-amber-400", bg: "bg-amber-500/5", border: "border-amber-500/40", icon: AlertTriangle },
  info:     { color: "text-blue-400", bg: "bg-blue-500/5", border: "border-blue-500/40", icon: Eye },
};

const WARNING_TYPE_LABELS: Record<string, string> = {
  gate_stuck:  "Gate Terhenti",
  overdue:     "Mendekati Deadline",
  no_activity: "Tidak Ada Aktivitas",
};

export default function Dashboard() {
  const { data: summary, isLoading: isSummaryLoading } = useGetDashboardSummary();
  const { data: recent, isLoading: isRecentLoading } = useGetRecentWorkrooms();
  const { data: allWorkrooms } = useListWorkrooms();
  const { data: earlyWarnings } = useGetEarlyWarnings();

  const pendingGates = allWorkrooms?.filter(
    (w) => w.status === "active" && w.currentStageName && GATE_STAGE_NAMES.has(w.currentStageName)
  ) ?? [];

  const criticalWarnings = earlyWarnings?.filter(w => w.severity === "critical") ?? [];
  const totalWarnings = earlyWarnings?.length ?? 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Mission Control</h1>
          <p className="text-muted-foreground mt-1">Overview of your active workrooms and AI agents.</p>
        </div>
        <Link href="/workrooms/new" className="inline-flex">
          <Button data-testid="button-create-workroom" className="gap-2">
            <Plus className="w-4 h-4" />
            New Workroom
          </Button>
        </Link>
      </div>

      {/* ── Gate Alert Banner ─────────────────────────────────────────────── */}
      {pendingGates.length > 0 && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">
                  {pendingGates.length} workroom{pendingGates.length > 1 ? "s" : ""} awaiting your gate decision
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 mb-3">
                  These pipelines are paused until a human approves or rejects the gate.
                </p>
                <div className="flex flex-wrap gap-2">
                  {pendingGates.map((w) => (
                    <Link key={w.id} href={`/workrooms/${w.id}`}>
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-amber-500/30 bg-amber-500/10 text-xs font-medium cursor-pointer hover:bg-amber-500/20 transition-colors">
                        <span className="truncate max-w-[180px]">{w.name}</span>
                        <Badge variant="outline" className="text-[10px] border-amber-400/50 text-amber-400 py-0 h-4 shrink-0">
                          {w.currentStageName}
                        </Badge>
                        <ArrowRight className="w-3 h-3 text-amber-400 shrink-0" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── KPI Cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Workrooms</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {isSummaryLoading ? <Skeleton className="h-7 w-[60px]" /> : (
              <div className="text-2xl font-bold">{summary?.activeWorkrooms || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">In progress across all sectors</p>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {isSummaryLoading ? <Skeleton className="h-7 w-[60px]" /> : (
              <div className="text-2xl font-bold">{summary?.completedWorkrooms || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Successfully delivered</p>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Templates</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isSummaryLoading ? <Skeleton className="h-7 w-[60px]" /> : (
              <div className="text-2xl font-bold">{summary?.totalTemplates || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Workflow designs available</p>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <Bot className="h-4 w-4 text-secondary-foreground" />
          </CardHeader>
          <CardContent>
            {isSummaryLoading ? <Skeleton className="h-7 w-[60px]" /> : (
              <div className="text-2xl font-bold">{summary?.totalAgents || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">AI roles configured</p>
          </CardContent>
        </Card>

        {/* Gates Waiting */}
        <Card className={pendingGates.length > 0 ? "bg-amber-500/5 border-amber-500/40" : "bg-card"}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gates Waiting</CardTitle>
            <ShieldAlert className={`h-4 w-4 ${pendingGates.length > 0 ? "text-amber-400" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${pendingGates.length > 0 ? "text-amber-400" : ""}`}>
              {pendingGates.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Human approval needed</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Early Warning System ───────────────────────────────────────────── */}
      {totalWarnings > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                <CardTitle className="text-base">Early Warning System</CardTitle>
                {criticalWarnings.length > 0 && (
                  <Badge className="bg-red-500/20 text-red-400 border-red-500/40 text-[10px]">
                    {criticalWarnings.length} CRITICAL
                  </Badge>
                )}
              </div>
              <Badge variant="outline" className="text-xs">{totalWarnings} alert{totalWarnings > 1 ? "s" : ""}</Badge>
            </div>
            <CardDescription>Workrooms yang membutuhkan perhatian segera</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {earlyWarnings?.slice(0, 6).map((warning, idx) => {
                const conf = SEVERITY_CONFIG[warning.severity] ?? SEVERITY_CONFIG.info;
                const Icon = conf.icon;
                return (
                  <Link key={idx} href={`/workrooms/${warning.workroomId}`}>
                    <div className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:opacity-90 transition-opacity ${conf.bg} ${conf.border}`}>
                      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${conf.color}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm truncate">{warning.workroomName}</span>
                          <Badge variant="outline" className={`text-[10px] py-0 h-4 border-current ${conf.color}`}>
                            {WARNING_TYPE_LABELS[warning.warningType] ?? warning.warningType}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{warning.message}</p>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Main Grid ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 bg-card">
          <CardHeader>
            <CardTitle>Recent Workrooms</CardTitle>
            <CardDescription>The most recently updated active pipelines.</CardDescription>
          </CardHeader>
          <CardContent>
            {isRecentLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-[80px] w-full" />)}
              </div>
            ) : recent && recent.length > 0 ? (
              <div className="space-y-4">
                {recent.map(room => (
                  <Link key={room.id} href={`/workrooms/${room.id}`}>
                    <div className="flex items-center justify-between p-4 border rounded-lg hover-elevate transition-colors cursor-pointer border-border group bg-background">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-foreground group-hover:text-primary transition-colors">{room.name}</span>
                          <Badge variant={room.status === 'completed' ? 'default' : room.status === 'active' ? 'secondary' : 'outline'}>
                            {room.status}
                          </Badge>
                          {room.currentStageName && GATE_STAGE_NAMES.has(room.currentStageName) && (
                            <Badge variant="outline" className="border-amber-500/40 text-amber-400 text-[10px] gap-1">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              Gate Pending
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          <span>Stage: {room.currentStageName || 'Intake'}</span>
                        </div>
                      </div>
                      <div className="w-[120px] flex flex-col gap-2">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Progress</span>
                          <span>{room.progress}%</span>
                        </div>
                        <Progress value={room.progress} className="h-2" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                No active workrooms found. Create one to get started.
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card className="bg-card">
            <CardHeader>
              <CardTitle>Status Distribution</CardTitle>
              <CardDescription>Overview of all workrooms</CardDescription>
            </CardHeader>
            <CardContent>
              {isSummaryLoading ? (
                <Skeleton className="h-[200px] w-full" />
              ) : summary?.workroomsByStatus && summary.workroomsByStatus.length > 0 ? (
                <div className="space-y-3">
                  {summary.workroomsByStatus.map(stat => (
                    <div key={stat.status} className="flex items-center justify-between">
                      <span className="capitalize text-sm">{stat.status}</span>
                      <span className="font-medium bg-muted px-2 py-1 rounded-md text-sm">{stat.count}</span>
                    </div>
                  ))}
                  {pendingGates.length > 0 && (
                    <>
                      <div className="border-t border-border my-2" />
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-amber-400 flex items-center gap-1.5">
                          <AlertTriangle className="w-3 h-3" />
                          Awaiting Gate
                        </span>
                        <span className="font-medium bg-amber-500/10 border border-amber-500/30 text-amber-400 px-2 py-1 rounded-md text-sm">{pendingGates.length}</span>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="text-muted-foreground text-sm">No data available</div>
              )}
            </CardContent>
          </Card>

          {/* Decision Latency / Activity quick-stats */}
          <Card className="bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Decision Latency</CardTitle>
              <CardDescription className="text-xs">Gate decision speed tracker</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {isSummaryLoading ? <Skeleton className="h-[80px] w-full" /> : (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Gates awaiting</span>
                    <span className="font-semibold">{pendingGates.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Critical alerts</span>
                    <span className={`font-semibold ${criticalWarnings.length > 0 ? "text-red-400" : ""}`}>
                      {criticalWarnings.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total warnings</span>
                    <span className="font-semibold">{totalWarnings}</span>
                  </div>
                  {pendingGates.length === 0 && totalWarnings === 0 && (
                    <p className="text-xs text-green-400 flex items-center gap-1 mt-1">
                      <CheckCircle className="w-3 h-3" />
                      Semua pipeline berjalan lancar
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
