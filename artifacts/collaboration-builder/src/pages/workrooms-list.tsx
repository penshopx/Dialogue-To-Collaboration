import { useListWorkrooms } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Plus, Clock, ChevronRight, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const STATUS_COLORS: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  active: "secondary",
  completed: "default",
  archived: "outline",
  draft: "outline",
};

const STAGE_ICONS: Record<string, string> = {
  Intake: "1",
  Framing: "2",
  "Skeptic Gate": "3",
  Blueprint: "4",
  Delivery: "5",
  "QA Gate": "6",
  Release: "7",
  Retro: "8",
};

export default function WorkroomsList() {
  const { data: workrooms, isLoading } = useListWorkrooms();
  const [search, setSearch] = useState("");

  const filtered = workrooms?.filter((w) =>
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    (w.currentStageName ?? "").toLowerCase().includes(search.toLowerCase())
  ) ?? [];

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

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search workrooms..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="w-4 h-4" />
        </Button>
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
              <p className="font-semibold text-lg">No workrooms yet</p>
              <p className="text-muted-foreground text-sm mt-1">
                Create your first workroom from a sector template to get started.
              </p>
            </div>
            <Link href="/workrooms/new">
              <Button>Create Workroom</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((room) => (
            <Link key={room.id} href={`/workrooms/${room.id}`}>
              <Card className="hover-elevate cursor-pointer group transition-all border-border hover:border-primary/30">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                          {room.name}
                        </span>
                        <Badge variant={STATUS_COLORS[room.status] ?? "outline"}>
                          {room.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Stage {STAGE_ICONS[room.currentStageName ?? ""] ?? "?"}: {room.currentStageName ?? "Intake"}
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

                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
