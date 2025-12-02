export interface ForecastProductSummary {
  id: string;
  name: string;
  category?: string;
}

export interface ForecastInsights {
  price: {
    average: number;
    min: number;
    max: number;
    volatility: number;
    trend: "Rising" | "Falling" | "Stable" | "Insufficient data";
  };
  demand: {
    totalUnits: number;
    totalRevenue: number;
    avgQuantityPerOrder: number;
    avgPurchaseIntervalDays: number;
    purchaseFrequencyPerMonth: number;
    repeatPurchaseRate: number;
    purchaseCount: number;
    lastPurchaseDate?: string | null;
    behaviourLabel: string;
  };
}

export interface Forecast {
  id: string;
  userId: string;
  dataScope?: "user" | "global";
  product?: ForecastProductSummary;
  period: "Daily" | "Weekly" | "Monthly";
  model: "ARIMA" | "RandomForest";
  startDate: string;
  endDate: string;
  predictions: {
    date: string;
    predictedValue: number;
    confidence: number;
    confidenceUpper: number;
    confidenceLower: number;
  }[];
  features: {
    seasonality: string;
    promotion: boolean;
    laggedSales: number;
    economicTrend: string;
  };
  metrics: {
    rmse: number;
    mae: number;
    mape: number;
  };
  alert: {
    isActive: boolean;
    message: string;
  };
  insights?: ForecastInsights;
  createdAt: string;
  updatedAt: string;
}

export interface ForecastRequest {
  productId: string;
  forecastPeriod: "Daily" | "Weekly" | "Monthly";
  modelType: "ARIMA" | "RandomForest";
  startDate: string;
  endDate: string;
  useGlobalSales?: boolean;
}

export interface ForecastsResponse {
  forecasts: Forecast[];
  total: number;
  page: number;
  totalPages: number;
}

export interface PricePredictionRequest {
  productId: string;
  initialCost: number;
  profitMargin: number;
}

export interface PricePredictionResponse {
  product: ForecastProductSummary;
  recommendedPrice: number;
  priceBand: { min: number; max: number };
  expectedMarginPerUnit: number;
  inputs: {
    initialCost: number;
    profitMargin: number;
    demandRatio: number;
  };
  reference: {
    avgForecastDemand: number;
    historicalAvgUnits: number;
    priceInsights?: ForecastInsights["price"];
    demandInsights?: ForecastInsights["demand"];
  };
}
