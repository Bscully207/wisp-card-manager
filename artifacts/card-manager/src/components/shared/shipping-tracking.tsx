import { useGetShippingRequests } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Package, Truck, CheckCircle2, Clock, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const STATUS_CONFIG = {
  in_review: { label: "In Review", icon: Clock, color: "text-yellow-400", bg: "bg-yellow-500/20" },
  dispatched: { label: "Dispatched", icon: Package, color: "text-blue-400", bg: "bg-blue-500/20" },
  shipped: { label: "Shipped", icon: Truck, color: "text-purple-400", bg: "bg-purple-500/20" },
  delivered: { label: "Delivered", icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/20" },
  cancelled: { label: "Cancelled", icon: XCircle, color: "text-red-400", bg: "bg-red-500/20" },
} as const;

interface ShippingTrackingProps {
  cardId?: number;
}

export function ShippingTracking({ cardId }: ShippingTrackingProps) {
  const { data, isLoading } = useGetShippingRequests();

  if (isLoading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardContent className="p-4 md:p-6">
          <div className="animate-spin w-6 h-6 border-2 border-primary rounded-full border-t-transparent mx-auto" />
        </CardContent>
      </Card>
    );
  }

  const items = data?.items?.filter((s) => !cardId || s.cardId === cardId) ?? [];

  if (items.length === 0) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardContent className="p-4 md:p-6">
          <h3 className="font-display text-base md:text-lg font-semibold mb-4 flex items-center gap-2">
            <Truck className="w-4 h-4 text-muted-foreground" /> Shipping
          </h3>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Package className="w-12 h-12 text-muted-foreground mb-4 opacity-30" />
            <h3 className="text-lg font-medium">No shipping requests</h3>
            <p className="text-muted-foreground text-sm">Shipping requests for physical cards will appear here.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardContent className="p-4 md:p-6">
        <h3 className="font-display text-base md:text-lg font-semibold mb-4 flex items-center gap-2">
          <Truck className="w-4 h-4 text-muted-foreground" /> Shipping
        </h3>
        <div className="space-y-3">
          {items.map((shipment) => {
            const statusKey = shipment.status as keyof typeof STATUS_CONFIG;
            const config = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.in_review;
            const StatusIcon = config.icon;

            return (
              <div key={shipment.id} className="rounded-xl border border-border/30 bg-muted/30 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn("p-1.5 rounded-lg", config.bg)}>
                      <StatusIcon className={cn("w-4 h-4", config.color)} />
                    </div>
                    <span className={cn("text-sm font-semibold uppercase", config.color)}>{config.label}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(shipment.createdAt), "MMM d, yyyy")}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground text-xs">Recipient</span>
                    <p className="font-medium">{shipment.recipientName}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Address</span>
                    <p className="font-medium">{shipment.address}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">City</span>
                    <p className="font-medium">{shipment.city}, {shipment.zipCode}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Country</span>
                    <p className="font-medium">{shipment.country}</p>
                  </div>
                </div>

                {shipment.trackingNumber && (
                  <div className="pt-2 border-t border-border/30">
                    <span className="text-muted-foreground text-xs">Tracking Number</span>
                    <p className="font-mono text-sm font-medium">{shipment.trackingNumber}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
