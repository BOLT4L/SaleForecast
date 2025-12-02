import api from "./api";
import type {
  Forecast,
  ForecastInsights,
  ForecastRequest,
  ForecastsResponse,
  PricePredictionRequest,
  PricePredictionResponse,
} from "../types/forecast";

interface BackendForecast {
  _id: string;
  userId: string;
  dataScope?: "user" | "global";
  product?: {
    productId: string;
    name: string;
    category?: string;
  };
  predictions?: {
    // Make predictions optional
    date: string;
    predictedSales: number;
    confidenceLevel: number;
    confidenceUpper: number;
    confidenceLower: number;
  }[];
  forecastPeriod: "Daily" | "Weekly" | "Monthly";
  modelType: "ARIMA" | "RandomForest";
  startDate: string;
  endDate: string;
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
  __v: number;
}

export const forecastService = {
  getForecasts: async (params?: {
    forecastPeriod?: string;
    productId?: string;
    page?: number;
    limit?: number;
  }): Promise<ForecastsResponse> => {
    try {
      const response = await api.get<any>("/forecasts", params);

      const validForecasts = response.data.forecasts
        .filter((item: BackendForecast) => {
          if (!item.predictions || !Array.isArray(item.predictions)) {
            console.warn(
              `Invalid forecast: _id=${item._id}, predictions is ${item.predictions}`
            );
            return false;
          }
          return true;
        })
        .map((item: BackendForecast) => ({
          id: item._id,
          userId: item.userId,
          dataScope: item.dataScope || "user",
          product: item.product
            ? {
                id: item.product.productId,
                name: item.product.name,
                category: item.product.category,
              }
            : undefined,
          period: item.forecastPeriod,
          model: item.modelType,
          startDate: item.startDate,
          endDate: item.endDate,
          predictions: item.predictions!.map((pred) => ({
            date: pred.date,
            predictedValue: pred.predictedSales,
            confidence: pred.confidenceLevel,
            confidenceUpper: pred.confidenceUpper,
            confidenceLower: pred.confidenceLower,
          })),
          features: item.features,
          metrics: item.metrics,
          alert: item.alert,
          insights: item.insights,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        }));

      if (validForecasts.length === 0 && response.data.forecasts.length > 0) {
        console.warn("All forecasts were invalid; returning empty list");
      }

      return {
        forecasts: validForecasts,
        total: response.data.total,
        page: response.data.page,
        totalPages: response.data.totalPages,
      };
    } catch (error: any) {
      console.error("Error fetching forecasts:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        requestParams: params,
      });
      if (error.response?.status === 401) {
        throw new Error("Unauthorized: Please log in again");
      }
      if (error.response?.status === 403) {
        throw new Error("Forbidden: Insufficient permissions");
      }
      throw new Error(
        error.response?.data?.error || "Failed to fetch forecasts"
      );
    }
  },

  generateForecast: async (data: ForecastRequest): Promise<Forecast> => {
    try {
      const response = await api.post<BackendForecast>(
        "/forecasts/generate",
        data
      );
      const item = response.data;
      if (!item.predictions || !Array.isArray(item.predictions)) {
        console.error(
          `Generated forecast has invalid predictions: _id=${item._id}`
        );
        throw new Error("Invalid forecast data: predictions missing");
      }
      return {
        id: item._id,
        userId: item.userId,
        dataScope: item.dataScope || "user",
        product: item.product
          ? {
              id: item.product.productId,
              name: item.product.name,
              category: item.product.category,
            }
          : undefined,
        period: item.forecastPeriod,
        model: item.modelType,
        startDate: item.startDate,
        endDate: item.endDate,
        predictions: item.predictions.map((pred) => ({
          date: pred.date,
          predictedValue: pred.predictedSales,
          confidence: pred.confidenceLevel,
          confidenceUpper: pred.confidenceUpper,
          confidenceLower: pred.confidenceLower,
        })),
        features: item.features,
        metrics: item.metrics,
        alert: item.alert,
        insights: item.insights,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      };
    } catch (error: any) {
      console.error(
        "Error generating forecast:",
        error.message,
        error.response?.data
      );
      throw new Error(
        error.response?.data?.error || "Failed to generate forecast"
      );
    }
  },

  generateBatchForecasts: async (data: {
    forecastPeriod: "Daily" | "Weekly" | "Monthly";
    modelType: "ARIMA" | "RandomForest";
    startDate: string;
    endDate: string;
    scope?: "all" | "category";
    category?: string;
  }) => {
    try {
      const response = await api.post<{
        scope: string;
        category?: string;
        totalProducts: number;
        successfulForecasts: number;
        failures: {
          productId: string;
          name: string;
          category: string;
          error: string;
        }[];
      }>("/forecasts/generate/batch", data);
      return response.data;
    } catch (error: any) {
      console.error(
        "Error generating batch forecasts:",
        error.message,
        error.response?.data
      );
      throw new Error(
        error.response?.data?.error || "Failed to generate batch forecasts"
      );
    }
  },

  predictPrice: async (
    data: PricePredictionRequest
  ): Promise<PricePredictionResponse> => {
    try {
      const response = await api.post<PricePredictionResponse>(
        "/forecasts/predict-price",
        data
      );
      return response.data;
    } catch (error: any) {
      console.error("Error predicting price:", error.message, error.response);
      throw new Error(
        error.response?.data?.error || "Failed to predict selling price"
      );
    }
  },
};
