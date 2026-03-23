import * as React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X } from "lucide-react";

interface ResponsiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function ResponsiveDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: ResponsiveDialogProps) {
  const isMobile = useIsMobile();
  const lockedRef = React.useRef(isMobile);
  const wasOpenRef = React.useRef(open);

  if (open && !wasOpenRef.current) {
    lockedRef.current = isMobile;
  }
  if (!open) {
    lockedRef.current = isMobile;
  }
  wasOpenRef.current = open;

  const useMobile = open ? lockedRef.current : isMobile;

  if (useMobile) {
    return (
      <>
        {open && (
          <div className="fixed inset-0 z-50 flex flex-col bg-background">
            <div className="flex items-center justify-between px-4 pt-4 pb-2 safe-area-top">
              <div>
                <h2 className="font-display text-2xl font-semibold">{title}</h2>
                {description && <p className="text-sm text-muted-foreground">{description}</p>}
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-muted/80 hover:bg-muted transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-8 safe-area-bottom">{children}</div>
          </div>
        )}
      </>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={className || "sm:max-w-md bg-card border-border/50 shadow-2xl"}>
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
