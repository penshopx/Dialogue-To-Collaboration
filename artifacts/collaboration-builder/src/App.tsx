import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";
import Dashboard from "@/pages/dashboard";
import WorkroomsList from "@/pages/workrooms-list";
import WorkroomNew from "@/pages/workroom-new";
import WorkroomDetail from "@/pages/workroom-detail";
import TemplatesList from "@/pages/templates-list";
import AgentsList from "@/pages/agents-list";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/templates" component={TemplatesList} />
        <Route path="/workrooms/new" component={WorkroomNew} />
        <Route path="/workrooms/:id" component={WorkroomDetail} />
        <Route path="/workrooms" component={WorkroomsList} />
        <Route path="/agents" component={AgentsList} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
