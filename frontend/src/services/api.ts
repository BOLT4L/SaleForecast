import axios, { AxiosInstance, AxiosResponse } from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://saleforecast-6aak.onrender.com/";

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("token");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }
    );
  }

  // Generic methods
  async get<T>(url: string, params?: any): Promise<AxiosResponse<T>> {
    return this.api.get(url, { params });
  }

  async post<T>(url: string, data?: any): Promise<AxiosResponse<T>> {
    return this.api.post(url, data);
  }

  async put<T>(url: string, data?: any): Promise<AxiosResponse<T>> {
    return this.api.put(url, data);
  }

  async delete<T>(url: string): Promise<AxiosResponse<T>> {
    return this.api.delete(url);
  }

  // File upload method
  async uploadFile(
    url: string,
    file: File,
    fieldName: string = "file",
    onProgress?: (percentage: number) => void
  ): Promise<AxiosResponse<any>> {
    const formData = new FormData();
    formData.append(fieldName, file);
    return this.api.post(url, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentage = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentage);
        }
      },
    });
  }

  // Download file method
  async downloadFile(url: string): Promise<AxiosResponse<Blob>> {
    return this.api.get(url, {
      responseType: "blob",
    });
  }
}

const api = new ApiService();
export default api;
