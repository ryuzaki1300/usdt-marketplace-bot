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
  // Offer creation wizard state
  offerWizard?: {
    order_id?: number;
    order_price?: number; // Store order price to use as default
    price?: number;
    comment?: string;
    step?: "price" | "comment" | "summary";
  };
}
