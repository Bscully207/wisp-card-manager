import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { format } from "date-fns";
import { motion } from "framer-motion";

interface Transaction {
  id: number;
  type: string;
  amount: number;
  description: string | null;
  status: string;
  createdAt: string;
  [key: string]: unknown;
}

interface TransactionItemProps {
  tx: Transaction;
  currency?: string;
  variant?: "compact" | "detailed";
}

export function TransactionItem({ tx, currency, variant = "compact" }: TransactionItemProps) {
  const isPositive = tx.type === "topup" || tx.type === "refund";

  if (variant === "detailed") {
    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center justify-between p-3 md:p-4 rounded-xl bg-foreground/5 border border-foreground/5 hover:bg-foreground/10 transition-colors"
      >
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          <div className={cn(
            "w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center shadow-inner shrink-0",
            isPositive ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
          )}>
            {isPositive ? <ArrowUpRight className="w-5 h-5 md:w-6 md:h-6" /> : <ArrowDownRight className="w-5 h-5 md:w-6 md:h-6" />}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm md:text-lg capitalize truncate">
              {tx.type}
              <span className="text-muted-foreground text-xs md:text-sm font-normal lowercase ml-1 hidden sm:inline">
                {tx.description && `- ${tx.description}`}
              </span>
            </p>
            <p className="text-[10px] md:text-sm text-muted-foreground">
              {format(new Date(tx.createdAt), "MMM d, yyyy \u2022 h:mm a")}
            </p>
          </div>
        </div>
        <div className="text-right shrink-0 ml-2">
          <div className={cn("font-bold text-base md:text-xl font-display amount", isPositive ? "text-emerald-400" : "text-foreground")}>
            {isPositive ? "+" : "-"}{formatCurrency(tx.amount, currency)}
          </div>
          <span className={cn(
            "text-[9px] md:text-xs px-1.5 md:px-2 py-0.5 rounded-full inline-block mt-1 uppercase font-semibold",
            tx.status === "completed" ? "bg-emerald-500/20 text-emerald-300" :
            tx.status === "pending" ? "bg-yellow-500/20 text-yellow-300" : "bg-red-500/20 text-red-300"
          )}>
            {tx.status}
          </span>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="flex items-center justify-between p-2.5 md:p-3 rounded-xl bg-foreground/5 border border-foreground/5 hover:bg-foreground/10 transition-colors">
      <div className="flex items-center gap-2.5 md:gap-3 min-w-0">
        <div className={cn(
          "w-7 h-7 md:w-9 md:h-9 rounded-full flex items-center justify-center shrink-0",
          isPositive ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
        )}>
          {isPositive ? <ArrowUpRight className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <ArrowDownRight className="w-3.5 h-3.5 md:w-4 md:h-4" />}
        </div>
        <div className="min-w-0">
          <p className="font-medium capitalize text-xs md:text-sm truncate">
            {tx.type}
            <span className="text-muted-foreground font-normal lowercase ml-1 hidden sm:inline">
              {tx.description && `- ${tx.description}`}
            </span>
          </p>
          <p className="text-[9px] md:text-[11px] text-muted-foreground">
            {format(new Date(tx.createdAt), "MMM d, yyyy")}
          </p>
        </div>
      </div>
      <div className={cn("font-bold text-xs md:text-sm shrink-0 ml-2 amount", isPositive ? "text-emerald-400" : "text-foreground")}>
        {isPositive ? "+" : "-"}{formatCurrency(tx.amount, currency)}
      </div>
    </div>
  );
}
