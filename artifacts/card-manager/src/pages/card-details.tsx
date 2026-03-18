import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { 
  useGetCard, 
  useGetCardTransactions, 
  useDeleteCard,
  getGetCardsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { CreditCard } from "@/components/credit-card";
import { formatCurrency, cn } from "@/lib/utils";
import { 
  PlusCircle, Trash2, Eye, EyeOff, ReceiptText, 
  Mail, Save, CreditCard as CreditCardIcon, 
  Settings as SettingsIcon, CheckCircle2, XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { TopUpDialog } from "@/components/shared/top-up-dialog";
import { TransactionItem } from "@/components/shared/transaction-item";
import { FreezeCardButton } from "@/components/shared/freeze-card-button";

type TabType = "topup" | "details" | "settings";

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

  const [activeTab, setActiveTab] = useState<TabType>("details");
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [showCvv, setShowCvv] = useState(false);
  const [cardName, setCardName] = useState("");
  const [cardEmail, setCardEmail] = useState("");

  useEffect(() => {
    if (card) setCardName(card.label || "");
  }, [card?.id]);

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

  const tabs: { key: TabType; label: string; icon: React.ReactNode }[] = [
    { key: "topup", label: "Top Up", icon: <PlusCircle className="w-4 h-4" /> },
    { key: "details", label: "Card Details", icon: <CreditCardIcon className="w-4 h-4" /> },
    { key: "settings", label: "Settings", icon: <SettingsIcon className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <CreditCard card={card} className="pointer-events-none" />

      <div className="grid grid-cols-3 gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              if (tab.key === "topup") {
                setTopUpOpen(true);
              } else {
                setActiveTab(tab.key);
              }
            }}
            className={cn(
              "flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium transition-all",
              tab.key === "topup"
                ? "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/50"
                : activeTab === tab.key
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/50"
            )}
          >
            {tab.icon}
            <span className="text-xs sm:text-sm">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <button onClick={() => {}} className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-black text-white text-sm font-medium border border-border/30 opacity-50 cursor-not-allowed">
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
          Add to Apple Pay
        </button>
        <button onClick={() => {}} className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white text-black text-sm font-medium border border-border/30 opacity-50 cursor-not-allowed dark:bg-muted dark:text-foreground">
          <svg viewBox="0 0 24 24" className="w-5 h-5"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Add to Google Pay
        </button>
      </div>

      {activeTab === "details" && (
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardContent className="p-4 md:p-6 space-y-6">
            <div>
              <h3 className="font-display text-lg font-semibold mb-1">About your card</h3>
              <p className="text-sm text-muted-foreground">View and manage your card information.</p>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Card Information</h4>
              
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Card Name</label>
                <div className="flex items-center gap-2">
                  <Input 
                    value={cardName}
                    onChange={(e) => {
                      if (e.target.value.length <= 70) setCardName(e.target.value);
                    }}
                    className="bg-muted/50 flex-1"
                    placeholder="Enter card name"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0 rounded-lg"
                    onClick={() => toast({ title: "Card name saved" })}
                  >
                    <Save className="w-3.5 h-3.5 mr-1" /> Save
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground text-right">{cardName.length}/70</p>
              </div>

              <InfoRow label="Brand" value="VISA" />
              <InfoRow label="Card Number" value={<span className="amount">{`**** **** **** ${card.cardNumber.slice(-4)}`}</span>} mono />
              <InfoRow label="Expiry Date" value={`${card.expiryMonth.toString().padStart(2, '0')}/${card.expiryYear.toString().slice(-2)}`} mono />
              <InfoRow label="Currency" value={card.currency} />
              <InfoRow 
                label="Status" 
                value={
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-semibold uppercase",
                    card.status === "active" ? "bg-emerald-500/20 text-emerald-400" :
                    card.status === "frozen" ? "bg-blue-500/20 text-blue-400" :
                    "bg-red-500/20 text-red-400"
                  )}>
                    {card.status}
                  </span>
                } 
              />
              <InfoRow label="Cardholder Name" value={card.cardholderName} />
              <InfoRow label="Created" value={format(new Date(card.createdAt), "MMM d, yyyy")} />
              
              <div className="flex items-center justify-between py-2 border-b border-border/30">
                <span className="text-sm text-muted-foreground">CVV</span>
                <button 
                  onClick={() => setShowCvv(!showCvv)}
                  className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
                >
                  <span className="font-mono">{showCvv ? card.cvv : "***"}</span>
                  {showCvv ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Financial Details</h4>
              <InfoRow label="Available Balance" value={<span className="amount">{formatCurrency(card.balance, card.currency)}</span>} bold />
              
              <div className="space-y-2 pl-1">
                <p className="text-sm font-medium">Card Fees</p>
                <div className="pl-3 space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Card Issuance Fee</span>
                    <span className="amount">25 $</span>
                  </div>
                  <p className="text-xs text-muted-foreground pl-2">Includes platform fee of 1 $</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Card Top-up Fee</span>
                    <span>3%</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Virtual Card – Supported</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <XCircle className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Physical Card – Not Supported</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "settings" && (
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardContent className="p-4 md:p-6 space-y-6">
            <div>
              <h3 className="font-display text-lg font-semibold mb-1">Card Settings</h3>
              <p className="text-sm text-muted-foreground">Manage your card preferences and actions.</p>
            </div>

            <div className="space-y-3">
              <FreezeCardButton cardId={cardId} isFrozen={isFrozen} variant="full" />

              <Button
                variant="outline"
                className="w-full justify-start rounded-xl h-14 text-left border-red-500/30 hover:bg-red-500/10 hover:border-red-500/50"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="w-5 h-5 mr-3 text-red-400" />
                <div>
                  <p className="font-medium text-red-400">Delete / Close Card</p>
                  <p className="text-xs text-muted-foreground">Permanently close this card</p>
                </div>
              </Button>
            </div>

            <div className="border-t border-border/50 pt-4 space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Update Card Email</h4>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="email"
                    value={cardEmail}
                    onChange={(e) => setCardEmail(e.target.value)}
                    placeholder="new@email.com"
                    className="bg-muted/50 pl-10"
                  />
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0 rounded-lg"
                  onClick={() => {
                    if (cardEmail.trim()) {
                      toast({ title: "Saved", description: "Card email updated successfully." });
                      setCardEmail("");
                    }
                  }}
                >
                  <Save className="w-3.5 h-3.5 mr-1" /> Save
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-border/50 bg-card/50 backdrop-blur shadow-xl">
        <CardContent className="p-4 md:p-6">
          <h3 className="font-display text-base md:text-lg font-semibold mb-4 flex items-center gap-2">
            <ReceiptText className="w-4 h-4 text-muted-foreground" /> Transaction History
          </h3>
          {transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <TransactionItem key={tx.id} tx={tx} currency={card.currency} variant="detailed" />
              ))}
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

      <TopUpDialog
        open={topUpOpen}
        onOpenChange={setTopUpOpen}
        cardId={cardId}
        cardLabel={card.label}
        currency={card.currency}
      />

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

function InfoRow({ label, value, mono, bold }: { label: string; value: React.ReactNode; mono?: boolean; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/30">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={cn("text-sm text-right", mono && "font-mono", bold && "font-bold text-base")}>{value}</span>
    </div>
  );
}
