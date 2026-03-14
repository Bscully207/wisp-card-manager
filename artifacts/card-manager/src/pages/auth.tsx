import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLogin, useRegister, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ShieldCheck, Lock, Fingerprint, Mail, KeyRound, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupButton,
} from "@/components/ui/input-group";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type AuthTab = "login" | "register";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" fill="#29B6F6" />
    </svg>
  );
}

function OrDivider() {
  return (
    <div className="flex items-center gap-3 my-1">
      <div className="flex-1 h-px bg-border" />
      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Or Continue With</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

function SocialLoginButtons() {
  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        type="button"
        onClick={() => {}}
        className="inline-flex items-center justify-center gap-2 h-[44px] rounded-[12px] border-0 bg-[#F6F8FA] dark:bg-[#151520] text-[#5F6276] dark:text-[#9CA3AF] font-normal text-sm cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary/50 hover:bg-[#dddfe1] dark:hover:bg-[#1f1f30]"
        style={{ transition: "background-color 0.15s cubic-bezier(0.4,0,0.2,1)" }}
      >
        <GoogleIcon className="w-[15px] h-[15px]" />
        Google
      </button>
      <button
        type="button"
        onClick={() => {}}
        className="inline-flex items-center justify-center gap-2 h-[44px] rounded-[12px] border-0 bg-[#F6F8FA] dark:bg-[#151520] text-[#5F6276] dark:text-[#9CA3AF] font-normal text-sm cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary/50 hover:bg-[#dddfe1] dark:hover:bg-[#1f1f30]"
        style={{ transition: "background-color 0.15s cubic-bezier(0.4,0,0.2,1)" }}
      >
        <TelegramIcon className="w-[15px] h-[15px]" />
        Telegram
      </button>
    </div>
  );
}

function PillSwitcher({ activeTab, onTabChange }: { activeTab: AuthTab; onTabChange: (tab: AuthTab) => void }) {
  return (
    <div className="relative flex w-full max-w-[280px] mx-auto rounded-full bg-muted p-1">
      <button
        type="button"
        onClick={() => onTabChange("login")}
        className={`relative z-10 flex-1 py-2.5 text-sm font-semibold transition-colors cursor-pointer ${activeTab === "login" ? "text-foreground" : "text-muted-foreground"}`}
      >
        Login
      </button>
      <button
        type="button"
        onClick={() => onTabChange("register")}
        className={`relative z-10 flex-1 py-2.5 text-sm font-semibold transition-colors cursor-pointer ${activeTab === "register" ? "text-foreground" : "text-muted-foreground"}`}
      >
        Register
      </button>
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="absolute top-1 bottom-1 rounded-full bg-background"
        style={{
          width: "calc(50% - 4px)",
          left: activeTab === "login" ? 4 : "50%",
          boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        }}
      />
    </div>
  );
}

function LoginForm() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const loginMutation = useLogin({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        toast({ title: "Welcome back!" });
        setLocation("/dashboard");
      },
      onError: (error: Error) => {
        toast({
          title: "Login failed",
          description: error.message || "Invalid credentials",
          variant: "destructive",
        });
      },
    },
  });

  const onSubmit = (values: z.infer<typeof loginSchema>) => {
    loginMutation.mutate({ data: values });
  };

  return (
    <div className="space-y-5 md:space-y-6">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight mb-1.5">Welcome back</h1>
        <p className="text-muted-foreground text-sm md:text-base">Enter your details to access your account.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 md:space-y-5">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email address</FormLabel>
                <FormControl>
                  <InputGroup className="h-12 rounded-xl border-border bg-muted/50 focus-within:border-primary/50 transition-colors">
                    <InputGroupAddon align="inline-start">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                    </InputGroupAddon>
                    <InputGroupInput
                      placeholder="john@example.com"
                      className="h-12 placeholder:text-muted-foreground/60"
                      autoComplete="email"
                      inputMode="email"
                      {...field}
                    />
                  </InputGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div>
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <InputGroup className="h-12 rounded-xl border-border bg-muted/50 focus-within:border-primary/50 transition-colors">
                      <InputGroupAddon align="inline-start">
                        <KeyRound className="w-4 h-4 text-muted-foreground" />
                      </InputGroupAddon>
                      <InputGroupInput
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="h-12 placeholder:text-muted-foreground/60"
                        autoComplete="current-password"
                        {...field}
                      />
                      <InputGroupAddon align="inline-end">
                        <InputGroupButton
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                        </InputGroupButton>
                      </InputGroupAddon>
                    </InputGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="mt-1.5">
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                onClick={() => {}}
              >
                Forgot Password?
              </button>
            </div>
          </div>
          <Button
            type="submit"
            className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 rounded-xl"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign in"}
          </Button>
        </form>
      </Form>

      <OrDivider />
      <SocialLoginButtons />
    </div>
  );
}

function RegisterForm() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerMutation = useRegister({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        toast({ title: "Account created successfully!" });
        setLocation("/dashboard");
      },
      onError: (error: Error) => {
        toast({
          title: "Registration failed",
          description: error.message || "An error occurred",
          variant: "destructive",
        });
      },
    },
  });

  const onSubmit = (values: z.infer<typeof registerSchema>) => {
    registerMutation.mutate({ data: values });
  };

  return (
    <div className="space-y-5 md:space-y-6">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight mb-1.5">Create an account</h1>
        <p className="text-muted-foreground text-sm md:text-base">Join us to start managing your cards today.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 md:space-y-5">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email address</FormLabel>
                <FormControl>
                  <InputGroup className="h-12 rounded-xl border-border bg-muted/50 focus-within:border-primary/50 transition-colors">
                    <InputGroupAddon align="inline-start">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                    </InputGroupAddon>
                    <InputGroupInput placeholder="john@example.com" className="h-12 placeholder:text-muted-foreground/60" autoComplete="email" inputMode="email" {...field} />
                  </InputGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <InputGroup className="h-12 rounded-xl border-border bg-muted/50 focus-within:border-primary/50 transition-colors">
                    <InputGroupAddon align="inline-start">
                      <KeyRound className="w-4 h-4 text-muted-foreground" />
                    </InputGroupAddon>
                    <InputGroupInput
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="h-12 placeholder:text-muted-foreground/60"
                      autoComplete="new-password"
                      {...field}
                    />
                    <InputGroupAddon align="inline-end">
                      <InputGroupButton
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                      </InputGroupButton>
                    </InputGroupAddon>
                  </InputGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 rounded-xl"
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create account"}
          </Button>
        </form>
      </Form>

      <OrDivider />
      <SocialLoginButtons />
    </div>
  );
}

function BrandPanel() {
  return (
    <div className="hidden lg:flex w-1/2 relative overflow-hidden flex-col items-center justify-center p-12">
      <div className="absolute inset-0 bg-gradient-to-br from-[#e8f5f0] via-[#ede8fa] to-[#f0f4ff] dark:from-[#0d2b24] dark:via-[#1a1535] dark:to-[#0f1829]" />

      <div className="absolute top-[15%] left-[10%] w-64 h-64 rounded-full bg-emerald-400/10 dark:bg-emerald-500/10 blur-3xl" />
      <div className="absolute bottom-[20%] right-[5%] w-80 h-80 rounded-full bg-purple-400/10 dark:bg-purple-500/10 blur-3xl" />
      <div className="absolute top-[60%] left-[50%] w-48 h-48 rounded-full bg-indigo-400/8 dark:bg-indigo-500/10 blur-2xl" />

      <div className="relative z-10 max-w-md text-center space-y-8">
        <blockquote className="space-y-4">
          <p className="font-display text-2xl md:text-[1.65rem] leading-relaxed font-medium text-foreground/90">
            "In a world where privacy keeps disappearing, we chose to build for it."
          </p>
        </blockquote>

        <div className="flex items-center justify-center gap-6 text-muted-foreground">
          <div className="flex items-center gap-2 text-sm">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span>Encrypted</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Lock className="w-4 h-4 text-primary" />
            <span>Private</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Fingerprint className="w-4 h-4 text-primary" />
            <span>Yours</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage({ initialTab = "login" }: { initialTab?: AuthTab }) {
  const [activeTab, setActiveTab] = useState<AuthTab>(initialTab);

  return (
    <div className="min-h-screen w-full flex bg-background text-foreground">
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 md:p-12 relative z-10">
        <div className="w-full max-w-md space-y-6 md:space-y-8">
          <div className="flex justify-center mb-6">
            <img
              src={`${import.meta.env.BASE_URL}images/wisp-logo-design-white_1773484134261.png`}
              alt="Wisp"
              className="h-12 dark:block hidden"
            />
            <img
              src={`${import.meta.env.BASE_URL}images/wisp-logo-design-black_1773484130598.png`}
              alt="Wisp"
              className="h-12 dark:hidden block"
            />
          </div>

          <PillSwitcher activeTab={activeTab} onTabChange={setActiveTab} />

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "login" ? <LoginForm /> : <RegisterForm />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <BrandPanel />
    </div>
  );
}
