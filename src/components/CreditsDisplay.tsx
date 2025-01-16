import { CreditCard } from "lucide-react";

interface CreditsDisplayProps {
  credits: number;
}

export function CreditsDisplay({ credits }: CreditsDisplayProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border bg-card p-4 shadow-sm">
      <div className="space-y-1">
        <p className="text-sm font-medium leading-none">Available Credits</p>
        <p className="text-2xl font-bold">{credits}</p>
      </div>
      <CreditCard className="h-8 w-8 text-muted-foreground" />
    </div>
  );
}