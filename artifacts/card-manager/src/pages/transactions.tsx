import { useGetAllTransactions, useGetCards } from "@workspace/api-client-react";
import { formatCurrency, cn, formatCardNumber } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight, Filter, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

export default function Transactions() {
  const { data: transactions = [], isLoading: txLoading } = useGetAllTransactions();
  const { data: cards = [], isLoading: cardsLoading } = useGetCards();

  if (txLoading || cardsLoading) {
    return <div className="animate-spin w-8 h-8 border-2 border-primary rounded-full border-t-transparent mx-auto mt-20"></div>;
  }

  const getCardDetails = (cardId: number) => {
    return cards.find(c => c.id === cardId);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground mt-1">View and filter your complete transaction history.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="bg-card">
            <Filter className="w-4 h-4 mr-2" /> Filter
          </Button>
          <Button variant="outline" className="bg-card">
            <Download className="w-4 h-4 mr-2" /> Export
          </Button>
        </div>
      </div>

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
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length > 0 ? transactions.map((tx) => {
                const card = getCardDetails(tx.cardId);
                const isPositive = tx.type === "topup" || tx.type === "refund";
                return (
                  <TableRow key={tx.id} className="hover:bg-white/5 border-border/30">
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
                        <span className="text-xs text-muted-foreground font-mono">{card ? formatCardNumber(card.cardNumber) : "Unknown"}</span>
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
                    <TableCell className={cn("text-right font-bold font-display text-base", isPositive ? "text-emerald-400" : "text-foreground")}>
                      {isPositive ? "+" : "-"}{formatCurrency(tx.amount, card?.currency)}
                    </TableCell>
                  </TableRow>
                );
              }) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    No transactions found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
