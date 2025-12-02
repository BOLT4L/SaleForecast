export interface Product {
  _id: string;
  name: string;
  price: number;
  description?: string;
  stockQuantity: number;
  lowStockThreshold: number;
  reorderQuantity: number;
  category?: string;
  lastRestocked: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductInput {
  name: string;
  price: number;
  description?: string;
  stockQuantity: number;
  lowStockThreshold?: number;
  reorderQuantity?: number;
  category?: string;
}

export interface StockUpdateRequest {
  productId: string;
  newStock: number;
}

export interface BulkImportResponse {
  message: string;
  inserted: number;
  updated: number;
  errors?: string[];
}
