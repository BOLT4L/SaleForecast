"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, AlertTriangle, Upload, Download } from "lucide-react";
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
import { Alert, AlertDescription } from "../../components/ui/Alert";
import { Input } from "../../components/ui/Input";
import { Label } from "../../components/ui/Label";
import ProductList from "./ProductList";
import ProductForm from "./ProductForm";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import type { Product } from "../../types/product";

const Products = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    data: products,
    isLoading: productsLoading,
    error: productsError,
  } = useQuery({
    queryKey: ["products", user?._id],
    queryFn: () => productService.getProducts(),
    enabled: !!user,
  });

  const {
    data: lowStockProducts,
    isLoading: lowStockLoading,
    error: lowStockError,
  } = useQuery({
    queryKey: ["products", "lowStock", user?._id],
    queryFn: () => productService.getLowStockProducts(),
    enabled: !!user,
  });

  // const updateStockMutation = useMutation({
  //   mutationFn: productService.updateStock,
  //   onSuccess: () => {
  //     toast.success("Stock updated successfully");
  //     queryClient.invalidateQueries({ queryKey: ["products"] });
  //   },
  //   onError: (error: any) => {
  //     toast.error(error.message || "Failed to update stock");
  //   },
  // });

  const importMutation = useMutation({
    mutationFn: productService.bulkImportProducts,
    onSuccess: (data) => {
      toast.success(
        `Imported ${data.inserted} new and updated ${data.updated} products`
      );
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setShowImportDialog(false);
      setCsvFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.errors?.join(", ") || "Failed to import products"
      );
    },
  });

  // const handleUpdateStock = (productId: string, newStock: number) => {
  //   updateStockMutation.mutate({ productId, newStock });
  // };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowAddProduct(true);
  };

  const handleFormSuccess = () => {
    setShowAddProduct(false);
    setEditingProduct(null);
    queryClient.invalidateQueries({ queryKey: ["products"] });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      console.log("Selected file:", {
        name: file.name,
        type: file.type,
        size: file.size,
      });
      if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
        toast.error("Please upload a valid CSV file");
        return;
      }
      setCsvFile(file);
    } else {
      console.log("No file selected");
    }
  };

  const handleImportSubmit = () => {
    console.log("Import triggered, csvFile:", csvFile);
    if (!csvFile) {
      toast.error("Please select a CSV file");
      return;
    }
    if (csvFile) {
      importMutation.mutate(csvFile);
    }
  };

  const handleExport = async () => {
    try {
      await productService.exportProducts();
      toast.success("Products exported successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to export products");
    }
  };

  const handleDownloadTemplate = () => {
    const template = `name,price,stockQuantity,category,description,lowStockThreshold,reorderQuantity
"Example Product",9.99,100,"Electronics","A sample product description",10,50`;
    const blob = new Blob([template], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "product_import_template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (productsLoading || lowStockLoading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-muted animate-pulse rounded" />
            <div className="h-4 w-64 bg-muted animate-pulse rounded" />
          </div>
          <div className="flex gap-2">
            <div className="h-8 w-32 bg-muted animate-pulse rounded" />
            {user?.role === "Manager" && (
              <>
                <div className="h-8 w-32 bg-muted animate-pulse rounded" />
                <div className="h-8 w-32 bg-muted animate-pulse rounded" />
                <div className="h-8 w-32 bg-muted animate-pulse rounded" />
              </>
            )}
          </div>
        </div>

        {/* Low Stock Alert Skeleton */}
        <div className="h-12 bg-muted animate-pulse rounded" />

        {/* Metrics Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(2)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 w-36 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-24 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Low Stock Products Table Skeleton */}
        <Card>
          <CardHeader>
            <div className="h-6 w-48 bg-muted animate-pulse rounded" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={`low-stock-skeleton-${i}`}
                  className="h-12 bg-muted animate-pulse rounded"
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* All Products Table Skeleton */}
        <Card>
          <CardHeader>
            <div className="h-6 w-48 bg-muted animate-pulse rounded" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={`all-products-skeleton-${i}`}
                  className="h-12 bg-muted animate-pulse rounded"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (productsError || lowStockError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-destructive mb-4">
            {productsError?.message ||
              lowStockError?.message ||
              "Failed to load products"}
          </p>
          <Button
            onClick={() =>
              queryClient.invalidateQueries({ queryKey: ["products"] })
            }
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Product Management</h1>
          <p className="text-muted-foreground">
            Manage your product inventory and stock levels
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          {user?.role === "Manager" && (
            <>
              <Button variant="outline" onClick={handleDownloadTemplate}>
                <Download className="w-4 h-4 mr-2" />
                CSV Template
              </Button>
              <Button onClick={() => setShowImportDialog(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Import CSV
              </Button>
              <Button onClick={() => setShowAddProduct(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </>
          )}
        </div>
      </div>

      {lowStockProducts && lowStockProducts.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You have {lowStockProducts.length} product(s) with low stock levels
            that need attention.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Low Stock Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {lowStockProducts?.length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {lowStockProducts && lowStockProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Low Stock Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ProductList
              products={lowStockProducts}
              isLoading={lowStockLoading}
              onEdit={user?.role === "Manager" ? handleEditProduct : undefined}
              onRefresh={() =>
                queryClient.invalidateQueries({ queryKey: ["products"] })
              }
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Products</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductList
            products={products || []}
            isLoading={productsLoading}
            onEdit={user?.role === "Manager" ? handleEditProduct : undefined}
            onRefresh={() =>
              queryClient.invalidateQueries({ queryKey: ["products"] })
            }
          />
        </CardContent>
      </Card>

      <Dialog open={showAddProduct} onOpenChange={setShowAddProduct}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Edit Product" : "Add New Product"}
            </DialogTitle>
          </DialogHeader>
          <ProductForm product={editingProduct} onSuccess={handleFormSuccess} />
        </DialogContent>
      </Dialog>

      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Products from CSV</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="csvFile">Upload CSV File</Label>
              <Input
                id="csvFile"
                type="file"
                accept=".csv"
                ref={fileInputRef}
                onChange={handleFileChange}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Download the{" "}
              <a
                href="#"
                className="underline"
                onClick={(e) => {
                  e.preventDefault();
                  handleDownloadTemplate();
                }}
              >
                CSV template
              </a>{" "}
              to ensure correct formatting. The CSV should include columns:
              name, price, stockQuantity, category, description,
              lowStockThreshold, reorderQuantity.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowImportDialog(false);
                  setCsvFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleImportSubmit}
                disabled={!csvFile || importMutation.isPending}
              >
                {importMutation.isPending ? "Importing..." : "Import"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Products;
