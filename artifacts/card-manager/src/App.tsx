import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./components/theme-provider";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";

import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import Cards from "@/pages/cards";
import CardDetails from "@/pages/card-details";
import Transactions from "@/pages/transactions";
import Profile from "@/pages/profile";
import Support from "@/pages/support";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    }
  }
});

function WrappedPage({ children }: { children: React.ReactNode }) {
  return <Layout>{children}</Layout>;
}

function AppRouter() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/dashboard">{() => <WrappedPage><Dashboard /></WrappedPage>}</Route>
      <Route path="/cards/:id">{() => <WrappedPage><CardDetails /></WrappedPage>}</Route>
      <Route path="/cards">{() => <WrappedPage><Cards /></WrappedPage>}</Route>
      <Route path="/transactions">{() => <WrappedPage><Transactions /></WrappedPage>}</Route>
      <Route path="/profile">{() => <WrappedPage><Profile /></WrappedPage>}</Route>
      <Route path="/support">{() => <WrappedPage><Support /></WrappedPage>}</Route>
      <Redirect to="/login" />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AppRouter />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
