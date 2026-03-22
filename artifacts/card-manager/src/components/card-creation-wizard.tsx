import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useCreateCard, useCreateShippingRequest, useGetMe, getGetCardsQueryKey, getGetShippingRequestsQueryKey, type Card, type CardCreationResponse } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useJobPolling } from "@/hooks/use-job-polling";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CreditCard, Smartphone, Package, ChevronRight, ChevronLeft, 
  Check, Loader2, PartyPopper, Mail, Phone, Tag, User, MapPin, KeyRound, AlertCircle, RotateCcw
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
  referralCode: string;
  shippingAddress: {
    recipientName: string;
    address: string;
    city: string;
    country: string;
    zipCode: string;
  };
}

// ============================================================
// REFERRAL CODE CONFIGURATION
// Add your referral codes here. Each code maps to a discount.
// The discount is subtracted from the base issuance fee ($25).
// Examples:
//   "FRIEND10"  → $10 off  → card costs $15
//   "VIP2025"   → $25 off  → card is free
//   "BETA5"     → $5 off   → card costs $20
// ============================================================
const REFERRAL_CODES: Record<string, { discount: number; label: string }> = {
  // "FRIEND10": { discount: 10, label: "$10 off card issuance" },
  // "VIP2025":  { discount: 25, label: "Free card issuance" },
  // "BETA5":    { discount: 5,  label: "$5 off card issuance" },
  // "SAVE15":   { discount: 15, label: "$15 off card issuance" },
  // "LAUNCH20": { discount: 20, label: "$20 off card issuance" },
};

function validateReferralCode(code: string): { valid: boolean; discount: number; label: string } {
  const trimmed = code.trim().toUpperCase();
  if (!trimmed) return { valid: false, discount: 0, label: "" };
  const match = REFERRAL_CODES[trimmed];
  if (match) return { valid: true, discount: match.discount, label: match.label };
  return { valid: false, discount: 0, label: "" };
}

function getSteps(cardType: "virtual" | "physical" | null) {
  if (cardType === "physical") {
    return ["Card Type", "Details", "Shipping", "Terms", "Payment", "Processing", "Success"];
  }
  return ["Card Type", "Details", "Terms", "Payment", "Processing", "Success"];
}

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

const EMPTY_SHIPPING = {
  recipientName: "",
  address: "",
  city: "",
  country: "",
  zipCode: "",
};

export function CardCreationWizard({ open, onOpenChange }: CardCreationWizardProps) {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: user } = useGetMe();
  
  const [step, setStep] = useState(0);
  const [createdCard, setCreatedCard] = useState<Card | null>(null);
  const [shippingSubmitted, setShippingSubmitted] = useState(false);
  const [activeJobId, setActiveJobId] = useState<number | null>(null);
  const [data, setData] = useState<WizardData>({
    cardType: null,
    currency: "USD",
    label: "",
    nameOnCard: "",
    email: "",
    phone: "",
    termsAccepted: [false, false, false, false],
    referralCode: "",
    shippingAddress: { ...EMPTY_SHIPPING },
  });

  const steps = getSteps(data.cardType);
  const totalSteps = steps.length;
  const successStepIndex = steps.indexOf("Success");
  const processingStepIndex = steps.indexOf("Processing");
  const paymentStepIndex = steps.indexOf("Payment");
  const termsStepIndex = steps.indexOf("Terms");
  const shippingStepIndex = steps.indexOf("Shipping");

  const [shippingFailed, setShippingFailed] = useState(false);

  const shippingMutation = useCreateShippingRequest({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetShippingRequestsQueryKey() });
        setShippingSubmitted(true);
      },
      onError: () => {
        setShippingFailed(true);
        toast({ title: "Shipping request failed", description: "Your card was created but shipping could not be submitted. You can request shipping from the card details page.", variant: "destructive" });
      },
    },
  });

  const { status: jobStatus, isFailed: jobFailed, isCompleted: jobCompleted, job: jobData, error: pollingError, retry: retryPolling } = useJobPolling({
    jobId: activeJobId,
    interval: 1500,
  });

  const jobHandledIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!jobData || jobHandledIdRef.current === jobData.id) return;

    if (jobCompleted) {
      jobHandledIdRef.current = jobData.id;
      const cardResult = jobData.result as Card | null;
      if (cardResult) {
        setCreatedCard(cardResult);
        if (data.cardType === "physical" && isShippingValid()) {
          shippingMutation.mutate({
            data: {
              cardId: cardResult.id,
              recipientName: data.shippingAddress.recipientName.trim(),
              address: data.shippingAddress.address.trim(),
              city: data.shippingAddress.city.trim(),
              country: data.shippingAddress.country.trim(),
              zipCode: data.shippingAddress.zipCode.trim(),
            },
          });
        }
      }
      setStep(successStepIndex);
    } else if (jobFailed) {
      jobHandledIdRef.current = jobData.id;
      toast({ title: "Card creation failed", description: jobData.error || "An unexpected error occurred", variant: "destructive" });
    }
  }, [jobCompleted, jobFailed]);

  const createMutation = useCreateCard({
    mutation: {
      onSuccess: (response: Card & Partial<CardCreationResponse>) => {
        const jobId = response?.jobId;
        if (jobId) {
          setActiveJobId(jobId);
          setStep(processingStepIndex);
        } else {
          setCreatedCard(response);
          if (data.cardType === "physical" && isShippingValid()) {
            shippingMutation.mutate({
              data: {
                cardId: response.id,
                recipientName: data.shippingAddress.recipientName.trim(),
                address: data.shippingAddress.address.trim(),
                city: data.shippingAddress.city.trim(),
                country: data.shippingAddress.country.trim(),
                zipCode: data.shippingAddress.zipCode.trim(),
              },
            });
          }
          setStep(successStepIndex);
        }
      },
      onError: (err: Error) => {
        toast({ title: "Failed to create card", description: err.message, variant: "destructive" });
      }
    }
  });

  const resetWizard = () => {
    setStep(0);
    setCreatedCard(null);
    setShippingSubmitted(false);
    setShippingFailed(false);
    setActiveJobId(null);
    jobHandledIdRef.current = null;
    setData({
      cardType: null,
      currency: "USD",
      label: "",
      nameOnCard: "",
      email: user?.email || "",
      phone: "",
      termsAccepted: [false, false, false, false],
      referralCode: "",
      shippingAddress: { ...EMPTY_SHIPPING },
    });
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) {
      if (createdCard) {
        queryClient.invalidateQueries({ queryKey: getGetCardsQueryKey() });
      }
      resetWizard();
    } else {
      setData(prev => ({
        ...prev,
        email: user?.email || "",
        nameOnCard: prev.nameOnCard || (user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : ""),
        shippingAddress: {
          ...prev.shippingAddress,
          recipientName: prev.shippingAddress.recipientName || (user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : ""),
        },
      }));
    }
    onOpenChange(v);
  };

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const isShippingValid = () => {
    const s = data.shippingAddress;
    return s.recipientName.trim() && s.address.trim() && s.city.trim() && s.country.trim() && s.zipCode.trim();
  };

  const canProceed = () => {
    switch (step) {
      case 0: return data.cardType !== null;
      case 1: return data.label.trim().length > 0 && data.nameOnCard.trim().length > 0 && isValidEmail(data.email);
      default: break;
    }
    if (step === shippingStepIndex) return isShippingValid();
    if (step === termsStepIndex) return data.termsAccepted.every(Boolean);
    if (step === paymentStepIndex) return !createMutation.isPending;
    return true;
  };

  const handleNext = () => {
    if (step === paymentStepIndex) {
      createMutation.mutate({
        data: {
          label: data.label,
          currency: data.currency,
          type: data.cardType || "virtual",
        }
      });
      return;
    }
    if (step < paymentStepIndex) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 0 && step < processingStepIndex) setStep(step - 1);
  };

  const currentStepName = steps[step];

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={handleOpenChange}
      title={currentStepName === "Processing" ? "Processing" : step < successStepIndex ? "Create New Card" : step === successStepIndex ? "Card Created" : ""}
      description={step <= successStepIndex ? `Step ${step + 1} of ${totalSteps}` : undefined}
      className="sm:max-w-lg bg-card border-border/50 shadow-2xl"
    >
      <div className="space-y-6">
        {step < totalSteps && (
          <div className="flex items-center justify-center gap-2">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                  i < step ? "bg-primary text-primary-foreground" :
                  i === step ? "bg-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-2 ring-offset-background" :
                  "bg-muted text-muted-foreground"
                )}>
                  {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
                </div>
                {i < totalSteps - 1 && <div className={cn("w-4 h-0.5", i < step ? "bg-primary" : "bg-muted")} />}
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
            {currentStepName === "Card Type" && (
              <StepCardType 
                selected={data.cardType} 
                onSelect={(type) => setData(prev => ({ ...prev, cardType: type }))} 
              />
            )}
            {currentStepName === "Details" && (
              <StepDetails 
                data={data} 
                onChange={(updates) => setData(prev => ({ ...prev, ...updates }))} 
              />
            )}
            {currentStepName === "Shipping" && (
              <StepShipping
                address={data.shippingAddress}
                onChange={(address) => setData(prev => ({ ...prev, shippingAddress: { ...prev.shippingAddress, ...address } }))}
              />
            )}
            {currentStepName === "Terms" && (
              <StepTerms 
                accepted={data.termsAccepted} 
                onToggle={(i) => setData(prev => {
                  const newTerms = [...prev.termsAccepted];
                  newTerms[i] = !newTerms[i];
                  return { ...prev, termsAccepted: newTerms };
                })} 
              />
            )}
            {currentStepName === "Payment" && (
              <StepPayment 
                data={data} 
                isPending={createMutation.isPending}
                onReferralChange={(code) => setData(prev => ({ ...prev, referralCode: code }))}
              />
            )}
            {currentStepName === "Processing" && (
              <StepProcessing
                jobStatus={jobStatus}
                jobFailed={jobFailed}
                jobError={jobData?.error ?? null}
                pollingError={pollingError}
                onRetry={() => {
                  setActiveJobId(null);
                  setStep(paymentStepIndex);
                }}
                onRetryPolling={retryPolling}
              />
            )}
            {currentStepName === "Success" && (
              <StepSuccess 
                card={createdCard}
                nameOnCard={data.nameOnCard}
                nickname={data.label}
                isPhysical={data.cardType === "physical"}
                shippingSubmitted={shippingSubmitted}
                shippingFailed={shippingFailed}
                onViewCard={() => {
                  handleOpenChange(false);
                  if (createdCard) setLocation(`/cards/${createdCard.id}`);
                }} 
              />
            )}
          </motion.div>
        </AnimatePresence>

        {step <= paymentStepIndex && (
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
              {step === paymentStepIndex ? (
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
          onClick={() => onSelect("physical")}
          className={cn(
            "relative p-5 rounded-2xl border-2 text-left transition-all",
            selected === "physical"
              ? "border-primary bg-primary/5 shadow-lg"
              : "border-border/50 hover:border-primary/30 hover:bg-foreground/5"
          )}
        >
          {selected === "physical" && (
            <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
              <Check className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
          )}
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-3">
            <Package className="w-6 h-6 text-primary" />
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
      <p className="text-sm text-muted-foreground">
        Configure your new {data.cardType === "physical" ? "physical" : "virtual"} card.
      </p>

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

function StepShipping({ address, onChange }: { address: WizardData["shippingAddress"]; onChange: (updates: Partial<WizardData["shippingAddress"]>) => void }) {
  return (
    <div className="space-y-4">
      <h3 className="font-display text-lg font-semibold">Shipping Address</h3>
      <p className="text-sm text-muted-foreground">Enter the delivery address for your physical card.</p>

      <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border/30">
        <Package className="w-8 h-8 text-primary shrink-0" />
        <div>
          <p className="text-sm font-medium">Delivery Details</p>
          <p className="text-xs text-muted-foreground">Your card will be shipped via registered mail</p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Recipient Name</label>
          <Input
            value={address.recipientName}
            onChange={(e) => onChange({ recipientName: e.target.value })}
            placeholder="John Doe"
            className="bg-muted/50"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Street Address</label>
          <Input
            value={address.address}
            onChange={(e) => onChange({ address: e.target.value })}
            placeholder="123 Main Street, Apt 4B"
            className="bg-muted/50"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">City</label>
            <Input
              value={address.city}
              onChange={(e) => onChange({ city: e.target.value })}
              placeholder="Berlin"
              className="bg-muted/50"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Zip Code</label>
            <Input
              value={address.zipCode}
              onChange={(e) => onChange({ zipCode: e.target.value })}
              placeholder="10115"
              className="bg-muted/50"
            />
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Country</label>
          <Input
            value={address.country}
            onChange={(e) => onChange({ country: e.target.value })}
            placeholder="Germany"
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

const BASE_ISSUANCE_FEE = 25;

function getCurrencySymbolForWizard(currency: string) {
  switch (currency) {
    case "EUR": return "€";
    case "GBP": return "£";
    default: return "$";
  }
}

function StepPayment({ data, isPending, onReferralChange }: { data: WizardData; isPending: boolean; onReferralChange: (code: string) => void }) {
  const symbol = getCurrencySymbolForWizard(data.currency);
  const referralResult = validateReferralCode(data.referralCode);
  const discount = referralResult.valid ? referralResult.discount : 0;
  const issuanceFee = BASE_ISSUANCE_FEE;
  const total = Math.max(0, issuanceFee - discount);

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

        {data.cardType === "physical" && (
          <div className="border-t border-border/50 pt-3 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <MapPin className="w-3.5 h-3.5" /> Shipping Address
            </div>
            <p className="text-sm pl-5">
              {data.shippingAddress.recipientName}<br />
              {data.shippingAddress.address}<br />
              {data.shippingAddress.city}, {data.shippingAddress.zipCode}<br />
              {data.shippingAddress.country}
            </p>
          </div>
        )}

        <div className="border-t border-border/50 pt-3 space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Referral Code</label>
            <div className="flex items-center gap-2">
              <Input
                value={data.referralCode}
                onChange={(e) => onReferralChange(e.target.value)}
                placeholder="Enter referral code"
                className="bg-background/50 h-9 text-sm uppercase"
              />
            </div>
            {data.referralCode.trim() && (
              referralResult.valid ? (
                <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                  <Check className="w-3 h-3" /> {referralResult.label}
                </p>
              ) : (
                <p className="text-xs text-destructive">Invalid referral code</p>
              )
            )}
          </div>

          <div className="border-t border-border/50 pt-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Card Issuance Fee</span>
              <span className="amount">{symbol}{issuanceFee.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex items-center justify-between text-sm text-emerald-600">
                <span>Referral Discount</span>
                <span className="font-medium">-{symbol}{discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-base font-bold pt-2 border-t border-border/50">
              <span>Total</span>
              <span className="amount">{total === 0 ? "FREE" : `${symbol}${total.toFixed(2)}`}</span>
            </div>
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

function StepProcessing({ jobStatus, jobFailed, jobError, pollingError, onRetry, onRetryPolling }: { jobStatus: string | null; jobFailed: boolean; jobError: string | null; pollingError: string | null; onRetry: () => void; onRetryPolling: () => void }) {
  if (jobFailed) {
    return (
      <div className="flex flex-col items-center text-center py-8 space-y-5">
        <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
        <div>
          <h3 className="font-display text-lg font-semibold">Card Creation Failed</h3>
          <p className="text-muted-foreground text-sm mt-1">
            {jobError || "An unexpected error occurred while creating your card."}
          </p>
        </div>
        <Button variant="outline" onClick={onRetry} className="rounded-xl">
          <RotateCcw className="w-4 h-4 mr-2" /> Try Again
        </Button>
      </div>
    );
  }

  if (pollingError) {
    return (
      <div className="flex flex-col items-center text-center py-8 space-y-5">
        <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-yellow-500" />
        </div>
        <div>
          <h3 className="font-display text-lg font-semibold">Connection Issue</h3>
          <p className="text-muted-foreground text-sm mt-1">
            Unable to check card creation status. Your card may still be processing.
          </p>
        </div>
        <Button variant="outline" onClick={onRetryPolling} className="rounded-xl">
          <RotateCcw className="w-4 h-4 mr-2" /> Check Again
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center text-center py-8 space-y-5">
      <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
      <div>
        <h3 className="font-display text-lg font-semibold">Creating Your Card</h3>
        <p className="text-muted-foreground text-sm mt-1">
          {jobStatus === "processing" ? "Your card is being set up..." : "Please wait while we process your request..."}
        </p>
      </div>
      <div className="w-full max-w-xs">
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: "10%" }}
            animate={{ width: "90%" }}
            transition={{ duration: 8, ease: "easeOut" }}
          />
        </div>
      </div>
    </div>
  );
}

function StepSuccess({ card, nameOnCard, nickname, isPhysical, shippingSubmitted, shippingFailed, onViewCard }: { 
  card: Card | null; 
  nameOnCard: string; 
  nickname: string;
  isPhysical: boolean;
  shippingSubmitted: boolean;
  shippingFailed: boolean;
  onViewCard: () => void;
}) {
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
        <h3 className="font-display text-2xl font-bold">
          {isPhysical ? "Your card is on its way!" : "Your card is ready!"}
        </h3>
        <p className="text-muted-foreground text-sm mt-1">
          {card?.label ? `"${card.label}"` : isPhysical ? "Your new physical card" : "Your new virtual card"} has been created successfully.
        </p>
      </div>

      {isPhysical && (
        <div className="w-full max-w-xs space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
            <KeyRound className="w-5 h-5 text-yellow-400 shrink-0" />
            <p className="text-xs text-left">
              Your card requires activation. You'll receive an activation code with your shipped card.
            </p>
          </div>
          {shippingSubmitted && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
              <Package className="w-5 h-5 text-emerald-400 shrink-0" />
              <p className="text-xs text-left">
                Shipping request submitted. Track delivery on the card details page.
              </p>
            </div>
          )}
          {shippingFailed && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30">
              <Package className="w-5 h-5 text-red-400 shrink-0" />
              <p className="text-xs text-left">
                Shipping request failed. You can request shipping from the card details page.
              </p>
            </div>
          )}
        </div>
      )}

      {card && (
        <div className={cn(
          "w-full max-w-xs rounded-2xl p-4 text-white text-left shadow-xl",
          isPhysical
            ? "bg-gradient-to-br from-amber-600 to-orange-900"
            : "bg-gradient-to-br from-blue-600 to-indigo-900"
        )}>
          <p className="text-white/70 text-xs uppercase tracking-wider mb-1">{card.label || nickname || "Debit Card"}</p>
          <p className="font-display text-lg font-bold">{card.currency} Account</p>
          <p className="font-mono text-sm mt-3 tracking-widest text-white/80">
            <span className="amount">•••• •••• •••• {card.cardNumber.slice(-4)}</span>
          </p>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-white/60">{nameOnCard || card.cardholderName}</p>
            {isPhysical && (
              <span className="text-[10px] uppercase font-semibold bg-white/20 px-2 py-0.5 rounded-full">Physical</span>
            )}
          </div>
        </div>
      )}

      <Button className="w-full max-w-xs rounded-xl" onClick={onViewCard}>
        <CreditCard className="w-4 h-4 mr-2" /> View My Card
      </Button>
    </motion.div>
  );
}
