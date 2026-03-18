import { motion } from "framer-motion";
import { CreditCard as CardIcon, Wifi } from "lucide-react";
import { cn, formatCurrency, formatCardNumber } from "@/lib/utils";
import type { Card } from "@workspace/api-client-react/src/generated/api.schemas";

interface CreditCardProps {
  card: Card;
  className?: string;
  compact?: boolean;
  onClick?: () => void;
}

const getGradient = (color?: string | null) => {
  switch (color?.toLowerCase()) {
    case "blue":
      return "from-blue-600 to-indigo-900";
    case "black":
      return "from-gray-800 to-black";
    case "silver":
      return "from-gray-400 to-gray-600";
    case "purple":
      return "from-purple-600 to-indigo-900";
    case "green":
      return "from-emerald-500 to-teal-800";
    default:
      return "from-slate-800 to-slate-900"; // Default dark
  }
};

export function CreditCard({ card, className, compact, onClick }: CreditCardProps) {
  const isFrozen = card.status === "frozen";

  return (
    <motion.div
      whileHover={onClick ? { y: -3, scale: 1.01 } : {}}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      onClick={onClick}
      className={cn(
        "relative w-full rounded-2xl text-white overflow-hidden shadow-xl cursor-pointer group",
        "bg-gradient-to-br",
        getGradient(card.color),
        compact ? "aspect-[1.8/1] p-3 sm:p-4" : "aspect-[1.586/1] p-4 sm:p-6",
        isFrozen && "opacity-75 grayscale-[50%]",
        className
      )}
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full translate-y-1/4 -translate-x-1/4 blur-xl"></div>
      <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none"></div>

      <div className="relative h-full flex flex-col justify-between z-10">
        <div className="flex justify-between items-start">
          <div className="min-w-0 flex-1">
            <p className={cn("text-white/70 font-medium uppercase tracking-wider", compact ? "text-[10px] mb-0.5" : "text-xs mb-1")}>
              {card.label || "Debit Card"}
            </p>
            <h3 className={cn("font-display font-bold tracking-tight amount truncate", compact ? "text-lg sm:text-xl" : "text-xl sm:text-2xl")}>
              {formatCurrency(card.balance, card.currency)}
            </h3>
          </div>
        </div>

        <div className={cn(compact ? "space-y-1" : "space-y-2 sm:space-y-4")}>
          <div className="flex items-center gap-2">
            <Wifi className={cn("text-white/80 rotate-90 shrink-0", compact ? "w-4 h-4" : "w-5 h-5")} />
          </div>
          <div className="flex items-center gap-2">
            <div className={cn("rounded bg-gradient-to-br from-yellow-200 to-yellow-500 opacity-80", compact ? "w-7 h-5" : "w-8 h-6 sm:w-10 sm:h-8")} />
            {isFrozen && (
              <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-200 text-xs font-bold border border-red-500/30 backdrop-blur-md">
                FROZEN
              </span>
            )}
          </div>

          <div className={cn("font-mono text-white/90 drop-shadow-sm amount", compact ? "text-xs sm:text-sm tracking-[0.12em]" : "text-sm sm:text-lg tracking-[0.15em] sm:tracking-[0.2em]")}>
            {formatCardNumber(card.cardNumber)}
          </div>

          <div className="flex justify-between items-end">
            <div className="min-w-0">
              <p className="text-[10px] text-white/60 uppercase tracking-widest mb-0.5">Cardholder</p>
              <p className={cn("font-medium tracking-wide truncate", compact ? "text-xs max-w-[140px]" : "text-sm max-w-[180px]")}>
                {card.cardholderName}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[10px] text-white/60 uppercase tracking-widest mb-0.5">Expires</p>
              <p className={cn("font-mono tracking-widest", compact ? "text-xs" : "text-sm")}>
                {card.expiryMonth.toString().padStart(2, '0')}/{card.expiryYear.toString().slice(-2)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
