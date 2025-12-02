export interface SessionData {
  // Order creation wizard state
  orderWizard?: {
    side?: "buy" | "sell";
    amount?: number;
    price?: number;
    network?: string; // Comma-separated networks or "فرقی نداره"
    description?: string;
    step?:
      | "side"
      | "amount"
      | "price"
      | "network"
      | "description"
      | "summary"
      | "confirm";
  };
}
