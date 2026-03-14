import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLogin, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export default function Login() {
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
          variant: "destructive" 
        });
      }
    }
  });

  const onSubmit = (values: z.infer<typeof loginSchema>) => {
    loginMutation.mutate({ data: values });
  };

  return (
    <div className="min-h-screen w-full flex bg-background text-foreground">
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 md:p-12 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md space-y-6 md:space-y-8"
        >
          <div className="flex justify-center mb-8 md:mb-12">
            <img src={`${import.meta.env.BASE_URL}images/wisp-logo-design-white_1773484134261.png`} alt="Wisp" className="h-14 dark:block hidden" />
            <img src={`${import.meta.env.BASE_URL}images/wisp-logo-design-black_1773484130598.png`} alt="Wisp" className="h-14 dark:hidden block" />
          </div>

          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-2">Welcome back</h1>
            <p className="text-muted-foreground text-base md:text-lg">Enter your details to access your account.</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 md:space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email address</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="john@example.com" 
                        className="h-12 bg-black/20 border-white/10 focus:border-primary/50 transition-colors" 
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
                        className="h-12 bg-black/20 border-white/10 focus:border-primary/50 transition-colors" 
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
                className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 rounded-xl hover-elevate"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign in"}
              </Button>
            </form>
          </Form>

          <p className="text-center text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/register" className="text-primary font-medium hover:underline">
              Create one now
            </Link>
          </p>
        </motion.div>
      </div>

      <div className="hidden lg:block w-1/2 relative overflow-hidden bg-card border-l border-white/5">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent z-10 mix-blend-overlay"></div>
        <img 
          src={`${import.meta.env.BASE_URL}images/auth-bg.png`} 
          alt="Premium cards floating" 
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute bottom-12 left-12 right-12 z-20 glass-panel p-8 rounded-2xl">
          <p className="font-display text-2xl font-medium text-white mb-2">"The future of debit card management is here. Fast, secure, and beautiful."</p>
          <p className="text-primary font-medium tracking-wide uppercase text-sm">NexusPay Experience</p>
        </div>
      </div>
    </div>
  );
}
