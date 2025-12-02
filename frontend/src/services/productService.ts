import api from "./api";
import type {
  Product,
  ProductInput,
  StockUpdateRequest,
  BulkImportResponse,
} from "../types/product";

interface LowStockResponse {
  products: Product[];
}

interface UpdateSettingsRequest {
  lowStockThreshold?: number;
  reorderQuantity?: number;
  category?: string;
}

export const productService = {
  getProducts: async (params?: {
    search?: string;
    category?: string;
  }): Promise<Product[]> => {
    try {
      const response = await api.get<Product[]>("/products", { params });
      const products = response.data;
      const invalidProducts = products.filter(
        (p) => !p._id || typeof p._id !== "string"
      );
      if (invalidProducts.length) {
        console.warn(
          `Found ${invalidProducts.length} products with invalid IDs`,
          {
            products: invalidProducts.map((p) => ({ name: p.name, id: p._id })),
          }
        );
      }
      return products;
    } catch (error: any) {
      console.error(
        "Error fetching products:",
        error.message,
        error.response?.data
      );
      throw new Error(
        error.response?.data?.error || "Failed to fetch products"
      );
    }
  },

  getLowStockProducts: async (): Promise<Product[]> => {
    try {
      const response = await api.get<LowStockResponse>("/products/lowStock");
      const products = response.data.products;
      const invalidProducts = products.filter(
        (p) => !p._id || typeof p._id !== "string"
      );
      if (invalidProducts.length) {
        console.warn(
          `Found ${invalidProducts.length} low stock products with invalid IDs`,
          {
            products: invalidProducts.map((p) => ({ name: p.name, id: p._id })),
          }
        );
      }
      return products;
    } catch (error: any) {
      console.error(
        "Error fetching low stock products:",
        error.message,
        error.response?.data
      );
      throw new Error(
        error.response?.data?.error || "Failed to fetch low stock products"
      );
    }
  },

  createProduct: async (data: ProductInput): Promise<Product> => {
    try {
      const response = await api.post<Product>("/products", data);
      return response.data;
    } catch (error: any) {
      console.error(
        "Error creating product:",
        error.message,
        error.response?.data
      );
      throw new Error(
        error.response?.data?.error || "Failed to create product"
      );
    }
  },

  updateProduct: async (
    id: string,
    data: Partial<ProductInput>
  ): Promise<Product> => {
    try {
      const response = await api.put<Product>(`/products/${id}`, data);
      return response.data;
    } catch (error: any) {
      console.error(
        "Error updating product:",
        error.message,
        error.response?.data
      );
      throw new Error(
        error.response?.data?.error || "Failed to update product"
      );
    }
  },

  deleteProduct: async (id: string): Promise<void> => {
    try {
      await api.delete(`/products/${id}`);
    } catch (error: any) {
      console.error(
        "Error deleting product:",
        error.message,
        error.response?.data
      );
      throw new Error(
        error.response?.data?.error || "Failed to delete product"
      );
    }
  },

  updateStock: async ({
    productId,
    newStock,
  }: StockUpdateRequest): Promise<Product> => {
    try {
      const response = await api.put<Product>(`/products/${productId}`, {
        stockQuantity: newStock,
      });
      return response.data;
    } catch (error: any) {
      console.error(
        "Error updating stock:",
        error.message,
        error.response?.data
      );
      throw new Error(error.response?.data?.error || "Failed to update stock");
    }
  },

  updateInventorySettings: async (
    data: UpdateSettingsRequest
  ): Promise<{ message: string; modifiedCount: number }> => {
    try {
      const response = await api.put<{
        message: string;
        modifiedCount: number;
      }>("/products/updateSettings", data);
      return response.data;
    } catch (error: any) {
      console.error(
        "Error updating inventory settings:",
        error.message,
        error.response?.data
      );
      throw new Error(
        error.response?.data?.error || "Failed to update inventory settings"
      );
    }
  },

  bulkImportProducts: async (file: File): Promise<BulkImportResponse> => {
    try {
      if (!file) {
        console.error("No file provided to bulkImportProducts");
        throw new Error("No file provided");
      }
      console.log("Uploading file:", {
        name: file.name,
        type: file.type,
        size: file.size,
      });
      const response = await api.uploadFile(
        "/products/bulk-import",
        file,
        "file"
      );
      console.log("Upload response:", response.data);
      return response.data;
    } catch (error: any) {
      console.error(
        "Error importing products:",
        error.message,
        error.response?.data
      );
      throw error;
    }
  },
  exportProducts: async (): Promise<void> => {
    try {
      const response = await api.get("/products/export", {
        responseType: "blob",
      });
      const blob = new Blob([response.data as string], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `products_export_${Date.now()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error(
        "Error exporting products:",
        error.message,
        error.response?.data
      );
      throw new Error(
        error.response?.data?.error || "Failed to export products"
      );
    }
  },
};
