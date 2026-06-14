import { useListTemplates } from "@workspace/api-client-react";
import { Link } from "wouter";
import { ArrowRight, Plus, Building2, BookOpen, GraduationCap, BadgeCheck, TrendingUp, HardHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

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

export default function TemplatesList() {
  const { data: templates, isLoading } = useListTemplates();

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
                  {tmpl.map((t) => (
                    <Card
                      key={t.id}
                      className={`group bg-gradient-to-br ${colorClass} hover-elevate cursor-pointer transition-all`}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base leading-tight">{t.name}</CardTitle>
                        <CardDescription className="text-xs mt-1 line-clamp-2">
                          {t.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <div className="flex items-start gap-1.5">
                          <span className="text-xs text-muted-foreground font-medium shrink-0">Output:</span>
                          <span className="text-xs text-muted-foreground line-clamp-2">{t.outputFinal}</span>
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between items-center pt-2">
                        <Badge variant="outline" className="text-xs capitalize">
                          {MODE_LABELS[t.mode] ?? t.mode}
                        </Badge>
                        <Link href={`/workrooms/new?templateId=${t.id}`}>
                          <Button size="sm" variant="ghost" className="gap-1 text-xs h-7">
                            Use Template
                            <ArrowRight className="w-3 h-3" />
                          </Button>
                        </Link>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
