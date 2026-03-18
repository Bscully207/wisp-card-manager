import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateCard, useGetMe, getGetCardsQueryKey, type Card } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CreditCard, Smartphone, Package, ChevronRight, ChevronLeft, 
  Check, Loader2, PartyPopper, Mail, Phone, Tag, User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResponsiveDialog } from "@/components/responsive-dialog";

interface WizardData {
  cardType: "virtual" | "physical" | null;
  currency: string;
  label: string;
  nameOnCard: string;
  email: string;
  phone: string;
  termsAccepted: boolean[];
}

const STEPS = ["Card Type", "Details", "Terms", "Payment", "Success"];

const TERMS = [
  "The card works in most places where Visa is accepted, declines may occasionally occur",
  "Refunds apply to remaining balance only",
  "Issuance and service fees are non-refundable",
  "Misuse or abnormal activity may result in suspension",
];

interface CardCreationWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CardCreationWizard({ open, onOpenChange }: CardCreationWizardProps) {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: user } = useGetMe();
  
  const [step, setStep] = useState(0);
  const [createdCard, setCreatedCard] = useState<Card | null>(null);
  const [data, setData] = useState<WizardData>({
    cardType: null,
    currency: "USD",
    label: "",
    nameOnCard: "",
    email: "",
    phone: "",
    termsAccepted: [false, false, false, false],
  });

  const createMutation = useCreateCard({
    mutation: {
      onSuccess: (card) => {
        queryClient.invalidateQueries({ queryKey: getGetCardsQueryKey() });
        setCreatedCard(card);
        setStep(4);
      },
      onError: (err: Error) => {
        toast({ title: "Failed to create card", description: err.message, variant: "destructive" });
      }
    }
  });

  const resetWizard = () => {
    setStep(0);
    setCreatedCard(null);
    setData({
      cardType: null,
      currency: "USD",
      label: "",
      nameOnCard: "",
      email: user?.email || "",
      phone: "",
      termsAccepted: [false, false, false, false],
    });
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) {
      resetWizard();
    } else {
      setData(prev => ({
        ...prev,
        email: user?.email || "",
        nameOnCard: prev.nameOnCard || (user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : ""),
      }));
    }
    onOpenChange(v);
  };

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const canProceed = () => {
    switch (step) {
      case 0: return data.cardType === "virtual";
      case 1: return data.label.trim().length > 0 && data.nameOnCard.trim().length > 0 && isValidEmail(data.email);
      case 2: return data.termsAccepted.every(Boolean);
      case 3: return !createMutation.isPending;
      default: return true;
    }
  };

  const handleNext = () => {
    if (step === 3) {
      createMutation.mutate({
        data: {
          label: data.label,
          currency: data.currency,
        }
      });
      return;
    }
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 0 && step < 4) setStep(step - 1);
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={handleOpenChange}
      title={step < 4 ? "Create New Card" : step === 4 ? "Card Created" : ""}
      description={step <= 4 ? `Step ${step + 1} of 5` : undefined}
      className="sm:max-w-lg bg-card border-border/50 shadow-2xl"
    >
      <div className="space-y-6">
        {step < 5 && (
          <div className="flex items-center justify-center gap-2">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                  i < step ? "bg-primary text-primary-foreground" :
                  i === step ? "bg-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-2 ring-offset-background" :
                  "bg-muted text-muted-foreground"
                )}>
                  {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
                </div>
                {i < 4 && <div className={cn("w-4 h-0.5", i < step ? "bg-primary" : "bg-muted")} />}
              </div>
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {step === 0 && (
              <StepCardType 
                selected={data.cardType} 
                onSelect={(type) => setData(prev => ({ ...prev, cardType: type }))} 
              />
            )}
            {step === 1 && (
              <StepDetails 
                data={data} 
                onChange={(updates) => setData(prev => ({ ...prev, ...updates }))} 
              />
            )}
            {step === 2 && (
              <StepTerms 
                accepted={data.termsAccepted} 
                onToggle={(i) => setData(prev => {
                  const newTerms = [...prev.termsAccepted];
                  newTerms[i] = !newTerms[i];
                  return { ...prev, termsAccepted: newTerms };
                })} 
              />
            )}
            {step === 3 && (
              <StepPayment 
                data={data} 
                isPending={createMutation.isPending} 
              />
            )}
            {step === 4 && (
              <StepSuccess 
                card={createdCard}
                nameOnCard={data.nameOnCard}
                nickname={data.label}
                onViewCard={() => {
                  handleOpenChange(false);
                  if (createdCard) setLocation(`/cards/${createdCard.id}`);
                }} 
              />
            )}
          </motion.div>
        </AnimatePresence>

        {step < 4 && (
          <div className="flex items-center gap-3 pt-2">
            {step > 0 && (
              <Button variant="outline" onClick={handleBack} className="rounded-xl">
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>
            )}
            <Button 
              className="flex-1 rounded-xl" 
              disabled={!canProceed()}
              onClick={handleNext}
            >
              {step === 3 ? (
                createMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                ) : (
                  "Confirm Payment"
                )
              ) : (
                <>Next <ChevronRight className="w-4 h-4 ml-1" /></>
              )}
            </Button>
          </div>
        )}
      </div>
    </ResponsiveDialog>
  );
}

function StepCardType({ selected, onSelect }: { selected: "virtual" | "physical" | null; onSelect: (type: "virtual" | "physical") => void }) {
  return (
    <div className="space-y-4">
      <h3 className="font-display text-lg font-semibold">Choose Card Type</h3>
      <p className="text-sm text-muted-foreground">Select the type of card you'd like to create.</p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={() => onSelect("virtual")}
          className={cn(
            "relative p-5 rounded-2xl border-2 text-left transition-all",
            selected === "virtual" 
              ? "border-primary bg-primary/5 shadow-lg" 
              : "border-border/50 hover:border-primary/30 hover:bg-foreground/5"
          )}
        >
          {selected === "virtual" && (
            <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
              <Check className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
          )}
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-3">
            <Smartphone className="w-6 h-6 text-primary" />
          </div>
          <h4 className="font-semibold mb-1">Virtual Card</h4>
          <p className="text-xs text-muted-foreground">Instant digital card for online payments. Ready in seconds.</p>
        </button>

        <button
          disabled
          className="relative p-5 rounded-2xl border-2 border-border/30 text-left opacity-50 cursor-not-allowed"
        >
          <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-muted text-[10px] font-semibold text-muted-foreground uppercase">Coming soon</span>
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-3">
            <Package className="w-6 h-6 text-muted-foreground" />
          </div>
          <h4 className="font-semibold mb-1">Physical Card</h4>
          <p className="text-xs text-muted-foreground">Delivered to your address. Use anywhere worldwide.</p>
        </button>
      </div>
    </div>
  );
}

function StepDetails({ data, onChange }: { data: WizardData; onChange: (updates: Partial<WizardData>) => void }) {
  return (
    <div className="space-y-4">
      <h3 className="font-display text-lg font-semibold">Card Details</h3>
      <p className="text-sm text-muted-foreground">Configure your new virtual card.</p>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Currency</label>
          <Select value={data.currency} onValueChange={(v) => onChange({ currency: v })}>
            <SelectTrigger className="bg-muted/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">$ USD</SelectItem>
              <SelectItem value="EUR">€ EUR</SelectItem>
              <SelectItem value="GBP">£ GBP</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" /> Name on the Card
          </label>
          <Input 
            value={data.nameOnCard}
            onChange={(e) => onChange({ nameOnCard: e.target.value })}
            placeholder="e.g. John Doe"
            className="bg-muted/50"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5" /> Card Nickname
          </label>
          <Input 
            value={data.label}
            onChange={(e) => onChange({ label: e.target.value })}
            placeholder="e.g. Travel Card"
            className="bg-muted/50"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5" /> Email
          </label>
          <Input 
            type="email"
            value={data.email}
            onChange={(e) => onChange({ email: e.target.value })}
            placeholder="your@email.com"
            className={cn("bg-muted/50", data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) && "border-destructive")}
          />
          {data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) && (
            <p className="text-xs text-destructive">Please enter a valid email address</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5" /> Phone Number <span className="text-muted-foreground text-xs">(optional)</span>
          </label>
          <Input 
            type="tel"
            value={data.phone}
            onChange={(e) => onChange({ phone: e.target.value })}
            placeholder="+1 555 123 4567"
            className="bg-muted/50"
          />
        </div>
      </div>
    </div>
  );
}

function StepTerms({ accepted, onToggle }: { accepted: boolean[]; onToggle: (i: number) => void }) {
  return (
    <div className="space-y-4">
      <h3 className="font-display text-lg font-semibold">Service Terms</h3>
      <p className="text-sm text-muted-foreground">Please review and accept each condition to proceed.</p>

      <div className="space-y-3">
        {TERMS.map((term, i) => (
          <label 
            key={i}
            className={cn(
              "flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all",
              accepted[i] ? "border-primary/50 bg-primary/5" : "border-border/50 hover:border-border"
            )}
          >
            <Checkbox 
              checked={accepted[i]}
              onCheckedChange={() => onToggle(i)}
              className="mt-0.5 shrink-0"
            />
            <span className="text-sm leading-relaxed">{term}</span>
          </label>
        ))}
      </div>

      <p className="text-xs text-muted-foreground text-center pb-4">
        The full Privacy Policy and Terms of Use can be found on our website.
      </p>
    </div>
  );
}

function getCurrencyInfo(currency: string) {
  switch (currency) {
    case "EUR": return { symbol: "€", issuance: "25.00", total: "25.00" };
    case "GBP": return { symbol: "£", issuance: "25.00", total: "25.00" };
    default: return { symbol: "$", issuance: "25.00", total: "25.00" };
  }
}

function StepPayment({ data, isPending }: { data: WizardData; isPending: boolean }) {
  const c = getCurrencyInfo(data.currency);
  return (
    <div className="space-y-4">
      <h3 className="font-display text-lg font-semibold">Payment Summary</h3>
      <p className="text-sm text-muted-foreground">Review your order before confirming.</p>

      <div className="rounded-2xl border border-border/50 bg-muted/30 p-4 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Card Type</span>
          <span className="font-medium capitalize">{data.cardType}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Name on the Card</span>
          <span className="font-medium">{data.nameOnCard || "—"}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Card Nickname</span>
          <span className="font-medium">{data.label || "—"}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Currency</span>
          <span className="font-medium">{data.currency}</span>
        </div>
        <div className="border-t border-border/50 pt-3 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Card Issuance Fee</span>
            <span className="amount">{c.symbol}{c.issuance}</span>
          </div>
          <div className="flex items-center justify-between text-base font-bold pt-2 border-t border-border/50">
            <span>Total</span>
            <span className="amount">{c.symbol}{c.total}</span>
          </div>
        </div>
      </div>

      {isPending && (
        <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Creating your card...</span>
        </div>
      )}
    </div>
  );
}

function StepSuccess({ card, nameOnCard, nickname, onViewCard }: { card: Card | null; nameOnCard: string; nickname: string; onViewCard: () => void }) {
  return (
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      className="flex flex-col items-center text-center py-4 space-y-5"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
        className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center"
      >
        <PartyPopper className="w-10 h-10 text-emerald-400" />
      </motion.div>

      <div>
        <h3 className="font-display text-2xl font-bold">Your card is ready!</h3>
        <p className="text-muted-foreground text-sm mt-1">
          {card?.label ? `"${card.label}"` : "Your new virtual card"} has been created successfully.
        </p>
      </div>

      {card && (
        <div className="w-full max-w-xs rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-900 p-4 text-white text-left shadow-xl">
          <p className="text-white/70 text-xs uppercase tracking-wider mb-1">{card.label || nickname || "Debit Card"}</p>
          <p className="font-display text-lg font-bold">{card.currency} Account</p>
          <p className="font-mono text-sm mt-3 tracking-widest text-white/80">
            <span className="amount">•••• •••• •••• {card.cardNumber.slice(-4)}</span>
          </p>
          <p className="text-xs text-white/60 mt-2">{nameOnCard || card.cardholderName}</p>
        </div>
      )}

      <Button className="w-full max-w-xs rounded-xl" onClick={onViewCard}>
        <CreditCard className="w-4 h-4 mr-2" /> View My Card
      </Button>
    </motion.div>
  );
}
