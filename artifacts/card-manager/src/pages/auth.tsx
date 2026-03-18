import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LoginForm } from "@/components/auth/login-form";
import { RegisterForm } from "@/components/auth/register-form";
import { BrandPanel } from "@/components/auth/brand-panel";
import { PillSwitcher, type AuthTab } from "@/components/auth/pill-switcher";

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
