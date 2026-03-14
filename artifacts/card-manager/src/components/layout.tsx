import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { 
  CreditCard, 
  LayoutDashboard, 
  ReceiptText, 
  User as UserIcon, 
  LifeBuoy, 
  LogOut,
  Sun,
  Moon,
  Monitor
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupLabel, 
  SidebarGroupContent, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton, 
  SidebarTrigger,
  SidebarHeader,
  SidebarFooter
} from "@/components/ui/sidebar";
import { useGetMe, useLogout } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetMeQueryKey } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Cards", url: "/cards", icon: CreditCard },
  { title: "Transactions", url: "/transactions", icon: ReceiptText },
  { title: "Profile", url: "/profile", icon: UserIcon },
  { title: "Support", url: "/support", icon: LifeBuoy },
];

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const options = [
    { value: "light" as const, icon: Sun, label: "Light" },
    { value: "dark" as const, icon: Moon, label: "Dark" },
    { value: "system" as const, icon: Monitor, label: "System" },
  ];

  return (
    <div className="flex items-center gap-1 rounded-lg border border-border/50 bg-muted/50 p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setTheme(opt.value)}
          className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all ${
            theme === opt.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
          title={opt.label}
        >
          <opt.icon className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{opt.label}</span>
        </button>
      ))}
    </div>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const { data: user, isLoading, isError } = useGetMe({
    query: { retry: false }
  });

  const logoutMutation = useLogout({
    mutation: {
      onSuccess: () => {
        queryClient.setQueryData(getGetMeQueryKey(), null);
        setLocation("/login");
      }
    }
  });

  useEffect(() => {
    if (!isLoading && (isError || !user)) {
      setLocation("/login");
    }
  }, [user, isLoading, isError, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <SidebarProvider style={{ "--sidebar-width": "16rem" } as React.CSSProperties}>
      <div className="flex min-h-screen w-full bg-background text-foreground selection:bg-primary/30">
        <div className="hidden md:block">
          <Sidebar className="border-r border-border/50 bg-card/30 backdrop-blur-xl">
            <SidebarHeader className="h-16 flex items-center px-6 border-b border-border/50">
              <Link href="/dashboard" className="flex items-center hover:opacity-80 transition-opacity">
                <img src={`${import.meta.env.BASE_URL}images/wisp-logo-design-white_1773484134261.png`} alt="Wisp" className="h-8 dark:block hidden" />
                <img src={`${import.meta.env.BASE_URL}images/wisp-logo-design-black_1773484130598.png`} alt="Wisp" className="h-8 dark:hidden block" />
              </Link>
            </SidebarHeader>
            <SidebarContent className="px-4 py-6">
              <SidebarGroup>
                <SidebarGroupLabel className="text-muted-foreground font-medium mb-2 px-2">Menu</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {navItems.map((item) => {
                      const isActive = location.startsWith(item.url);
                      return (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton 
                            asChild 
                            isActive={isActive}
                            className={isActive ? "bg-primary/10 text-primary hover:bg-primary/15" : "hover:bg-foreground/5"}
                          >
                            <Link href={item.url} className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all">
                              <item.icon className="w-5 h-5" />
                              <span className="font-medium">{item.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
            <SidebarFooter className="p-4 border-t border-border/50">
              <div className="flex items-center gap-3 px-3 py-2 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                  {user.firstName?.[0] || user.email[0].toUpperCase()}{user.lastName?.[0] || ""}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold leading-tight">{user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email.split("@")[0]}</span>
                  <span className="text-xs text-muted-foreground truncate w-32">{user.email}</span>
                </div>
              </div>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    onClick={() => logoutMutation.mutate({})}
                    className="text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors w-full justify-start"
                  >
                    <LogOut className="w-5 h-5 mr-2" />
                    <span className="font-medium">Logout</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarFooter>
          </Sidebar>
        </div>

        <div className="flex flex-col flex-1 w-full min-w-0">
          <header className="flex h-14 md:h-16 shrink-0 items-center gap-4 px-4 md:px-6 border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-50">
            <div className="md:hidden flex items-center gap-2">
              <Link href="/dashboard" className="flex items-center">
                <img src={`${import.meta.env.BASE_URL}images/wisp-logo-design-white_1773484134261.png`} alt="Wisp" className="h-7 dark:block hidden" />
                <img src={`${import.meta.env.BASE_URL}images/wisp-logo-design-black_1773484130598.png`} alt="Wisp" className="h-7 dark:hidden block" />
              </Link>
            </div>
            <div className="hidden md:flex items-center">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            </div>
            <div className="flex-1" />
            <div className="ml-auto">
              <ThemeToggle />
            </div>
            <button
              onClick={() => logoutMutation.mutate({})}
              className="md:hidden text-muted-foreground hover:text-red-400 p-2 -mr-2 transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </header>
          <main className="flex-1 p-4 md:p-6 lg:p-8 pb-24 md:pb-6 lg:pb-8 overflow-x-hidden">
            <div className="max-w-6xl mx-auto w-full">
              {children}
            </div>
          </main>
        </div>

        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border/50 safe-area-bottom">
          <div className="flex items-center justify-around h-16">
            {navItems.map((item) => {
              const isActive = location === item.url || (item.url !== "/dashboard" && location.startsWith(item.url));
              return (
                <Link
                  key={item.title}
                  href={item.url}
                  className={cn(
                    "flex flex-col items-center justify-center gap-0.5 w-16 h-full transition-colors min-h-[44px]",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <item.icon className={cn("w-5 h-5", isActive && "drop-shadow-[0_0_6px_hsl(var(--primary))]")} />
                  <span className="text-[10px] font-medium leading-tight">{item.title}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </SidebarProvider>
  );
}
