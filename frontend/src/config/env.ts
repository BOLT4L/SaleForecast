interface EnvConfig {
  API_URL: string
  NODE_ENV: string
  DEV: boolean
  PROD: boolean
}

function getEnvVar(key: string, defaultValue?: string): string {
  const value = import.meta.env[key] || defaultValue
  if (!value) {
    throw new Error(`Environment variable ${key} is required`)
  }
  return value
}

export const env: EnvConfig = {
  API_URL: getEnvVar("VITE_API_URL", "https://saleforecast-6aak.onrender.com/"),
  NODE_ENV: getEnvVar("NODE_ENV", "development"),
  DEV: import.meta.env.DEV,
  PROD: import.meta.env.PROD,
}

export const isDevelopment = env.NODE_ENV === "development"
export const isProduction = env.NODE_ENV === "production"
