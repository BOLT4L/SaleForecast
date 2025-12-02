export interface MarketBasket {
  id: string;
  userId: string;
  analysisDate: string;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  minSupport: number;
  minConfidence: number;
  itemsets: {
    id: string;
    items: { id: string; name: string }[];
    support: number;
  }[];
  rules: {
    id: string;
    antecedents: { id: string; name: string }[];
    consequents: { id: string; name: string }[];
    confidence: number;
    lift: number;
    support: number;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface MarketBasketRequest {
  startDate: string;
  endDate: string;
  minSupport?: number;
  minConfidence?: number;
}
