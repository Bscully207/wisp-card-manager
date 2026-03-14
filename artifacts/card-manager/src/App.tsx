import { useEffect, useCallback } from "react";
import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./components/theme-provider";
import NotFound from "@/pages/not-found";
import { Layout, ROOT_PATHS } from "@/components/layout";
import { useTelegram } from "@/hooks/use-telegram";

import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import Cards from "@/pages/cards";
import CardDetails from "@/pages/card-details";
import Transactions from "@/pages/transactions";
import Support from "@/pages/support";
import SettingsPage from "@/pages/settings";

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
  const [location] = useLocation();
  const { isTelegram, webApp } = useTelegram();

  const handleBack = useCallback(() => {
    window.history.back();
  }, []);

  useEffect(() => {
    if (!isTelegram || !webApp) return;

    const AUTH_PAGES = ["/login", "/register"];
    const normalizedPath = location.replace(/\/+$/, "") || "/";
    const isRootPage = ROOT_PATHS.includes(normalizedPath) || AUTH_PAGES.includes(normalizedPath);
    if (isRootPage) {
      webApp.BackButton.hide();
    } else {
      webApp.BackButton.show();
      webApp.BackButton.onClick(handleBack);
    }

    return () => {
      webApp.BackButton.offClick(handleBack);
    };
  }, [location, isTelegram, webApp, handleBack]);

  return (
    <>
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/dashboard">{() => <WrappedPage><Dashboard /></WrappedPage>}</Route>
        <Route path="/cards/:id">{() => <WrappedPage><CardDetails /></WrappedPage>}</Route>
        <Route path="/cards">{() => <WrappedPage><Cards /></WrappedPage>}</Route>
        <Route path="/transactions">{() => <WrappedPage><Transactions /></WrappedPage>}</Route>
        <Route path="/profile">{() => <Redirect to="/settings" />}</Route>
        <Route path="/support">{() => <WrappedPage><Support /></WrappedPage>}</Route>
        <Route path="/settings">{() => <WrappedPage><SettingsPage /></WrappedPage>}</Route>
        <Redirect to="/login" />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system">
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
