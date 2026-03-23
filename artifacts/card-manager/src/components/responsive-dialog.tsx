import * as React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideClose={isMobile}
        className={cn(
          isMobile
            ? "fixed inset-0 w-full h-[100dvh] max-w-full translate-x-0 translate-y-0 left-0 top-0 rounded-none flex flex-col p-0 border-0 gap-0 data-[state=open]:slide-in-from-bottom-0 data-[state=closed]:slide-out-to-bottom-0 data-[state=open]:zoom-in-100 data-[state=closed]:zoom-out-100"
            : className || "sm:max-w-md bg-card border-border/50 shadow-2xl"
        )}
      >
        {isMobile ? (
          <>
            <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0 safe-area-top">
              <div className="min-w-0 flex-1">
                <DialogTitle className="font-display text-2xl font-semibold">{title}</DialogTitle>
                {description && <DialogDescription className="text-sm text-muted-foreground mt-1">{description}</DialogDescription>}
              </div>
              <DialogClose className="shrink-0 ml-3 w-10 h-10 rounded-full flex items-center justify-center bg-muted/80 hover:bg-muted transition-colors">
                <X className="w-5 h-5" />
                <span className="sr-only">Close</span>
              </DialogClose>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-8 safe-area-bottom">{children}</div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">{title}</DialogTitle>
              {description && <DialogDescription>{description}</DialogDescription>}
            </DialogHeader>
            {children}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
