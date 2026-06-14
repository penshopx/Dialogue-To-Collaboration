import { useListWorkrooms } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Plus, Clock, ChevronRight, Search, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  active: "secondary",
  completed: "default",
  archived: "outline",
  draft: "outline",
};

const GATE_STAGE_NAMES = new Set(["Skeptic Gate", "QA Gate"]);

const STAGE_ORDER: Record<string, number> = {
  Intake: 1, Framing: 2, "Skeptic Gate": 3,
  Blueprint: 4, Delivery: 5, "QA Gate": 6, Release: 7, Retro: 8,
};

type FilterTab = "all" | "active" | "gate" | "completed";

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "gate", label: "Awaiting Gate" },
  { id: "completed", label: "Completed" },
];

export default function WorkroomsList() {
  const { data: workrooms, isLoading } = useListWorkrooms();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  const gateCount = workrooms?.filter(
    (w) => w.status === "active" && w.currentStageName && GATE_STAGE_NAMES.has(w.currentStageName)
  ).length ?? 0;

  const filtered = workrooms?.filter((w) => {
    const matchesSearch =
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      (w.currentStageName ?? "").toLowerCase().includes(search.toLowerCase());

    const matchesTab =
      activeTab === "all" ||
      (activeTab === "active" && w.status === "active" && (!w.currentStageName || !GATE_STAGE_NAMES.has(w.currentStageName))) ||
      (activeTab === "gate" && w.status === "active" && w.currentStageName && GATE_STAGE_NAMES.has(w.currentStageName)) ||
      (activeTab === "completed" && w.status === "completed");

    return matchesSearch && matchesTab;
  }) ?? [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workrooms</h1>
          <p className="text-muted-foreground mt-1">
            Manage your multi-agent collaboration pipelines.
          </p>
        </div>
        <Link href="/workrooms/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            New Workroom
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search workrooms..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
              {tab.id === "gate" && gateCount > 0 && (
                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold">
                  {gateCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[100px] w-full rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <Plus className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-lg">
                {activeTab === "all" ? "No workrooms yet" : `No ${FILTER_TABS.find(t => t.id === activeTab)?.label.toLowerCase()} workrooms`}
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                {activeTab === "all"
                  ? "Create your first workroom from a sector template to get started."
                  : "Try changing the filter or create a new workroom."}
              </p>
            </div>
            {activeTab === "all" && (
              <Link href="/workrooms/new">
                <Button>Create Workroom</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((room) => {
            const isGatePending = room.status === "active" && room.currentStageName && GATE_STAGE_NAMES.has(room.currentStageName);
            const stageNum = STAGE_ORDER[room.currentStageName ?? ""] ?? "?";
            return (
              <Link key={room.id} href={`/workrooms/${room.id}`}>
                <Card className={cn(
                  "hover-elevate cursor-pointer group transition-all border-border",
                  isGatePending
                    ? "hover:border-amber-500/40 border-amber-500/20 bg-amber-500/[0.03]"
                    : "hover:border-primary/30"
                )}>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={cn(
                            "font-semibold truncate transition-colors",
                            isGatePending ? "group-hover:text-amber-400" : "group-hover:text-primary"
                          )}>
                            {room.name}
                          </span>
                          <Badge variant={STATUS_COLORS[room.status] ?? "outline"}>
                            {room.status}
                          </Badge>
                          {isGatePending && (
                            <Badge variant="outline" className="border-amber-500/40 text-amber-400 text-[10px] gap-1">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              Gate Pending
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Stage {stageNum}: {room.currentStageName ?? "Intake"}
                          </span>
                        </div>
                      </div>

                      <div className="w-36 flex-shrink-0 hidden sm:flex flex-col gap-1.5">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Progress</span>
                          <span>{room.progress}%</span>
                        </div>
                        <Progress value={room.progress} className="h-1.5" />
                      </div>

                      <ChevronRight className={cn(
                        "w-4 h-4 transition-colors flex-shrink-0",
                        isGatePending ? "text-amber-400" : "text-muted-foreground group-hover:text-primary"
                      )} />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
