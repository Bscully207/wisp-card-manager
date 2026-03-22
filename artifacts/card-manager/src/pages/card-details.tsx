import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { 
  useGetCard, 
  useGetCardTransactions, 
  useGetCardDetailsWithTransactions,
  useGetCardBalanceHistory,
  useDeleteCard,
  useUpdateCardContacts,
  getGetCardsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { CreditCard } from "@/components/credit-card";
import { formatCurrency, cn } from "@/lib/utils";
import { 
  PlusCircle, Trash2, Eye, EyeOff, ReceiptText, 
  Mail, Phone, Save, CreditCard as CreditCardIcon, 
  Settings as SettingsIcon, CheckCircle2, XCircle, KeyRound,
  Wallet, Link, Unlink, Send, Download, Package
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { TopUpDialog } from "@/components/shared/top-up-dialog";
import { TransactionItem } from "@/components/shared/transaction-item";
import { FreezeCardButton } from "@/components/shared/freeze-card-button";
import { ChangePinDialog } from "@/components/shared/change-pin-dialog";
import { SecureCardViewer } from "@/components/secure-card-viewer";
import { useTelegram } from "@/hooks/use-telegram";
import { useGetCardTelegram, useLinkTelegram, useUnlinkTelegram, getGetCardTelegramQueryKey } from "@/hooks/use-telegram-link";
import { ExportDialog } from "@/components/shared/export-dialog";
import { ActivateCardDialog } from "@/components/shared/activate-card-dialog";
import { ShippingAddressForm } from "@/components/shared/shipping-address-form";
import { ShippingTracking } from "@/components/shared/shipping-tracking";

const DIAL_CODES = [
  { code: "+1", label: "US/CA +1" },
  { code: "+44", label: "UK +44" },
  { code: "+33", label: "FR +33" },
  { code: "+49", label: "DE +49" },
  { code: "+34", label: "ES +34" },
  { code: "+39", label: "IT +39" },
  { code: "+31", label: "NL +31" },
  { code: "+32", label: "BE +32" },
  { code: "+41", label: "CH +41" },
  { code: "+43", label: "AT +43" },
  { code: "+351", label: "PT +351" },
  { code: "+353", label: "IE +353" },
  { code: "+46", label: "SE +46" },
  { code: "+47", label: "NO +47" },
  { code: "+45", label: "DK +45" },
  { code: "+358", label: "FI +358" },
  { code: "+48", label: "PL +48" },
  { code: "+61", label: "AU +61" },
  { code: "+81", label: "JP +81" },
  { code: "+86", label: "CN +86" },
  { code: "+91", label: "IN +91" },
  { code: "+55", label: "BR +55" },
];

type TabType = "topup" | "details" | "settings";
type HistoryTab = "transactions" | "balance";

export default function CardDetails() {
  const params = useParams<{ id: string }>();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const cardId = parseInt(params?.id || "0", 10);

  const combinedQuery = useGetCardDetailsWithTransactions(cardId, {
    query: { enabled: !!cardId }
  });

  const cardFallback = useGetCard(cardId, {
    query: { enabled: !!cardId && combinedQuery.isError }
  });
  const txFallback = useGetCardTransactions(cardId, {
    query: { enabled: !!cardId && combinedQuery.isError }
  });

  const card = combinedQuery.isError ? cardFallback.data : combinedQuery.data?.card;
  const transactions = combinedQuery.isError
    ? (txFallback.data ?? [])
    : (combinedQuery.data?.transactions ?? []);
  const cardLoading = combinedQuery.isError
    ? cardFallback.isLoading
    : combinedQuery.isLoading;
  const txLoading = combinedQuery.isError
    ? txFallback.isLoading
    : combinedQuery.isLoading;
  const isError = combinedQuery.isError
    ? cardFallback.isError
    : false;

  const { data: balanceHistory = [], isLoading: bhLoading } = useGetCardBalanceHistory(cardId, {
    query: { enabled: !!cardId }
  });

  const [activeTab, setActiveTab] = useState<TabType>("details");
  const [historyTab, setHistoryTab] = useState<HistoryTab>("transactions");
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [changePinOpen, setChangePinOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [activateOpen, setActivateOpen] = useState(false);
  const [shippingOpen, setShippingOpen] = useState(false);
  const [showCvv, setShowCvv] = useState(false);
  const [cardName, setCardName] = useState("");
  const [cardEmail, setCardEmail] = useState("");
  const [phoneDialCode, setPhoneDialCode] = useState("+1");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [applyToAll, setApplyToAll] = useState(false);
  const [confirmApplyAllOpen, setConfirmApplyAllOpen] = useState(false);

  useEffect(() => {
    if (card) setCardName(card.label || "");
  }, [card?.id]);

  const contactsMutation = useUpdateCardContacts({
    mutation: {
      onSuccess: (data) => {
        toast({ title: "Saved", description: data.message });
        setCardEmail("");
        setPhoneNumber("");
        setApplyToAll(false);
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to update contact details.", variant: "destructive" });
      },
    },
  });

  const isContactFormValid = cardEmail.trim() !== "" && phoneNumber.trim() !== "";

  const handleContactSubmit = () => {
    if (!isContactFormValid) return;
    if (applyToAll) {
      setConfirmApplyAllOpen(true);
      return;
    }
    contactsMutation.mutate({
      cardId,
      data: {
        email: cardEmail.trim(),
        phoneDialCode,
        phoneNumber: phoneNumber.trim(),
        applyToAll: false,
      },
    });
  };

  const handleConfirmApplyAll = () => {
    setConfirmApplyAllOpen(false);
    contactsMutation.mutate({
      cardId,
      data: {
        email: cardEmail.trim(),
        phoneDialCode,
        phoneNumber: phoneNumber.trim(),
        applyToAll: true,
      },
    });
  };

  const deleteMutation = useDeleteCard({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCardsQueryKey() });
        toast({ title: "Card deleted" });
        setLocation("/cards");
      }
    }
  });

  if (cardLoading || txLoading || bhLoading) {
    return <div className="animate-spin w-8 h-8 border-2 border-primary rounded-full border-t-transparent mx-auto mt-20"></div>;
  }

  if (isError || !card) {
    return <div className="text-center mt-20">Card not found.</div>;
  }

  const isFrozen = card.status === "frozen";
  const isPhysical = card.type === "physical";
  const isPendingActivation = card.status === "pending_activation";

  const spendingTransactions = transactions.filter(tx => tx.type === "payment" || tx.type === "fee");

  const tabs: { key: TabType; label: string; icon: React.ReactNode }[] = [
    { key: "topup", label: "Top Up", icon: <PlusCircle className="w-4 h-4" /> },
    { key: "details", label: "Card Details", icon: <CreditCardIcon className="w-4 h-4" /> },
    { key: "settings", label: "Settings", icon: <SettingsIcon className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <CreditCard card={card} className="pointer-events-none" />

      {isPendingActivation && (
        <Card className="border-yellow-500/30 bg-yellow-500/5 backdrop-blur">
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/20">
                <KeyRound className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm font-semibold">Card Pending Activation</p>
                <p className="text-xs text-muted-foreground">Enter the activation code from your mail to start using this card</p>
              </div>
            </div>
            <Button size="sm" onClick={() => setActivateOpen(true)} className="shrink-0">
              Activate
            </Button>
          </CardContent>
        </Card>
      )}

      {isPhysical && (
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 rounded-xl h-12 border-border/50"
            onClick={() => setShippingOpen(true)}
          >
            <Package className="w-4 h-4 mr-2" />
            Request Shipping
          </Button>
        </div>
      )}

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
                    card.status === "pending_activation" ? "bg-yellow-500/20 text-yellow-400" :
                    "bg-red-500/20 text-red-400"
                  )}>
                    {card.status === "pending_activation" ? "Pending Activation" : card.status}
                  </span>
                } 
              />
              <InfoRow label="Card Type" value={<span className="capitalize">{card.type}</span>} />
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
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Physical Card – Supported</span>
                </div>
              </div>
            </div>

            <div className="border-t border-border/50 pt-4">
              <SecureCardViewer cardId={cardId} cardLabel={card.label} />
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
                className="w-full justify-start rounded-xl h-14 text-left"
                onClick={() => setChangePinOpen(true)}
              >
                <KeyRound className="w-5 h-5 mr-3 text-primary" />
                <div>
                  <p className="font-medium">Change PIN</p>
                  <p className="text-xs text-muted-foreground">Update your 6-digit card PIN</p>
                </div>
              </Button>

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

            <div className="border-t border-border/50 pt-4 space-y-4">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Contact Information</h4>

              <div className="space-y-2">
                <Label htmlFor="contact-email" className="text-sm text-muted-foreground">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="contact-email"
                    type="email"
                    value={cardEmail}
                    onChange={(e) => setCardEmail(e.target.value)}
                    placeholder="new@email.com"
                    className="bg-muted/50 pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Phone Number</Label>
                <div className="flex items-center gap-2">
                  <Select value={phoneDialCode} onValueChange={setPhoneDialCode}>
                    <SelectTrigger className="w-[120px] bg-muted/50 shrink-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DIAL_CODES.map((dc) => (
                        <SelectItem key={dc.code} value={dc.code}>
                          {dc.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="relative flex-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="123 456 7890"
                      className="bg-muted/50 pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Checkbox
                  id="apply-to-all"
                  checked={applyToAll}
                  onCheckedChange={(checked) => setApplyToAll(checked === true)}
                />
                <Label htmlFor="apply-to-all" className="text-sm cursor-pointer">
                  Apply to all my cards
                </Label>
              </div>

              <Button
                size="sm"
                variant="outline"
                className="w-full rounded-lg"
                disabled={!isContactFormValid || contactsMutation.isPending}
                onClick={handleContactSubmit}
              >
                {contactsMutation.isPending ? "Saving..." : <><Save className="w-3.5 h-3.5 mr-1" /> Save Contact Details</>}
              </Button>
            </div>

            <TelegramSection cardId={cardId} />
          </CardContent>
        </Card>
      )}

      <Card className="border-border/50 bg-card/50 backdrop-blur shadow-xl">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex bg-muted/50 rounded-lg p-0.5 flex-1">
              <button
                onClick={() => setHistoryTab("transactions")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-sm font-medium transition-all",
                  historyTab === "transactions"
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <ReceiptText className="w-3.5 h-3.5" />
                <span>Transactions</span>
              </button>
              <button
                onClick={() => setHistoryTab("balance")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-sm font-medium transition-all",
                  historyTab === "balance"
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>Balance History</span>
              </button>
            </div>
            {transactions.length > 0 && (
              <Button variant="outline" size="sm" className="bg-card shrink-0" onClick={() => setExportOpen(true)}>
                <Download className="w-4 h-4 mr-1.5" /> Export
              </Button>
            )}
          </div>

          {historyTab === "transactions" && (
            <>
              {spendingTransactions.length > 0 ? (
                <div className="space-y-3">
                  {spendingTransactions.map((tx) => (
                    <TransactionItem key={tx.id} tx={tx} currency={card.currency} variant="detailed" />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 md:py-16 text-center">
                  <ReceiptText className="w-12 h-12 text-muted-foreground mb-4 opacity-30" />
                  <h3 className="text-lg font-medium">No transactions yet</h3>
                  <p className="text-muted-foreground text-sm">No spending transactions recorded for this card.</p>
                </div>
              )}
            </>
          )}

          {historyTab === "balance" && (
            <>
              {balanceHistory.length > 0 ? (
                <div className="space-y-3">
                  {balanceHistory.map((entry: BalanceHistoryEntryDisplay) => (
                    <BalanceHistoryItem key={entry.id} entry={entry} currency={card.currency} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 md:py-16 text-center">
                  <Wallet className="w-12 h-12 text-muted-foreground mb-4 opacity-30" />
                  <h3 className="text-lg font-medium">No balance history</h3>
                  <p className="text-muted-foreground text-sm">Top up your card to see balance changes here.</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <ExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        cardId={cardId}
        cardLabel={card.label ?? undefined}
      />

      <ChangePinDialog
        open={changePinOpen}
        onOpenChange={setChangePinOpen}
        cardId={cardId}
        cardLabel={card.label}
      />

      {isPhysical && <ShippingTracking cardId={cardId} />}

      <TopUpDialog
        open={topUpOpen}
        onOpenChange={setTopUpOpen}
        cardId={cardId}
        cardLabel={card.label}
        currency={card.currency}
      />

      <ActivateCardDialog
        open={activateOpen}
        onOpenChange={setActivateOpen}
        cardId={cardId}
      />

      <ShippingAddressForm
        open={shippingOpen}
        onOpenChange={setShippingOpen}
        cardId={cardId}
      />

      <ResponsiveDialog
        open={confirmApplyAllOpen}
        onOpenChange={setConfirmApplyAllOpen}
        title="Apply to All Cards"
        description="This will update the contact information for every card in your account. Are you sure you want to continue?"
        className="sm:max-w-sm bg-card border-border/50 shadow-2xl"
      >
        <div className="flex flex-col sm:flex-row justify-end gap-3 mt-4">
          <Button variant="ghost" onClick={() => setConfirmApplyAllOpen(false)} className="w-full sm:w-auto">Cancel</Button>
          <Button onClick={handleConfirmApplyAll} disabled={contactsMutation.isPending} className="w-full sm:w-auto">
            {contactsMutation.isPending ? "Updating..." : "Yes, update all cards"}
          </Button>
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

function TelegramSection({ cardId }: { cardId: number }) {
  const { isTelegram, telegramUser } = useTelegram();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: telegramData, isLoading } = useGetCardTelegram(cardId, {
    query: { enabled: !!cardId }
  });
  const linkMutation = useLinkTelegram({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCardTelegramQueryKey(cardId) });
        toast({ title: "Linked", description: "Telegram account linked to this card." });
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to link Telegram account.", variant: "destructive" });
      },
    },
  });
  const unlinkMutation = useUnlinkTelegram({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCardTelegramQueryKey(cardId) });
        toast({ title: "Unlinked", description: "Telegram account unlinked from this card." });
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to unlink Telegram account.", variant: "destructive" });
      },
    },
  });

  if (!isTelegram) return null;

  const isLinked = telegramData?.linked ?? false;
  const linkedInfo = telegramData?.telegramLink;

  const handleLink = () => {
    if (!telegramUser) {
      toast({ title: "Error", description: "Could not detect your Telegram account.", variant: "destructive" });
      return;
    }
    linkMutation.mutate({
      cardId,
      data: {
        telegramId: String(telegramUser.id),
        telegramUsername: telegramUser.username,
        telegramFirstName: telegramUser.first_name,
      },
    });
  };

  const handleUnlink = () => {
    unlinkMutation.mutate({ cardId });
  };

  return (
    <div className="border-t border-border/50 pt-4 space-y-3">
      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
        <Send className="w-3.5 h-3.5" />
        Telegram Account
      </h4>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="animate-spin w-4 h-4 border-2 border-primary rounded-full border-t-transparent" />
          Loading...
        </div>
      ) : isLinked && linkedInfo ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border/30">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Send className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {linkedInfo.telegramFirstName || "Telegram User"}
              </p>
              {linkedInfo.telegramUsername && (
                <p className="text-xs text-muted-foreground truncate">@{linkedInfo.telegramUsername}</p>
              )}
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold uppercase bg-emerald-500/20 text-emerald-400">
              Linked
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full rounded-xl border-red-500/30 hover:bg-red-500/10 hover:border-red-500/50 text-red-400"
            onClick={handleUnlink}
            disabled={unlinkMutation.isPending}
          >
            <Unlink className="w-3.5 h-3.5 mr-2" />
            {unlinkMutation.isPending ? "Unlinking..." : "Unlink Telegram Account"}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Link your Telegram account to this card for notifications and management.
          </p>
          {telegramUser && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border/30">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Send className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{telegramUser.first_name}</p>
                {telegramUser.username && (
                  <p className="text-xs text-muted-foreground truncate">@{telegramUser.username}</p>
                )}
              </div>
              <span className="text-xs text-muted-foreground">Your account</span>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            className="w-full rounded-xl border-blue-500/30 hover:bg-blue-500/10 hover:border-blue-500/50 text-blue-400"
            onClick={handleLink}
            disabled={linkMutation.isPending || !telegramUser}
          >
            <Link className="w-3.5 h-3.5 mr-2" />
            {linkMutation.isPending ? "Linking..." : "Link Telegram Account"}
          </Button>
        </div>
      )}
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

interface BalanceHistoryEntryDisplay {
  id: number;
  type: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description?: string | null;
  status: string;
  createdAt: string;
}

function BalanceHistoryItem({ entry, currency }: { entry: BalanceHistoryEntryDisplay; currency?: string }) {
  const typeLabels: Record<string, string> = {
    topup: "Top-up",
    fee: "Fee",
    refund: "Refund",
  };

  const isPositive = entry.type === "topup" || entry.type === "refund";

  return (
    <div className="flex items-center justify-between p-3 md:p-4 rounded-xl bg-foreground/5 border border-foreground/5 hover:bg-foreground/10 transition-colors">
      <div className="flex items-center gap-3 md:gap-4 min-w-0">
        <div className={cn(
          "w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center shadow-inner shrink-0",
          isPositive ? "bg-emerald-500/20 text-emerald-400" : "bg-orange-500/20 text-orange-400"
        )}>
          <Wallet className="w-5 h-5 md:w-6 md:h-6" />
        </div>
        <div className="min-w-0">
          <p className="font-medium text-sm md:text-lg truncate">
            {typeLabels[entry.type] || entry.type}
            <span className="text-muted-foreground text-xs md:text-sm font-normal lowercase ml-1 hidden sm:inline">
              {entry.description && `- ${entry.description}`}
            </span>
          </p>
          <p className="text-[10px] md:text-sm text-muted-foreground">
            {format(new Date(entry.createdAt), "MMM d, yyyy • h:mm a")}
            <span className="ml-2 font-mono amount">
              Balance: {formatCurrency(entry.balanceAfter, currency)}
            </span>
          </p>
        </div>
      </div>
      <div className="text-right shrink-0 ml-2">
        <div className={cn("font-bold text-base md:text-xl font-display amount", isPositive ? "text-emerald-400" : "text-orange-400")}>
          {isPositive ? "+" : "-"}{formatCurrency(entry.amount, currency)}
        </div>
        <span className={cn(
          "text-[9px] md:text-xs px-1.5 md:px-2 py-0.5 rounded-full inline-block mt-1 uppercase font-semibold",
          entry.status === "completed" ? "bg-emerald-500/20 text-emerald-300" :
          entry.status === "pending" ? "bg-yellow-500/20 text-yellow-300" : "bg-red-500/20 text-red-300"
        )}>
          {entry.status}
        </span>
      </div>
    </div>
  );
}
