import { useState } from "react";
import { useRoute, useLocation } from "wouter";
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
import { formatCurrency, cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowUpRight, ArrowDownRight, Snowflake, Trash2, PlusCircle, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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

export default function CardDetails() {
  const [match, params] = useRoute("/cards/:id");
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

  if (cardLoading || txLoading) {
    return <div className="animate-spin w-8 h-8 border-2 border-primary rounded-full border-t-transparent mx-auto mt-20"></div>;
  }

  if (isError || !card) {
    return <div className="text-center mt-20">Card not found.</div>;
  }

  const isFrozen = card.status === "frozen";

  return (
    <div className="space-y-8">
      <Button variant="ghost" className="pl-0 hover:bg-transparent hover:text-primary" onClick={() => setLocation("/cards")}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to My Cards
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <CreditCard card={card} className="pointer-events-none" />

          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Card Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Dialog open={topUpOpen} onOpenChange={setTopUpOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full justify-start hover-elevate" variant="secondary" disabled={isFrozen}>
                    <PlusCircle className="w-4 h-4 mr-3" /> Top Up Balance
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Top Up Card</DialogTitle>
                    <DialogDescription>Add funds to {card.label || 'your card'}.</DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit((v) => topUpMutation.mutate({ cardId, data: v }))} className="space-y-4 pt-4">
                      <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Amount ({card.currency})</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" className="bg-black/20 text-lg" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full mt-4" disabled={topUpMutation.isPending}>
                        {topUpMutation.isPending ? "Processing..." : "Confirm Top Up"}
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>

              <Button 
                variant="outline" 
                className={cn("w-full justify-start", isFrozen && "text-blue-400 border-blue-400/50 bg-blue-500/10")}
                onClick={() => freezeMutation.mutate({ cardId, data: { frozen: !isFrozen } })}
                disabled={freezeMutation.isPending}
              >
                {isFrozen ? (
                  <><ShieldAlert className="w-4 h-4 mr-3" /> Unfreeze Card</>
                ) : (
                  <><Snowflake className="w-4 h-4 mr-3" /> Freeze Card</>
                )}
              </Button>

              <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start text-red-500 hover:text-red-400 hover:bg-red-500/10">
                    <Trash2 className="w-4 h-4 mr-3" /> Delete Card
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Are you sure?</DialogTitle>
                    <DialogDescription>
                      This will permanently delete the card and its history. This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex justify-end gap-3 mt-4">
                    <Button variant="ghost" onClick={() => setDeleteOpen(false)}>Cancel</Button>
                    <Button variant="destructive" onClick={() => deleteMutation.mutate({ cardId })} disabled={deleteMutation.isPending}>
                      Yes, delete card
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="h-full border-border/50 bg-card/50 backdrop-blur shadow-xl">
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length > 0 ? (
                <div className="space-y-4">
                  {transactions.map((tx) => {
                    const isPositive = tx.type === "topup" || tx.type === "refund";
                    return (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={tx.id} 
                        className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-12 h-12 rounded-full flex items-center justify-center shadow-inner",
                            isPositive ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                          )}>
                            {isPositive ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownRight className="w-6 h-6" />}
                          </div>
                          <div>
                            <p className="font-medium text-lg capitalize">{tx.type} <span className="text-muted-foreground text-sm font-normal lowercase ml-1">{tx.description && `- ${tx.description}`}</span></p>
                            <p className="text-sm text-muted-foreground">{format(new Date(tx.createdAt), "MMM d, yyyy • h:mm a")}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={cn("font-bold text-xl font-display", isPositive ? "text-emerald-400" : "text-foreground")}>
                            {isPositive ? "+" : "-"}{formatCurrency(tx.amount, card.currency)}
                          </div>
                          <span className={cn(
                            "text-xs px-2 py-0.5 rounded-full inline-block mt-1 uppercase font-semibold",
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
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <ReceiptText className="w-12 h-12 text-muted-foreground mb-4 opacity-30" />
                  <h3 className="text-lg font-medium">No transactions yet</h3>
                  <p className="text-muted-foreground">Top up your card to start making transactions.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
