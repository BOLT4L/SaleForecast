import toast from "react-hot-toast"

export interface ApiError {
  message: string
  status?: number
  code?: string
  details?: any
}

export class AppError extends Error {
  public status?: number
  public code?: string
  public details?: any

  constructor(message: string, status?: number, code?: string, details?: any) {
    super(message)
    this.name = "AppError"
    this.status = status
    this.code = code
    this.details = details
  }
}

export function handleApiError(error: any): ApiError {
  if (error.response) {
    // The request was made and the server responded with a status code
    const { status, data } = error.response

    return {
      message: data?.message || getStatusMessage(status),
      status,
      code: data?.code,
      details: data?.details,
    }
  } else if (error.request) {
    // The request was made but no response was received
    return {
      message: "Network error. Please check your connection and try again.",
      status: 0,
      code: "NETWORK_ERROR",
    }
  } else {
    // Something happened in setting up the request
    return {
      message: error.message || "An unexpected error occurred",
      code: "UNKNOWN_ERROR",
    }
  }
}

export function getStatusMessage(status: number): string {
  switch (status) {
    case 400:
      return "Bad request. Please check your input and try again."
    case 401:
      return "You are not authorized. Please log in and try again."
    case 403:
      return "You don't have permission to perform this action."
    case 404:
      return "The requested resource was not found."
    case 409:
      return "A conflict occurred. The resource may already exist."
    case 422:
      return "The provided data is invalid. Please check your input."
    case 429:
      return "Too many requests. Please wait a moment and try again."
    case 500:
      return "Internal server error. Please try again later."
    case 502:
      return "Bad gateway. The server is temporarily unavailable."
    case 503:
      return "Service unavailable. Please try again later."
    default:
      return "An unexpected error occurred. Please try again."
  }
}

export function showErrorToast(error: any) {
  const apiError = handleApiError(error)
  toast.error(apiError.message)
}

export function showSuccessToast(message: string) {
  toast.success(message)
}

export function logError(error: any, context?: string) {
  const apiError = handleApiError(error)

  console.error("Error occurred:", {
    context,
    message: apiError.message,
    status: apiError.status,
    code: apiError.code,
    details: apiError.details,
    stack: error.stack,
  })

  // In production, you might want to send this to an error tracking service
  if (import.meta.env.PROD) {
    // Send to error tracking service (e.g., Sentry, LogRocket, etc.)
  }
}
