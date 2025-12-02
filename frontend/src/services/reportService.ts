import api from "./api";
import type { Report, ReportInput, ReportResponse } from "../types/report";

export const reportService = {
  getReports: async (params?: { reportType?: string }): Promise<Report[]> => {
    try {
      const response = await api.get<Report[]>("/reports", { params });
      const reports = response.data;
      const validReports = reports.filter((r) => {
        const isValid = r._id && typeof r._id === "string";
        if (!isValid) {
          console.warn("Invalid report data", {
            id: r._id,
            reportType: r.reportType,
            dateRange: r.dateRange,
          });
        }
        return isValid;
      });
      if (validReports.length !== reports.length) {
        console.warn(
          `Filtered ${reports.length - validReports.length} invalid reports`
        );
      }
      return validReports;
    } catch (error: any) {
      console.error(
        "Error fetching reports:",
        error.message,
        error.response?.data
      );
      throw new Error(error.response?.data?.error || "Failed to fetch reports");
    }
  },

  generateReport: async (data: ReportInput): Promise<ReportResponse> => {
    try {
      const response = await api.post<ReportResponse>(
        "/reports/generate",
        data
      );
      return response.data;
    } catch (error: any) {
      console.error(
        "Error generating report:",
        error.message,
        error.response?.data
      );
      throw new Error(
        error.response?.data?.error || "Failed to generate report"
      );
    }
  },

  downloadReport: async (reportId: string): Promise<Blob> => {
    if (!reportId || typeof reportId !== "string" || reportId.trim() === "") {
      throw new Error("Invalid or missing report ID");
    }

    try {
      const response = await api.downloadFile(`/reports/download/${reportId}`);
      const contentType = response.headers["content-type"];
      if (
        !contentType ||
        !["application/pdf", "text/csv"].includes(contentType)
      ) {
        const text = await response.data.text();
        let errorMessage = "Invalid response format";
        try {
          const json = JSON.parse(text);
          errorMessage = json.error || errorMessage;
        } catch {
          // Not JSON, use default error message
        }
        throw new Error(errorMessage);
      }

      if (!(response.data instanceof Blob)) {
        throw new Error("Response is not a valid Blob");
      }

      return response.data;
    } catch (error: any) {
      console.error(
        "Error downloading report:",
        error.message,
        error.response?.data
      );
      throw new Error(error.message || "Failed to download report");
    }
  },
};
