import { format, parseISO } from "date-fns"

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export const formatDate = (dateString: string, formatString = "MMM dd, yyyy"): string => {
  try {
    return format(parseISO(dateString), formatString)
  } catch (error) {
    console.error("Error formatting date:", error)
    return dateString
  }
}

export const formatPercent = (value: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value)
}

export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat("en-US").format(value)
}

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + "..."
}
