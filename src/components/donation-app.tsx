"use client";

import { useState } from "react";
import { DaimoPayTransferButton } from "~/components/daimo-pay-transfer-button";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";

const DONATION_AMOUNTS = [5, 10, 25, 50];
const RECIPIENT_ADDRESS = "0x742d35Cc6634C0532925a3b8D0C6b82c18C4b0D"; // placeholder - replace with actual

export function DonationApp() {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [showThanks, setShowThanks] = useState(false);

  const handlePaymentCompleted = () => {
    setShowThanks(true);
    setSelectedAmount(null);
    
    // Hide thank you message after 3 seconds
    setTimeout(() => {
      setShowThanks(false);
    }, 3000);
  };

  if (showThanks) {
    return (
      <div className="w-full max-w-md mx-auto">
        <Card className="p-8 text-center space-y-4">
          <div className="text-3xl">🙏</div>
          <h2 className="text-2xl font-semibold">Thank You!</h2>
          <p className="text-muted-foreground">
            Your donation has been processed successfully. 
            We truly appreciate your support!
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-semibold">Support the Community</h1>
        <p className="text-muted-foreground">
          Choose an amount to donate in USDC
        </p>
      </div>

      <Card className="p-6 space-y-4">
        <div className="text-sm text-muted-foreground">
          <span className="font-medium">Recipient:</span>
          <div className="font-mono text-xs mt-1 bg-muted p-2 rounded">
            {RECIPIENT_ADDRESS}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {DONATION_AMOUNTS.map((amount) => (
            <Button
              key={amount}
              variant={selectedAmount === amount ? "default" : "outline"}
              className="h-16 text-lg font-semibold"
              onClick={() => setSelectedAmount(amount)}
            >
              ${amount} USDC
            </Button>
          ))}
        </div>

        {selectedAmount && (
          <div className="pt-4 border-t">
            <DaimoPayTransferButton
              text={`Donate $${selectedAmount} USDC`}
              toAddress={RECIPIENT_ADDRESS as `0x${string}`}
              amount={selectedAmount.toString()}
              onPaymentCompleted={handlePaymentCompleted}
            />
          </div>
        )}
      </Card>
    </div>
  );
}