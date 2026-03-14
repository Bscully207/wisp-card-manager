import { motion } from "framer-motion";
import { CreditCard as CardIcon, Wifi } from "lucide-react";
import { cn, formatCurrency, formatCardNumber } from "@/lib/utils";
import type { Card } from "@workspace/api-client-react/src/generated/api.schemas";

interface CreditCardProps {
  card: Card;
  className?: string;
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

export function CreditCard({ card, className, onClick }: CreditCardProps) {
  const isFrozen = card.status === "frozen";

  return (
    <motion.div
      whileHover={onClick ? { y: -5, scale: 1.02 } : {}}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      onClick={onClick}
      className={cn(
        "relative w-full aspect-[1.586/1] rounded-2xl p-6 text-white overflow-hidden shadow-2xl cursor-pointer group",
        "bg-gradient-to-br",
        getGradient(card.color),
        isFrozen && "opacity-75 grayscale-[50%]",
        className
      )}
    >
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full translate-y-1/4 -translate-x-1/4 blur-xl"></div>
      
      {/* Glossy overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none"></div>

      <div className="relative h-full flex flex-col justify-between z-10">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-white/70 text-xs font-medium uppercase tracking-wider mb-1">
              {card.label || "Debit Card"}
            </p>
            <h3 className="font-display text-2xl font-bold tracking-tight amount">
              {formatCurrency(card.balance, card.currency)}
            </h3>
          </div>
          <Wifi className="w-6 h-6 text-white/80 rotate-90" />
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-8 rounded bg-gradient-to-br from-yellow-200 to-yellow-500 opacity-80" />
            {isFrozen && (
              <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-200 text-xs font-bold border border-red-500/30 backdrop-blur-md">
                FROZEN
              </span>
            )}
          </div>

          <div className="font-mono text-lg tracking-[0.2em] text-white/90 drop-shadow-sm amount">
            {formatCardNumber(card.cardNumber)}
          </div>

          <div className="flex justify-between items-end">
            <div>
              <p className="text-[10px] text-white/60 uppercase tracking-widest mb-0.5">Cardholder</p>
              <p className="font-medium tracking-wide text-sm truncate max-w-[180px]">
                {card.cardholderName}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-white/60 uppercase tracking-widest mb-0.5">Expires</p>
              <p className="font-mono text-sm tracking-widest">
                {card.expiryMonth.toString().padStart(2, '0')}/{card.expiryYear.toString().slice(-2)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
