import api from "./api";
import type { MarketBasket, MarketBasketRequest } from "../types/marketBasket";

interface BackendMarketBasket {
  _id: string;
  userId: string;
  analysisDate: string;
  dateRange: { startDate: string; endDate: string };
  minSupport: number;
  minConfidence: number;
  itemsets: {
    _id: string;
    items: { _id: string; name: string }[];
    support: number;
  }[];
  rules: {
    _id: string;
    antecedents: { _id: string; name: string }[];
    consequents: { _id: string; name: string }[];
    confidence: number;
    lift: number;
    support: number;
  }[];
  createdAt: string;
  updatedAt: string;
}

export const marketBasketService = {
  getMarketBaskets: async (): Promise<MarketBasket[]> => {
    const response = await api.get<BackendMarketBasket[]>("/marketbasket");
    return response.data.map((item) => ({
      id: item._id,
      userId: item.userId,
      analysisDate: item.analysisDate,
      dateRange: item.dateRange
        ? {
            startDate: item.dateRange.startDate,
            endDate: item.dateRange.endDate,
          }
        : undefined,
      minSupport: item.minSupport,
      minConfidence: item.minConfidence,
      itemsets: item.itemsets.map((itemset) => ({
        id: itemset._id,
        items: itemset.items.map((i) => ({ id: i._id, name: i.name })),
        support: itemset.support,
      })),
      rules: item.rules.map((rule) => ({
        id: rule._id,
        antecedents: rule.antecedents.map((a) => ({ id: a._id, name: a.name })),
        consequents: rule.consequents.map((c) => ({ id: c._id, name: c.name })),
        confidence: rule.confidence,
        lift: rule.lift,
        support: rule.support,
      })),
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));
  },

  createMarketBasket: async (
    data: MarketBasketRequest
  ): Promise<MarketBasket> => {
    const response = await api.post<BackendMarketBasket>("/marketbasket", data);
    const item = response.data;
    return {
      id: item._id,
      userId: item.userId,
      analysisDate: item.analysisDate,
      dateRange: item.dateRange
        ? {
            startDate: item.dateRange.startDate,
            endDate: item.dateRange.endDate,
          }
        : undefined,
      minSupport: item.minSupport,
      minConfidence: item.minConfidence,
      itemsets: item.itemsets.map((itemset) => ({
        id: itemset._id,
        items: itemset.items.map((i) => ({ id: i._id, name: i.name })),
        support: itemset.support,
      })),
      rules: item.rules.map((rule) => ({
        id: rule._id,
        antecedents: rule.antecedents.map((a) => ({ id: a._id, name: a.name })),
        consequents: rule.consequents.map((c) => ({ id: c._id, name: c.name })),
        confidence: rule.confidence,
        lift: rule.lift,
        support: rule.support,
      })),
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  },
};
