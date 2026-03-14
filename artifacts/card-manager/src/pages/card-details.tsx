import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { 
  useGetCard, 
  useGetCardTransactions, 
  useTopUpCard, 
  useFreezeCard, 
  useDeleteCard,
  getGetCardQueryKey,
  getGetCardsQueryKey,
  getGetCardTransactionsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { CreditCard } from "@/components/credit-card";
import { formatCurrency, cn, getCurrencySymbol } from "@/lib/utils";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowUpRight, ArrowDownRight, Snowflake, Trash2, PlusCircle, ShieldAlert, Eye, ReceiptText, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const topUpSchema = z.object({
  amount: z.coerce.number().min(0.01, "Amount must be at least 0.01"),
  description: z.string().optional(),
});

const PRESET_AMOUNTS = [10, 25, 50, 100, 250];

export default function CardDetails() {
  const params = useParams<{ id: string }>();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const cardId = parseInt(params?.id || "0", 10);

  const { data: card, isLoading: cardLoading, isError } = useGetCard(cardId, {
    query: { enabled: !!cardId }
  });
  const { data: transactions = [], isLoading: txLoading } = useGetCardTransactions(cardId, {
    query: { enabled: !!cardId }
  });

  const [topUpOpen, setTopUpOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [balanceOpen, setBalanceOpen] = useState(false);

  const form = useForm<z.infer<typeof topUpSchema>>({
    resolver: zodResolver(topUpSchema),
    defaultValues: { amount: 0, description: "Card Top Up" },
  });

  const topUpMutation = useTopUpCard({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCardQueryKey(cardId) });
        queryClient.invalidateQueries({ queryKey: getGetCardTransactionsQueryKey(cardId) });
        toast({ title: "Top-up successful!" });
        setTopUpOpen(false);
        form.reset();
      }
    }
  });

  const freezeMutation = useFreezeCard({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getGetCardQueryKey(cardId) });
        toast({ title: data.status === 'frozen' ? "Card frozen" : "Card unfrozen" });
      }
    }
  });

  const deleteMutation = useDeleteCard({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCardsQueryKey() });
        toast({ title: "Card deleted" });
        setLocation("/cards");
      }
    }
  });

  const handlePresetTopUp = (amount: number) => {
    form.setValue("amount", amount);
  };

  if (cardLoading || txLoading) {
    return <div className="animate-spin w-8 h-8 border-2 border-primary rounded-full border-t-transparent mx-auto mt-20"></div>;
  }

  if (isError || !card) {
    return <div className="text-center mt-20">Card not found.</div>;
  }

  const isFrozen = card.status === "frozen";
  const lastTopUp = transactions
    .filter(tx => tx.type === "topup")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

  return (
    <div className="space-y-6 md:space-y-8">
      <Button variant="ghost" className="pl-0 hover:bg-transparent hover:text-primary -mb-2" onClick={() => setLocation("/cards")}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to My Cards
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-1 space-y-4 md:space-y-6">
          <CreditCard card={card} className="pointer-events-none" />

          <div className="grid grid-cols-4 md:grid-cols-2 gap-2 md:gap-3">
            <button
              onClick={() => setTopUpOpen(true)}
              disabled={isFrozen}
              className={cn(
                "flex flex-col items-center gap-1.5 md:gap-2 p-3 md:p-4 rounded-2xl border border-border/50 bg-card/50 backdrop-blur transition-all",
                isFrozen ? "opacity-50 cursor-not-allowed" : "hover:bg-white/10 hover:border-primary/30 active:scale-95"
              )}
            >
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <PlusCircle className="w-5 h-5 md:w-6 md:h-6 text-emerald-400" />
              </div>
              <span className="text-[11px] md:text-sm font-medium">Top Up</span>
            </button>

            <button
              onClick={() => setBalanceOpen(true)}
              className="flex flex-col items-center gap-1.5 md:gap-2 p-3 md:p-4 rounded-2xl border border-border/50 bg-card/50 backdrop-blur transition-all hover:bg-white/10 hover:border-primary/30 active:scale-95"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Eye className="w-5 h-5 md:w-6 md:h-6 text-blue-400" />
              </div>
              <span className="text-[11px] md:text-sm font-medium">Balance</span>
            </button>

            <button
              onClick={() => freezeMutation.mutate({ cardId, data: { frozen: !isFrozen } })}
              disabled={freezeMutation.isPending}
              className={cn(
                "flex flex-col items-center gap-1.5 md:gap-2 p-3 md:p-4 rounded-2xl border border-border/50 bg-card/50 backdrop-blur transition-all active:scale-95",
                isFrozen
                  ? "border-blue-400/50 bg-blue-500/10 hover:bg-blue-500/20"
                  : "hover:bg-white/10 hover:border-primary/30"
              )}
            >
              <div className={cn(
                "w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center",
                isFrozen ? "bg-blue-500/20" : "bg-orange-500/20"
              )}>
                {isFrozen ? (
                  <ShieldAlert className="w-5 h-5 md:w-6 md:h-6 text-blue-400" />
                ) : (
                  <Snowflake className="w-5 h-5 md:w-6 md:h-6 text-orange-400" />
                )}
              </div>
              <span className="text-[11px] md:text-sm font-medium">
                {isFrozen ? "Unfreeze" : "Freeze"}
              </span>
            </button>

            <button
              onClick={() => setDeleteOpen(true)}
              className="flex flex-col items-center gap-1.5 md:gap-2 p-3 md:p-4 rounded-2xl border border-border/50 bg-card/50 backdrop-blur transition-all hover:bg-red-500/10 hover:border-red-500/30 active:scale-95"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <Trash2 className="w-5 h-5 md:w-6 md:h-6 text-red-400" />
              </div>
              <span className="text-[11px] md:text-sm font-medium text-red-400">Close</span>
            </button>
          </div>
        </div>

        <div className="lg:col-span-2">
          <Card className="h-full border-border/50 bg-card/50 backdrop-blur shadow-xl">
            <CardHeader className="px-4 md:px-6">
              <CardTitle className="text-base md:text-lg">Transaction History</CardTitle>
            </CardHeader>
            <CardContent className="px-4 md:px-6">
              {transactions.length > 0 ? (
                <div className="space-y-3 md:space-y-4">
                  {transactions.map((tx) => {
                    const isPositive = tx.type === "topup" || tx.type === "refund";
                    return (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={tx.id} 
                        className="flex items-center justify-between p-3 md:p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-center gap-3 md:gap-4 min-w-0">
                          <div className={cn(
                            "w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center shadow-inner shrink-0",
                            isPositive ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                          )}>
                            {isPositive ? <ArrowUpRight className="w-5 h-5 md:w-6 md:h-6" /> : <ArrowDownRight className="w-5 h-5 md:w-6 md:h-6" />}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm md:text-lg capitalize truncate">{tx.type} <span className="text-muted-foreground text-xs md:text-sm font-normal lowercase ml-1 hidden sm:inline">{tx.description && `- ${tx.description}`}</span></p>
                            <p className="text-[10px] md:text-sm text-muted-foreground">{format(new Date(tx.createdAt), "MMM d, yyyy • h:mm a")}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <div className={cn("font-bold text-base md:text-xl font-display", isPositive ? "text-emerald-400" : "text-foreground")}>
                            {isPositive ? "+" : "-"}{formatCurrency(tx.amount, card.currency)}
                          </div>
                          <span className={cn(
                            "text-[9px] md:text-xs px-1.5 md:px-2 py-0.5 rounded-full inline-block mt-1 uppercase font-semibold",
                            tx.status === 'completed' ? "bg-emerald-500/20 text-emerald-300" : 
                            tx.status === 'pending' ? "bg-yellow-500/20 text-yellow-300" : "bg-red-500/20 text-red-300"
                          )}>
                            {tx.status}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 md:py-16 text-center">
                  <ReceiptText className="w-12 h-12 text-muted-foreground mb-4 opacity-30" />
                  <h3 className="text-lg font-medium">No transactions yet</h3>
                  <p className="text-muted-foreground text-sm">Top up your card to start making transactions.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ResponsiveDialog
        open={topUpOpen}
        onOpenChange={setTopUpOpen}
        title="Top Up Card"
        description={`Add funds to ${card.label || 'your card'}.`}
      >
        <div className="grid grid-cols-5 gap-2 pt-2">
          {PRESET_AMOUNTS.map((amt) => (
            <Button
              key={amt}
              type="button"
              variant={form.watch("amount") === amt ? "default" : "outline"}
              size="sm"
              className="rounded-xl text-sm font-semibold"
              onClick={() => handlePresetTopUp(amt)}
            >
              {getCurrencySymbol(card.currency)}{amt}
            </Button>
          ))}
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => topUpMutation.mutate({ cardId, data: v }))} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custom Amount ({card.currency})</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" className="bg-black/20 text-lg" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full rounded-xl" disabled={topUpMutation.isPending}>
              {topUpMutation.isPending ? "Processing..." : "Confirm Top Up"}
            </Button>
          </form>
        </Form>
      </ResponsiveDialog>

      <ResponsiveDialog
        open={balanceOpen}
        onOpenChange={setBalanceOpen}
        title="Card Balance"
        description={card.label || 'Debit Card'}
        className="sm:max-w-sm bg-card border-border/50 shadow-2xl"
      >
        <div className="flex flex-col items-center py-4 md:py-6 space-y-4">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
            <Wallet className="w-8 h-8 text-primary" />
          </div>
          <div className="text-center">
            <p className="text-3xl md:text-4xl font-display font-bold">{formatCurrency(card.balance, card.currency)}</p>
            <p className="text-sm text-muted-foreground mt-1">{card.currency} Account</p>
          </div>
          <div className="w-full border-t border-border/50 pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Status</span>
              <span className={cn("font-medium capitalize", isFrozen ? "text-blue-400" : "text-emerald-400")}>
                {card.status}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Card Number</span>
              <span className="font-mono">•••• {card.cardNumber.slice(-4)}</span>
            </div>
            {lastTopUp && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Last Top Up</span>
                <span>{format(new Date(lastTopUp.createdAt), "MMM d, yyyy")}</span>
              </div>
            )}
          </div>
        </div>
      </ResponsiveDialog>

      <ResponsiveDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Close Card Permanently"
        description={`This will permanently delete ${card.label || 'this card'} and all its transaction history. Any remaining balance of ${formatCurrency(card.balance, card.currency)} will be lost. This action cannot be undone.`}
        className="sm:max-w-sm bg-card border-border/50 shadow-2xl"
      >
        <div className="flex flex-col sm:flex-row justify-end gap-3 mt-4">
          <Button variant="ghost" onClick={() => setDeleteOpen(false)} className="w-full sm:w-auto">Cancel</Button>
          <Button variant="destructive" onClick={() => deleteMutation.mutate({ cardId })} disabled={deleteMutation.isPending} className="w-full sm:w-auto">
            {deleteMutation.isPending ? "Deleting..." : "Yes, close card"}
          </Button>
        </div>
      </ResponsiveDialog>
    </div>
  );
}
