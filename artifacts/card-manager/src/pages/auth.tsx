import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLogin, useRegister, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ShieldCheck, Lock, Fingerprint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  phone: z.string().optional(),
});

type AuthTab = "login" | "register";

function PillSwitcher({ activeTab, onTabChange }: { activeTab: AuthTab; onTabChange: (tab: AuthTab) => void }) {
  return (
    <div className="relative flex w-full max-w-[280px] mx-auto rounded-full bg-muted p-1">
      <button
        type="button"
        onClick={() => onTabChange("login")}
        className="relative z-10 flex-1 py-2.5 text-sm font-semibold text-foreground transition-colors cursor-pointer"
      >
        Login
      </button>
      <button
        type="button"
        onClick={() => onTabChange("register")}
        className="relative z-10 flex-1 py-2.5 text-sm font-semibold text-foreground transition-colors cursor-pointer"
      >
        Register
      </button>
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="absolute top-1 bottom-1 rounded-full bg-background shadow-sm"
        style={{
          width: "calc(50% - 4px)",
          left: activeTab === "login" ? 4 : "50%",
        }}
      />
    </div>
  );
}

function LoginForm() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
                  <Input
                    placeholder="john@example.com"
                    className="h-12 bg-muted/50 border-border focus:border-primary/50 transition-colors"
                    autoComplete="email"
                    inputMode="email"
                    {...field}
                  />
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
                  <Input
                    type="password"
                    placeholder="••••••••"
                    className="h-12 bg-muted/50 border-border focus:border-primary/50 transition-colors"
                    autoComplete="current-password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 rounded-xl"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign in"}
          </Button>
        </form>
      </Form>
    </div>
  );
}

function RegisterForm() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "", firstName: "", lastName: "", phone: "" },
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John" className="h-12 bg-muted/50 border-border" autoComplete="given-name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Doe" className="h-12 bg-muted/50 border-border" autoComplete="family-name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email address</FormLabel>
                <FormControl>
                  <Input placeholder="john@example.com" className="h-12 bg-muted/50 border-border" autoComplete="email" inputMode="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="+1 (555) 000-0000" className="h-12 bg-muted/50 border-border" autoComplete="tel" inputMode="tel" {...field} />
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
                  <Input type="password" placeholder="••••••••" className="h-12 bg-muted/50 border-border" autoComplete="new-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full h-12 mt-2 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 rounded-xl"
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create account"}
          </Button>
        </form>
      </Form>
    </div>
  );
}

function BrandPanel() {
  return (
    <div className="hidden lg:flex w-1/2 relative overflow-hidden flex-col items-center justify-center p-12">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-background dark:from-primary/15 dark:via-primary/5 dark:to-card" />

      <div className="absolute top-[15%] left-[10%] w-64 h-64 rounded-full bg-primary/8 dark:bg-primary/10 blur-3xl" />
      <div className="absolute bottom-[20%] right-[5%] w-80 h-80 rounded-full bg-accent/6 dark:bg-accent/8 blur-3xl" />
      <div className="absolute top-[60%] left-[50%] w-48 h-48 rounded-full bg-primary/5 dark:bg-primary/8 blur-2xl" />

      <div className="relative z-10 max-w-md text-center space-y-8">
        <img
          src={`${import.meta.env.BASE_URL}images/wisp-logo-design-white_1773484134261.png`}
          alt="Wisp"
          className="h-16 mx-auto dark:block hidden"
        />
        <img
          src={`${import.meta.env.BASE_URL}images/wisp-logo-design-black_1773484130598.png`}
          alt="Wisp"
          className="h-16 mx-auto dark:hidden block"
        />

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
          <div className="flex justify-center mb-2">
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
