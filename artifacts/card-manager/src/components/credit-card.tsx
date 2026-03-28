import { motion } from "framer-motion";
import { Wifi } from "lucide-react";
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
      return "from-slate-800 to-slate-900";
  }
};

export function CreditCard({ card, className, onClick }: CreditCardProps) {
  const isFrozen = card.status === "frozen";

  return (
    <div className="@container w-full">
      <motion.div
        whileHover={onClick ? { y: -3, scale: 1.01 } : {}}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        onClick={onClick}
        className={cn(
          "relative w-full rounded-2xl text-white overflow-hidden shadow-xl cursor-pointer group",
          "bg-gradient-to-br",
          getGradient(card.color),
          "aspect-[1.586/1]",
          "p-[8%]",
          isFrozen && "opacity-75 grayscale-[50%]",
          className
        )}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full translate-y-1/4 -translate-x-1/4 blur-xl" />
        <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />

        <div className="relative h-full flex flex-col justify-between z-10">
          <div className="flex justify-between items-start">
            <div className="min-w-0 flex-1">
              <p className="text-white/70 font-medium uppercase tracking-wider text-[2cqw] @[280px]:text-[10px] @[380px]:text-xs leading-tight mb-[0.5cqw]">
                {card.label || "Debit Card"}
              </p>
              <h3 className="font-display font-bold tracking-tight amount truncate text-[5cqw] @[280px]:text-lg @[380px]:text-xl @[480px]:text-2xl leading-tight">
                {formatCurrency(card.balance, card.currency)}
              </h3>
            </div>
          </div>

          <div className="flex flex-col gap-[2cqw] @[280px]:gap-1.5 @[380px]:gap-2">
            <div className="flex items-center gap-2">
              <Wifi className="text-white/80 rotate-90 shrink-0 w-[4cqw] h-[4cqw] @[280px]:w-4 @[280px]:h-4 @[380px]:w-5 @[380px]:h-5" />
            </div>
            <div className="flex items-center gap-2">
              <div className="rounded bg-gradient-to-br from-yellow-200 to-yellow-500 opacity-80 w-[8cqw] h-[5cqw] @[280px]:w-8 @[280px]:h-6 @[380px]:w-10 @[380px]:h-7" />
              {isFrozen && (
                <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-200 text-[10px] @[280px]:text-xs font-bold border border-red-500/30 backdrop-blur-md">
                  FROZEN
                </span>
              )}
            </div>

            <div className="font-mono text-white/90 drop-shadow-sm amount text-[3cqw] @[280px]:text-xs @[380px]:text-sm @[480px]:text-base tracking-[0.12em] @[380px]:tracking-[0.2em]">
              {formatCardNumber(card.cardNumber)}
            </div>

            <div className="flex justify-between items-end">
              <div className="min-w-0 flex-1">
                <p className="text-white/60 uppercase tracking-widest text-[2cqw] @[280px]:text-[9px] @[380px]:text-[10px] leading-tight mb-[0.5cqw]">Cardholder</p>
                <p className="font-medium tracking-wide truncate text-[2.5cqw] @[280px]:text-xs @[380px]:text-sm leading-tight">
                  {card.cardholderName}
                </p>
              </div>
              <div className="text-right shrink-0 ml-2">
                <p className="text-white/60 uppercase tracking-widest text-[2cqw] @[280px]:text-[9px] @[380px]:text-[10px] leading-tight mb-[0.5cqw]">Expires</p>
                <p className="font-mono tracking-widest text-[2.5cqw] @[280px]:text-xs @[380px]:text-sm leading-tight">
                  {card.expiryMonth.toString().padStart(2, '0')}/{card.expiryYear.toString().slice(-2)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
