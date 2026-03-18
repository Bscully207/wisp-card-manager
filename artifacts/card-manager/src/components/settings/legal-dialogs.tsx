import { ResponsiveDialog } from "@/components/responsive-dialog";

interface LegalDialogsProps {
  activeDialog: "terms" | "privacy" | null;
  onClose: () => void;
}

export function LegalDialogs({ activeDialog, onClose }: LegalDialogsProps) {
  return (
    <>
      <ResponsiveDialog
        open={activeDialog === "terms"}
        onOpenChange={(o) => { if (!o) onClose(); }}
        title="Terms & Conditions"
        description="Last updated: January 2026"
      >
        <div className="prose prose-sm dark:prose-invert max-w-none max-h-[60vh] overflow-y-auto space-y-4 text-sm text-muted-foreground">
          <p>By using our services, you agree to these Terms & Conditions. Please read them carefully before accessing or using the Wisp platform.</p>
          <h4 className="text-foreground font-semibold">1. Account Usage</h4>
          <p>You must be at least 18 years old to create an account. You are responsible for maintaining the confidentiality of your login credentials and for all activities under your account.</p>
          <h4 className="text-foreground font-semibold">2. Card Services</h4>
          <p>Virtual and physical debit cards are issued subject to verification and compliance requirements. Card balances are non-interest bearing. Top-up amounts are subject to daily and monthly limits.</p>
          <h4 className="text-foreground font-semibold">3. Fees</h4>
          <p>Card issuance, top-up, and transaction fees are disclosed during each operation. Fee schedules may be updated with prior notice.</p>
          <h4 className="text-foreground font-semibold">4. Limitation of Liability</h4>
          <p>Wisp is not liable for unauthorized transactions resulting from user negligence. We reserve the right to freeze accounts suspected of fraudulent activity.</p>
        </div>
      </ResponsiveDialog>

      <ResponsiveDialog
        open={activeDialog === "privacy"}
        onOpenChange={(o) => { if (!o) onClose(); }}
        title="Privacy Policy"
        description="Last updated: January 2026"
      >
        <div className="prose prose-sm dark:prose-invert max-w-none max-h-[60vh] overflow-y-auto space-y-4 text-sm text-muted-foreground">
          <p>This Privacy Policy describes how Wisp collects, uses, and protects your personal information.</p>
          <h4 className="text-foreground font-semibold">1. Information We Collect</h4>
          <p>We collect personal data you provide during registration (name, email, phone) and transaction data generated through card usage. We may also collect device and usage information for security purposes.</p>
          <h4 className="text-foreground font-semibold">2. How We Use Your Data</h4>
          <p>Your data is used to provide and improve our services, process transactions, verify identity, prevent fraud, and communicate important account updates.</p>
          <h4 className="text-foreground font-semibold">3. Data Sharing</h4>
          <p>We do not sell your personal information. Data may be shared with payment processors and regulatory authorities as required by law.</p>
          <h4 className="text-foreground font-semibold">4. Data Security</h4>
          <p>We employ industry-standard encryption and security measures to protect your data. However, no method of electronic storage is 100% secure.</p>
          <h4 className="text-foreground font-semibold">5. Your Rights</h4>
          <p>You may request access to, correction of, or deletion of your personal data by contacting our support team.</p>
        </div>
      </ResponsiveDialog>
    </>
  );
}
