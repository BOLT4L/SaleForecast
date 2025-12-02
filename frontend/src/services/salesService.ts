  import api from "./api";
  import type {
    Sale,
    SaleInput,
    SalesResponse,
    UploadResponse,
    TransformedSalesResponse,
  } from "../types/sale";

  interface BackendSale {
    _id: string;
    userId: string;
    date: string;
    items: {
      productId: { _id: string; name: string };
      quantity: number;
      price: number;
      promotion: boolean;
      _id: string;
    }[];
    totalAmount: number;
    promotion: boolean;
    createdAt: string;
    updatedAt: string;
    __v: number;
  }

  export const salesService = {
    getSales: async (params?: {
      userId?: string;
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
      promotion?: boolean;
      minAmount?: number;
      maxAmount?: number;
      productId?: string;
    }): Promise<TransformedSalesResponse> => {
      try {
        const response = await api.get<any>("/sales", params);


        return {
          sales: response.data.sales.map((item: BackendSale) => ({
            _id: item._id,
            id: item._id,
            userId: item.userId,
            date: item.date,
            totalAmount: item.totalAmount || 0,
            items: Array.isArray(item.items)
              ? item.items.map((saleItem) => ({
                  productId: saleItem.productId?._id || "",
                  productName: saleItem.productId?.name || "Unknown",
                  quantity: saleItem.quantity || 0,
                  price: saleItem.price || 0,
                  promotion: !!saleItem.promotion,
                }))
              : [],
            promotion: item.promotion || false,
            createdAt: item.createdAt || new Date().toISOString(),
            updatedAt: item.updatedAt || new Date().toISOString(),
          })),
          total: response.data.total,
          page: response.data.page,
          totalPages: response.data.totalPages,
        };
      } catch (error: any) {
        console.error(
          "Error fetching sales:",
          error.message,
          error.response?.data
        );
        if (error.response?.status === 401) {
          throw new Error("Unauthorized: Please log in again");
        }
        if (error.response?.status === 403) {
          throw new Error("Forbidden: Insufficient permissions");
        }
        throw new Error(error.response?.data?.error || "Failed to fetch sales");
      }
    },

    createSale: async (data: SaleInput): Promise<any> => {
      try {
        const response = await api.post<BackendSale>("/sales", data);
        const item = response.data;
        return {
          id: item._id,
          userId: item.userId,
          date: item.date,
          totalAmount: item.totalAmount,
          items: item.items.map((saleItem) => ({
            productId: saleItem.productId._id,
            productName: saleItem.productId.name,
            quantity: saleItem.quantity,
            price: saleItem.price,
            promotion: saleItem.promotion,
          })),
          promotion: item.promotion,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        };
      } catch (error: any) {
        throw new Error(error.response?.data?.error || "Failed to create sale");
      }
    },

    updateSale: async (id: string, data: Partial<SaleInput>): Promise<any> => {
      try {
        const response = await api.put<BackendSale>(`/sales/${id}`, data);
        const item = response.data;
        return {
          id: item._id,
          userId: item.userId,
          date: item.date,
          totalAmount: item.totalAmount,
          items: item.items.map((saleItem) => ({
            productId: saleItem.productId._id,
            productName: saleItem.productId.name,
            quantity: saleItem.quantity,
            price: saleItem.price,
            promotion: saleItem.promotion,
          })),
          promotion: item.promotion,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        };
      } catch (error: any) {
        throw new Error(error.response?.data?.error || "Failed to update sale");
      }
    },

    deleteSale: async (id: string): Promise<void> => {
      try {
        await api.delete(`/sales/${id}`);
      } catch (error: any) {
        throw new Error(error.response?.data?.error || "Failed to delete sale");
      }
    },

    uploadSales: async (
      file: File,
      onProgress?: (percentage: number) => void
    ): Promise<UploadResponse> => {
      try {
        const response = await api.uploadFile(
          "/sales/upload",
          file,
          "file",
          onProgress
        );
        return response.data;
      } catch (error: any) {
        throw new Error(error.response?.data?.error || "Failed to upload sales");
      }
    },
  };
