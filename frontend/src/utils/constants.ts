export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    PROFILE: "/auth/profile",
  },
  SALES: {
    BASE: "/sales",
    UPLOAD: "/sales/upload",
  },
  FORECASTS: {
    BASE: "/forecasts",
    GENERATE: "/forecasts/generate",
  },
  PRODUCTS: {
    BASE: "/products",
  },
  REPORTS: {
    BASE: "/reports",
    GENERATE: "/reports/generate",
  },
  MARKET_BASKET: {
    BASE: "/marketbasket",
  },
}

export const FORECAST_PERIODS = ["Daily", "Weekly", "Monthly"] as const
export const FORECAST_MODELS = ["ARIMA", "RandomForest"] as const

export const REPORT_METRICS = [
  { id: "totalSales", label: "Total Sales" },
  { id: "averageSale", label: "Average Sale" },
  { id: "totalTransactions", label: "Total Transactions" },
  { id: "topProducts", label: "Top Products" },
  { id: "salesByDay", label: "Sales by Day" },
  { id: "salesByPromotion", label: "Sales by Promotion" },
  { id: "productPerformance", label: "Product Performance" },
] as const

export const USER_ROLES = ["Manager", "Viewer"] as const

export const DEFAULT_PAGINATION_LIMIT = 10
