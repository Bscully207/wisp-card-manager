import { motion } from "framer-motion";

export type AuthTab = "login" | "register";

export function PillSwitcher({ activeTab, onTabChange }: { activeTab: AuthTab; onTabChange: (tab: AuthTab) => void }) {
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
