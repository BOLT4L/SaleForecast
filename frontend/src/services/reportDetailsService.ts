import api from "./api";
import type { ReportResponse } from "../types/report";

export const reportDetailsService = {
  getReportDetails: async (reportId: string): Promise<ReportResponse> => {
    if (!reportId || typeof reportId !== "string" || reportId.trim() === "") {
      throw new Error("Invalid or missing report ID");
    }

    try {
      const response = await api.get<ReportResponse>(
        `/reports/details/${reportId}`
      );
      if (!response.data.report) {
        throw new Error("No report data returned");
      }
      return response.data;
    } catch (error: any) {
      console.error(
        "Error fetching report details:",
        error.message,
        error.response?.data
      );
      if (error.message.includes("Network Error")) {
        throw new Error(
          "Failed to fetch report details due to network issues. Please check your connection or server status."
        );
      }
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Failed to fetch report details";
      throw new Error(errorMessage);
    }
  },
};
