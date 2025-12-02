export interface SessionData {
  // Order creation wizard state
  orderWizard?: {
    side?: "buy" | "sell";
    amount?: number;
    price?: number;
    network?: string;
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
