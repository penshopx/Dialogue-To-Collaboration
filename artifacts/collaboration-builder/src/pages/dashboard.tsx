import { useGetDashboardSummary, useGetRecentWorkrooms } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Plus, Activity, CheckCircle, Clock, BookOpen, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { data: summary, isLoading: isSummaryLoading } = useGetDashboardSummary();
  const { data: recent, isLoading: isRecentLoading } = useGetRecentWorkrooms();

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Workrooms</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {isSummaryLoading ? (
              <Skeleton className="h-7 w-[60px]" />
            ) : (
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
            {isSummaryLoading ? (
              <Skeleton className="h-7 w-[60px]" />
            ) : (
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
            {isSummaryLoading ? (
              <Skeleton className="h-7 w-[60px]" />
            ) : (
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
            {isSummaryLoading ? (
              <Skeleton className="h-7 w-[60px]" />
            ) : (
              <div className="text-2xl font-bold">{summary?.totalAgents || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">AI roles configured</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 bg-card">
          <CardHeader>
            <CardTitle>Recent Workrooms</CardTitle>
            <CardDescription>The most recently updated active pipelines.</CardDescription>
          </CardHeader>
          <CardContent>
            {isRecentLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-[80px] w-full" />
                ))}
              </div>
            ) : recent && recent.length > 0 ? (
              <div className="space-y-4">
                {recent.map(room => (
                  <Link key={room.id} href={`/workrooms/${room.id}`}>
                    <div className="flex items-center justify-between p-4 border rounded-lg hover-elevate transition-colors cursor-pointer border-border group bg-background">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground group-hover:text-primary transition-colors">{room.name}</span>
                          <Badge variant={room.status === 'completed' ? 'default' : room.status === 'active' ? 'secondary' : 'outline'}>
                            {room.status}
                          </Badge>
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

        <Card className="bg-card">
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
            <CardDescription>Overview of all tasks</CardDescription>
          </CardHeader>
          <CardContent>
            {isSummaryLoading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : summary?.workroomsByStatus ? (
              <div className="space-y-4">
                {summary.workroomsByStatus.map(stat => (
                  <div key={stat.status} className="flex items-center justify-between">
                    <span className="capitalize">{stat.status}</span>
                    <span className="font-medium bg-muted px-2 py-1 rounded-md text-sm">{stat.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground text-sm">No data available</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
