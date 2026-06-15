import { useState } from "react";
import { useListTemplates, useListTemplateStages, useListTemplateRoles } from "@workspace/api-client-react";
import { Link } from "wouter";
import {
  ArrowRight, Plus, Building2, BookOpen, GraduationCap, BadgeCheck,
  TrendingUp, HardHat, Layers, Users, Sparkles, ChevronDown, ChevronUp,
  ShieldAlert, Wrench, Brain, Star, FileText, CheckSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const SECTOR_ICONS: Record<string, React.ElementType> = {
  Konstruksi: HardHat,
  "ISO-KAN": BadgeCheck,
  Edutech: GraduationCap,
  BNSP: BookOpen,
  Marketing: TrendingUp,
};

const SECTOR_COLORS: Record<string, string> = {
  Konstruksi: "from-orange-500/20 to-amber-500/10 border-orange-500/20",
  "ISO-KAN": "from-blue-500/20 to-cyan-500/10 border-blue-500/20",
  Edutech: "from-violet-500/20 to-purple-500/10 border-violet-500/20",
  BNSP: "from-green-500/20 to-emerald-500/10 border-green-500/20",
  Marketing: "from-pink-500/20 to-rose-500/10 border-pink-500/20",
};

const MODE_LABELS: Record<string, string> = {
  profesional: "Professional",
  organisasi: "Organization",
  komunitas: "Community",
};

const MODE_COMPLEXITY: Record<string, { label: string; color: string; bg: string }> = {
  profesional: { label: "Kompleksitas Tinggi", color: "text-red-400", bg: "bg-red-400/10" },
  organisasi: { label: "Kompleksitas Sedang", color: "text-amber-400", bg: "bg-amber-400/10" },
  komunitas: { label: "Kompleksitas Rendah", color: "text-green-400", bg: "bg-green-400/10" },
};

const POLA_LABELS: Record<string, string> = {
  human_first_assist: "Human-first",
  ai_first_review: "AI-first",
  sequential: "Sequential",
  parallel: "Parallel",
};

const ROLE_ICONS: Record<string, React.ElementType> = {
  strategis: Brain,
  skeptis: ShieldAlert,
  eksekutor: Wrench,
  narasumber: Star,
  pack_compiler: FileText,
  evaluator: CheckSquare,
};

const ROLE_COLORS: Record<string, string> = {
  strategis: "text-blue-400",
  skeptis: "text-red-400",
  eksekutor: "text-amber-400",
  narasumber: "text-green-400",
  pack_compiler: "text-purple-400",
  evaluator: "text-cyan-400",
};

function TemplateCardStats({ templateId }: { templateId: number }) {
  const { data: stages } = useListTemplateStages(templateId);
  const { data: roles } = useListTemplateRoles(templateId);
  const stageCount = stages?.length ?? null;
  const roleCount = roles?.length ?? null;
  return (
    <>
      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">
        <Layers className="w-2.5 h-2.5" />
        {stageCount !== null ? `${stageCount} Stage${stageCount !== 1 ? "s" : ""}` : "…"}
      </span>
      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">
        <Users className="w-2.5 h-2.5" />
        {roleCount !== null ? `${roleCount} AI Role${roleCount !== 1 ? "s" : ""}` : "…"}
      </span>
    </>
  );
}

function TemplateExpandedPreview({ templateId }: { templateId: number }) {
  const { data: stages, isLoading: stagesLoading } = useListTemplateStages(templateId);
  const { data: roles, isLoading: rolesLoading } = useListTemplateRoles(templateId);

  return (
    <div className="border-t border-border/60 bg-background/30 px-4 py-4 space-y-4">
      {/* Stages */}
      <div>
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Pipeline Stages</p>
        {stagesLoading ? (
          <div className="space-y-1.5">{[1,2,3].map(i => <Skeleton key={i} className="h-8 rounded" />)}</div>
        ) : (
          <div className="space-y-1">
            {(stages ?? []).sort((a, b) => a.urutan - b.urutan).map((stage, i) => {
              const isGate = stage.tipeTahap === "gate";
              const pola = POLA_LABELS[stage.polaOperan ?? ""] ?? stage.polaOperan ?? "—";
              return (
                <div
                  key={stage.id}
                  className={cn(
                    "flex items-start gap-2.5 px-2.5 py-2 rounded-md text-xs",
                    isGate
                      ? "bg-amber-500/5 border border-amber-500/20"
                      : "bg-muted/20 border border-border/30"
                  )}
                >
                  <span className={cn(
                    "shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold mt-0.5",
                    isGate ? "bg-amber-500/20 text-amber-400" : "bg-primary/20 text-primary"
                  )}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-medium text-foreground">{stage.namaTahap}</span>
                      {isGate && (
                        <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-amber-500/40 text-amber-400">GATE</Badge>
                      )}
                      <span className="text-[10px] text-muted-foreground/60 ml-auto">{pola}</span>
                    </div>
                    {stage.exitCriteria && (
                      <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                        ✓ {stage.exitCriteria}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Roles */}
      {(roles?.length ?? 0) > 0 && (
        <>
          <Separator className="opacity-40" />
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">AI Roles</p>
            {rolesLoading ? (
              <Skeleton className="h-8 rounded" />
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {(roles ?? []).sort((a, b) => a.urutan - b.urutan).map(role => {
                  const Icon = ROLE_ICONS[role.fungsiPeran ?? ""] ?? Users;
                  const color = ROLE_COLORS[role.fungsiPeran ?? ""] ?? "text-muted-foreground";
                  return (
                    <span
                      key={role.id}
                      className={cn("inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full border border-border/50 bg-muted/30", color)}
                    >
                      <Icon className="w-2.5 h-2.5" />
                      {role.namaPeran}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function TemplatesList() {
  const { data: templates, isLoading } = useListTemplates();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const grouped = templates?.reduce<Record<string, typeof templates>>((acc, t) => {
    if (!acc[t.sector]) acc[t.sector] = [];
    acc[t.sector].push(t);
    return acc;
  }, {}) ?? {};

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workflow Templates</h1>
          <p className="text-muted-foreground mt-1">
            Start a new workroom from a sector-specific template.
          </p>
        </div>
        <Link href="/workrooms/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            New Workroom
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-[220px] rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-10">
          {Object.entries(grouped).map(([sector, tmpl]) => {
            const Icon = SECTOR_ICONS[sector] ?? Building2;
            const colorClass = SECTOR_COLORS[sector] ?? "from-muted/40 to-muted/10 border-border";
            return (
              <div key={sector}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                    <Icon className="w-4 h-4 text-foreground" />
                  </div>
                  <h2 className="text-lg font-semibold">{sector}</h2>
                  <Badge variant="outline">{tmpl.length}</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tmpl.map((t) => {
                    const isExpanded = expandedId === t.id;
                    return (
                      <Card
                        key={t.id}
                        className={cn(
                          `group bg-gradient-to-br ${colorClass} transition-all`,
                          isExpanded && "ring-1 ring-primary/30"
                        )}
                      >
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base leading-tight">{t.name}</CardTitle>
                          <CardDescription className="text-xs mt-1 line-clamp-2">
                            {t.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pb-2 space-y-3">
                          <div className="flex items-start gap-1.5">
                            <span className="text-xs text-muted-foreground font-medium shrink-0">Output:</span>
                            <span className="text-xs text-muted-foreground line-clamp-2">{t.outputFinal}</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {(() => {
                              const cx = MODE_COMPLEXITY[t.mode];
                              return cx ? (
                                <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded ${cx.bg} ${cx.color} font-medium`}>
                                  <Sparkles className="w-2.5 h-2.5" />
                                  {cx.label}
                                </span>
                              ) : null;
                            })()}
                            <TemplateCardStats templateId={t.id} />
                          </div>
                        </CardContent>

                        {isExpanded && <TemplateExpandedPreview templateId={t.id} />}

                        <CardFooter className="flex justify-between items-center pt-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs capitalize">
                              {MODE_LABELS[t.mode] ?? t.mode}
                            </Badge>
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : t.id)}
                              className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {isExpanded ? (
                                <><ChevronUp className="w-3 h-3" /> Tutup</>
                              ) : (
                                <><ChevronDown className="w-3 h-3" /> Preview</>
                              )}
                            </button>
                          </div>
                          <Link href={`/workrooms/new?templateId=${t.id}`}>
                            <Button size="sm" variant="ghost" className="gap-1 text-xs h-7">
                              Use Template
                              <ArrowRight className="w-3 h-3" />
                            </Button>
                          </Link>
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
