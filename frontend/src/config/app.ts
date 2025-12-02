export const APP_CONFIG = {
  name: "SalesPredictor",
  description: "Sales Forecasting and Inventory Management System",
  version: "1.0.0",
  author: "Your Company",

  api: {
    baseUrl: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
    timeout: 30000,
  },

  auth: {
    tokenKey: "token",
    userKey: "user",
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
  },

  pagination: {
    defaultPageSize: 10,
    pageSizeOptions: [5, 10, 20, 50],
  },

  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: [".csv", ".xlsx", ".xls"],
  },

  charts: {
    colors: {
      primary: "#3b82f6",
      secondary: "#10b981",
      accent: "#f59e0b",
      danger: "#ef4444",
      warning: "#f97316",
    },
  },

  features: {
    enableDarkMode: true,
    enableNotifications: true,
    enableExport: true,
    enableRealTimeUpdates: false,
  },

  dateFormats: {
    display: "MMM dd, yyyy",
    input: "yyyy-MM-dd",
    full: "MMMM dd, yyyy 'at' h:mm a",
  },
}

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  DASHBOARD: "/",
  SALES: "/sales",
  FORECASTS: "/forecasts",
  PRODUCTS: "/products",
  REPORTS: "/reports",
  MARKET_BASKET: "/marketbasket",
  SETTINGS: "/settings",
} as const
