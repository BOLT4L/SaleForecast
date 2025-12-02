export interface SaleItem {
  productId: string;
  productName?: string; // Optional, populated from Product
  quantity: number;
  price: number;
  promotion: boolean;
}

export interface Sale {
  _id: string;
  id: string;
  userId: string;
  date: string;
  totalAmount: number;
  items: SaleItem[];
  promotion: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SaleInput {
  date: string;
  items: {
    productId: string;
    quantity: number;
    price: number;
    promotion: boolean;
  }[];
  totalAmount: number;
  promotion?: boolean;
}

export interface SalesResponse {
  sales: Sale[];
  total: number;
  page: number;
  totalPages: number;
}

export interface TransformedSalesResponse extends SalesResponse {}

export interface UploadResponse {
  message: string;
  count: number;
}
