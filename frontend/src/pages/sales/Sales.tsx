"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ShoppingCart, Upload } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { salesService } from "../../services/salesService";
import { productService } from "../../services/productService";
import { Button } from "../../components/ui/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/Card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/Dialog";
import RoleRoute from "../../components/auth/RoleRoute";
import SalesFilters from "./SalesFilters";
import SalesTable from "./SalesTable";
import SaleForm from "./SaleForm";
import SalesUpload from "./SalesUpload";
import type { Sale } from "../../types/sale";

interface SalesFiltersState {
  startDate?: string;
  endDate?: string;
  page: number;
  limit: number;
  promotion?: boolean;
  minAmount?: number;
  maxAmount?: number;
  productId?: string;
}

const sanitizeSalesFilters = (filters: SalesFiltersState) => {
  const sanitized: Record<string, string | number | boolean> = {
    page: filters.page,
    limit: filters.limit,
  };

  (
    [
      "startDate",
      "endDate",
      "promotion",
      "minAmount",
      "maxAmount",
      "productId",
    ] as (keyof SalesFiltersState)[]
  ).forEach((key) => {
    const value = filters[key];
    if (
      value !== undefined &&
      value !== null &&
      value !== "" &&
      !(typeof value === "number" && Number.isNaN(value))
    ) {
      sanitized[key] = value as any;
    }
  });

  return sanitized;
};

const Sales = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [filters, setFilters] = useState<SalesFiltersState>({
    page: 1,
    limit: 10,
  });

  const sanitizedFilters = useMemo(
    () => sanitizeSalesFilters(filters),
    [filters]
  );

  const {
    data: salesData,
    isLoading,
    error,
  } = useQuery({
    queryKey: [
  "sales",
  (user as any)?.id,
  filters.page,
  filters.limit,
  JSON.stringify({
    startDate: filters.startDate,
    endDate: filters.endDate,
    promotion: filters.promotion,
    minAmount: filters.minAmount,
    maxAmount: filters.maxAmount,
    productId: filters.productId,
  }),
],
    queryFn: () =>
      salesService.getSales({
        ...sanitizedFilters,
        userId: (user as any)?.id,
      }),
    enabled: !!(user as any)?.id,
  });
  

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => productService.getProducts(),
  });

  const handleFiltersChange = (newFilters: Partial<SalesFiltersState>) => {
    setFilters((prev) => {
      const updated: SalesFiltersState = { ...prev };
      let shouldResetPage = false;

      Object.entries(newFilters).forEach(([key, value]) => {
        if (key === "page" || key === "limit") {
          if (typeof value === "number") {
            (updated as any)[key] = value;
          }
          return;
        }

        if (value === undefined || value === null || value === "") {
          if (key in updated) {
            delete (updated as any)[key];
            shouldResetPage = true;
          }
        } else if ((updated as any)[key] !== value) {
          (updated as any)[key] = value;
          shouldResetPage = true;
        }
      });

      if (shouldResetPage) {
        updated.page = 1;
      }

      return {
        ...updated,
        page: updated.page || 1,
        limit: updated.limit || 10,
      };
    });
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => {
      const nextPage = Math.max(1, page);
      if (nextPage === prev.page) return prev;
      return { ...prev, page: nextPage };
    });
  };

  const handleEdit = (sale: Sale) => {
    setEditingSale(sale);
    setShowCreate(true);
  };

  const handleFormSuccess = () => {
    setShowCreate(false);
    setEditingSale(null);
    queryClient.invalidateQueries({ queryKey: ["sales"], exact: false });


  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-destructive mb-4">{(error as Error).message}</p>
          <Button
            onClick={() =>
              queryClient.invalidateQueries({ queryKey: ["sales"], exact: false })

            }
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Sales Management</h1>
        <RoleRoute requiredRoles={["Manager", "Admin", "Owner"]}>
          <div className="flex gap-2">
            <Button onClick={() => setShowCreate(true)}>
              <ShoppingCart className="w-4 h-4 mr-2" />
              Create Sale
            </Button>
            <Button onClick={() => setShowUpload(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Upload Sales
            </Button>
          </div>
        </RoleRoute>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sales Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <SalesFilters
            products={products}
            onFiltersChange={handleFiltersChange}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sales List</CardTitle>
        </CardHeader>
        <CardContent>
          <SalesTable
            sales={salesData?.sales || []}
            isLoading={isLoading}
            onEdit={handleEdit}
            onRefresh={() =>
              queryClient.invalidateQueries({ queryKey: ["sales"], exact: false })
            }
          />
          {(salesData?.totalPages ?? 0) > 1 && (
            <div className="flex justify-between items-center mt-4">
              <Button
                disabled={filters.page === 1}
                onClick={() => handlePageChange(filters.page - 1)}
              >
                Previous
              </Button>
              <span>
                Page {filters.page} of {salesData?.totalPages}
              </span>
              <Button
                disabled={filters.page === salesData?.totalPages}
                onClick={() => handlePageChange(filters.page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSale ? "Edit Sale" : "Create Sale"}
            </DialogTitle>
          </DialogHeader>
          <SaleForm sale={editingSale} onSuccess={handleFormSuccess} />
        </DialogContent>
      </Dialog>

      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Sales Data</DialogTitle>
          </DialogHeader>
          <SalesUpload
            onSuccess={() => {
              setShowUpload(false);
              queryClient.invalidateQueries({ queryKey: ["sales"], exact: false });

            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Sales;
