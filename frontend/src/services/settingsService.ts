import api from "./api";
import type { Forecast } from "../types/forecast";

interface InventorySettingsRequest {
  lowStockThreshold?: number;
  reorderQuantity?: number;
  category?: string;
}

interface ForecastSettingsRequest {
  features: {
    seasonality?: string;
    promotion?: boolean;
    laggedSales?: number;
    economicTrend?: string;
  };
}

interface RetrainForecastRequest {
  forecastPeriod?: "Daily" | "Weekly" | "Monthly";
  modelType?: "ARIMA" | "RandomForest";
  startDate: string;
  endDate: string;
}

interface InventorySettingsResponse {
  message: string;
  modifiedCount: number;
}

interface ForecastSettingsResponse {
  message: string;
}

export const settingsService = {
  updateInventorySettings: async (
    data: InventorySettingsRequest
  ): Promise<InventorySettingsResponse> => {
    try {
      const response = await api.put<InventorySettingsResponse>(
        "/products/updateSettings",
        data
      );
      return response.data;
    } catch (error: any) {
      console.error("Error updating inventory settings:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        requestData: data,
      });
      if (error.response?.status === 400) {
        throw new Error(
          error.response.data.error || "Invalid inventory settings"
        );
      }
      if (error.response?.status === 404) {
        throw new Error("No products found for update");
      }
      throw new Error(
        error.response?.data?.error || "Failed to update inventory settings"
      );
    }
  },

  updateForecastSettings: async (
    data: ForecastSettingsRequest
  ): Promise<ForecastSettingsResponse> => {
    try {
      const response = await api.put<ForecastSettingsResponse>(
        "/forecasts/updateSettings",
        data
      );
      return response.data;
    } catch (error: any) {
      console.error("Error updating forecast settings:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        requestData: data,
      });
      if (error.response?.status === 400) {
        throw new Error(
          error.response.data.error || "Invalid forecast settings"
        );
      }
      if (error.response?.status === 404) {
        throw new Error("No forecasts found");
      }
      throw new Error(
        error.response?.data?.error || "Failed to update forecast settings"
      );
    }
  },

  retrainForecast: async (data: RetrainForecastRequest): Promise<Forecast> => {
    try {
      const response = await api.post<Forecast>("/forecasts/retrain", data);
      const item = response.data;
      if (!item.predictions || !Array.isArray(item.predictions)) {
        console.error(
          `Retrained forecast has invalid predictions: id=${item.id}`
        );
        throw new Error("Invalid forecast data: predictions missing");
      }
      return item;
    } catch (error: any) {
      console.error("Error retraining forecast:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        requestData: data,
      });
      if (error.response?.status === 400) {
        throw new Error(
          error.response.data.error || "Invalid retrain parameters"
        );
      }
      throw new Error(
        error.response?.data?.error || "Failed to retrain forecast"
      );
    }
  },
};
