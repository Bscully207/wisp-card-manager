import { useState } from "react";
import { useGetAllTransactions, useGetCards } from "@workspace/api-client-react";
import { formatCurrency, cn, formatCardNumber } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight, Filter, Download, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

type FilterTab = "all" | "payments" | "topups";

export default function Transactions() {
  const { data: transactions = [], isLoading: txLoading } = useGetAllTransactions();
  const { data: cards = [], isLoading: cardsLoading } = useGetCards();
  const isMobile = useIsMobile();
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");

  if (txLoading || cardsLoading) {
    return <div className="animate-spin w-8 h-8 border-2 border-primary rounded-full border-t-transparent mx-auto mt-20"></div>;
  }

  const getCardDetails = (cardId: number) => {
    return cards.find(c => c.id === cardId);
  };

  const filteredTransactions = transactions.filter(tx => {
    if (activeFilter === "all") return true;
    if (activeFilter === "payments") return tx.type === "payment" || tx.type === "fee";
    if (activeFilter === "topups") return tx.type === "topup" || tx.type === "refund";
    return true;
  });

  const filterTabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "all", label: "All", count: transactions.length },
    { key: "payments", label: "Payments", count: transactions.filter(tx => tx.type === "payment" || tx.type === "fee").length },
    { key: "topups", label: "Top-ups", count: transactions.filter(tx => tx.type === "topup" || tx.type === "refund").length },
  ];

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="font-display text-2xl md:text-4xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground text-sm md:text-base mt-1">View and filter your complete transaction history.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="bg-card">
            <Filter className="w-4 h-4 mr-1.5" /> Filter
          </Button>
          <Button variant="outline" size="sm" className="bg-card">
            <Download className="w-4 h-4 mr-1.5" /> Export
          </Button>
        </div>
      </div>

      <div className="flex bg-muted/50 rounded-lg p-0.5">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={cn(
              "flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-1.5",
              activeFilter === tab.key
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
            <span className={cn(
              "text-[10px] px-1.5 py-0.5 rounded-full",
              activeFilter === tab.key
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground"
            )}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {isMobile ? (
        <div className="space-y-3">
          {filteredTransactions.length > 0 ? filteredTransactions.map((tx) => {
            const card = getCardDetails(tx.cardId);
            const isPositive = tx.type === "topup" || tx.type === "refund";
            return (
              <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-card/50 border border-border/50">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center shrink-0",
                    isPositive ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                  )}>
                    {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm capitalize truncate">
                      {tx.type}
                      {tx.description && <span className="text-muted-foreground font-normal text-xs ml-1">({tx.description})</span>}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {card?.label || "Card"} · {format(new Date(tx.createdAt), "MMM d")}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <div className={cn("font-bold text-sm amount", isPositive ? "text-emerald-400" : "text-foreground")}>
                    {isPositive ? "+" : "-"}{formatCurrency(tx.amount, card?.currency)}
                  </div>
                  <span className={cn(
                    "text-[9px] px-1.5 py-0.5 rounded-full uppercase font-bold",
                    tx.status === 'completed' ? "bg-emerald-500/20 text-emerald-300" : 
                    tx.status === 'pending' ? "bg-yellow-500/20 text-yellow-300" : "bg-red-500/20 text-red-300"
                  )}>
                    {tx.status}
                  </span>
                </div>
              </div>
            );
          }) : (
            <div className="text-center py-16 text-muted-foreground bg-card/20 rounded-2xl border border-dashed border-border/50">
              {activeFilter === "all" ? "No transactions found." : `No ${activeFilter === "payments" ? "payment" : "top-up"} transactions found.`}
            </div>
          )}
        </div>
      ) : (
        <Card className="bg-card/50 backdrop-blur border-border/50 shadow-xl overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[100px]">Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Card</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Status</TableHead>
                  {activeFilter === "topups" && <TableHead className="text-right">Balance After</TableHead>}
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length > 0 ? filteredTransactions.map((tx) => {
                  const card = getCardDetails(tx.cardId);
                  const isPositive = tx.type === "topup" || tx.type === "refund";
                  return (
                    <TableRow key={tx.id} className="hover:bg-foreground/5 border-border/30">
                      <TableCell>
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center",
                          isPositive ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                        )}>
                          {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium capitalize">{tx.type}</span>
                        {tx.description && <span className="text-muted-foreground ml-2 text-sm">({tx.description})</span>}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{card?.label || "Card"}</span>
                          <span className="text-xs text-muted-foreground font-mono amount">{card ? formatCardNumber(card.cardNumber) : "Unknown"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(tx.createdAt), "MMM d, yyyy HH:mm")}
                      </TableCell>
                      <TableCell>
                        <span className={cn(
                          "text-[10px] px-2 py-0.5 rounded-full uppercase font-bold",
                          tx.status === 'completed' ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : 
                          tx.status === 'pending' ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30" : "bg-red-500/20 text-red-300 border border-red-500/30"
                        )}>
                          {tx.status}
                        </span>
                      </TableCell>
                      {activeFilter === "topups" && (
                        <TableCell className="text-right font-mono text-sm amount">
                          {formatCurrency(tx.balanceAfter, card?.currency)}
                        </TableCell>
                      )}
                      <TableCell className={cn("text-right font-bold font-display text-base amount", isPositive ? "text-emerald-400" : "text-foreground")}>
                        {isPositive ? "+" : "-"}{formatCurrency(tx.amount, card?.currency)}
                      </TableCell>
                    </TableRow>
                  );
                }) : (
                  <TableRow>
                    <TableCell colSpan={activeFilter === "topups" ? 7 : 6} className="h-32 text-center text-muted-foreground">
                      {activeFilter === "all" ? "No transactions found." : `No ${activeFilter === "payments" ? "payment" : "top-up"} transactions found.`}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
