export interface Report {
  _id: string;
  userId: string;
  reportType: "Sales" | "Forecast" | "Inventory" | "Performance";
  format: "csv" | "pdf";
  filePath: string;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ReportInput {
  reportType: "Sales" | "Forecast" | "Inventory" | "Performance";
  format: "csv" | "pdf";
  startDate: string;
  endDate: string;
}

export interface ReportResponse {
  report: Report;
  downloadLink: string;
  data?: {
    totalSales: number;
    averageSale: number;
    topProducts: Array<{
      productId: string;
      productName: string;
      totalSales: number;
      quantity: number;
    }>;
    salesByDay: Array<{
      date: string;
      sales: number;
    }>;
  };
}
