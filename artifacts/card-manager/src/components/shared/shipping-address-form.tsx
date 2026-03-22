import { useState } from "react";
import { useCreateShippingRequest, getGetShippingRequestsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Package } from "lucide-react";

interface ShippingAddressFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cardId: number;
}

export function ShippingAddressForm({ open, onOpenChange, cardId }: ShippingAddressFormProps) {
  const [form, setForm] = useState({
    recipientName: "",
    address: "",
    city: "",
    country: "",
    zipCode: "",
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useCreateShippingRequest({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetShippingRequestsQueryKey() });
        toast({ title: "Shipping request created", description: "Your physical card will be shipped to the provided address." });
        setForm({ recipientName: "", address: "", city: "", country: "", zipCode: "" });
        onOpenChange(false);
      },
      onError: () => {
        toast({ title: "Failed", description: "Could not create shipping request. Please try again.", variant: "destructive" });
      },
    },
  });

  const handleChange = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const isValid = form.recipientName.trim() && form.address.trim() && form.city.trim() && form.country.trim() && form.zipCode.trim();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    mutation.mutate({
      data: {
        cardId,
        recipientName: form.recipientName.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        country: form.country.trim(),
        zipCode: form.zipCode.trim(),
      },
    });
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Shipping Address"
      description="Enter the delivery address for your physical card."
      className="sm:max-w-lg bg-card border-border/50 shadow-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 mt-2">
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
            <Input value={form.recipientName} onChange={handleChange("recipientName")} placeholder="John Doe" className="bg-muted/50" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Street Address</label>
            <Input value={form.address} onChange={handleChange("address")} placeholder="123 Main Street, Apt 4B" className="bg-muted/50" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">City</label>
              <Input value={form.city} onChange={handleChange("city")} placeholder="Berlin" className="bg-muted/50" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Zip Code</label>
              <Input value={form.zipCode} onChange={handleChange("zipCode")} placeholder="10115" className="bg-muted/50" />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Country</label>
            <Input value={form.country} onChange={handleChange("country")} placeholder="Germany" className="bg-muted/50" />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button type="submit" disabled={!isValid || mutation.isPending} className="w-full sm:w-auto">
            {mutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Shipping Request"
            )}
          </Button>
        </div>
      </form>
    </ResponsiveDialog>
  );
}
