import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Plus, TrendingUp, BarChart3, Layers, Loader2 } from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { forecastService } from "../../services/forecastService";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/Select";
import ForecastGenerator from "./ForecastGenerator";
import ForecastList from "./ForecastList";
import ForecastChart from "../../components/dashboard/ForecastChart";
import { useAuth } from "../../context/AuthContext";
import RoleRoute from "../../components/auth/RoleRoute";

interface ForecastFilters {
  forecastPeriod?: string;
  productId?: string;
  page: number;
  limit: number;
}

const sanitizeForecastFilters = (filters: ForecastFilters) => {
  const sanitized: Record<string, string | number> = {
    page: filters.page,
    limit: filters.limit,
  };

  if (filters.forecastPeriod) {
    sanitized.forecastPeriod = filters.forecastPeriod;
  }
  if (filters.productId) {
    sanitized.productId = filters.productId;
  }

  return sanitized;
};

const Forecasts = () => {
  const { user } = useAuth();
  const [showGenerator, setShowGenerator] = useState(false);
  const [showBatchGenerator, setShowBatchGenerator] = useState(false);
  const [filters, setFilters] = useState<ForecastFilters>({
    page: 1,
    limit: 10,
  });

  const sanitizedForecastFilters = useMemo(
    () => sanitizeForecastFilters(filters),
    [filters]
  );

  const [batchScope, setBatchScope] = useState<"all" | "category">("all");
  const [batchCategory, setBatchCategory] = useState<string | undefined>();
  const [batchPeriod, setBatchPeriod] =
    useState<"Daily" | "Weekly" | "Monthly">("Monthly");
  const [batchModel, setBatchModel] = useState<"ARIMA" | "RandomForest">(
    "RandomForest"
  );
  const [batchStartDate, setBatchStartDate] = useState<Date>(
    new Date(new Date().setMonth(new Date().getMonth() - 6))
  );
  const [batchEndDate, setBatchEndDate] = useState<Date>(
    new Date(new Date().setMonth(new Date().getMonth() + 1))
  );

  const {
    data: forecastsData,
    isLoading: forecastsLoading,
    error: forecastsError,
    refetch,
  } = useQuery({
    queryKey: ["forecasts", (user as any)?.id, sanitizedForecastFilters],
    queryFn: () => forecastService.getForecasts(sanitizedForecastFilters),
    enabled: !!(user as any)?.id,
  });

  const { data: salesData, isLoading: salesLoading } = useQuery({
    queryKey: ["sales", (user as any)?.id],
    queryFn: () => salesService.getSales({ userId: (user as any)?.id }),
    enabled: !!(user as any)?.id,
  });

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () => productService.getProducts(),
  });

  const uniqueCategories = Array.from(
    new Set(
      (products || [])
        .map((p: any) => p.category)
        .filter((c: any) => typeof c === "string" && c.trim().length > 0)
    )
  ) as string[];

  const batchMutation = useMutation({
    mutationFn: () =>
      forecastService.generateBatchForecasts({
        forecastPeriod: batchPeriod,
        modelType: batchModel,
        startDate: format(batchStartDate, "yyyy-MM-dd"),
        endDate: format(batchEndDate, "yyyy-MM-dd"),
        scope: batchScope,
        category: batchScope === "category" ? batchCategory : undefined,
      }),
    onSuccess: (result) => {
      toast.success(
        `Batch forecasts created for ${result.successfulForecasts}/${result.totalProducts} products`
      );
      setShowBatchGenerator(false);
      // Refresh list of forecasts
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to generate batch forecasts");
    },
  });

  const handleGenerateSuccess = () => {
    setShowGenerator(false);
    refetch();
  };

  const handleFilterChange = (newFilters: Partial<ForecastFilters>) => {
    setFilters((prev) => {
      const updated: ForecastFilters = { ...prev };
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

      return updated;
    });
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => {
      const nextPage = Math.max(1, page);
      if (nextPage === prev.page) return prev;
      return { ...prev, page: nextPage };
    });
  };

  const handleOpenBatchForScope = (scope: "all" | "category") => {
    setBatchScope(scope);
    if (scope === "all") {
      setBatchCategory(undefined);
    }
    setShowBatchGenerator(true);
  };

  const handleSubmitBatch = () => {
    if (batchStartDate >= batchEndDate) {
      toast.error("Batch start date must be before end date");
      return;
    }
    if (batchScope === "category" && !batchCategory) {
      toast.error("Please select a category");
      return;
    }
    batchMutation.mutate();
  };

if (forecastsLoading || salesLoading || productsLoading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-muted animate-pulse rounded" />
            <div className="h-4 w-64 bg-muted animate-pulse rounded" />
          </div>
          <RoleRoute requiredRoles={["Manager", "Admin", "Owner"]}>
            <div className="h-8 w-32 bg-muted animate-pulse rounded" />
          </RoleRoute>
        </div>

        {/* Metrics Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
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

        {/* Filters Card Skeleton */}
        <Card>
          <CardHeader>
            <div className="h-6 w-48 bg-muted animate-pulse rounded" />
          </CardHeader>
          <CardContent>
            <div className="h-10 w-48 bg-muted animate-pulse rounded" />
          </CardContent>
        </Card>

        {/* Forecast History Table Skeleton */}
        <Card>
          <CardHeader>
            <div className="h-6 w-48 bg-muted animate-pulse rounded" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={`skeleton-${i}`}
                  className="h-12 bg-muted animate-pulse rounded"
                />
              ))}
            </div>
            <div className="flex justify-between items-center mt-4">
              <div className="h-8 w-24 bg-muted animate-pulse rounded" />
              <div className="h-4 w-32 bg-muted animate-pulse rounded" />
              <div className="h-8 w-24 bg-muted animate-pulse rounded" />
            </div>
          </CardContent>
        </Card>

        {/* Latest Forecast Chart Skeleton */}
        <Card>
          <CardHeader>
            <div className="h-6 w-48 bg-muted animate-pulse rounded" />
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full bg-muted animate-pulse rounded" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (forecastsError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-destructive mb-4">
            {(forecastsError as Error).message}
          </p>
          <Button onClick={() => refetch()}>Try Again</Button>
        </div>
      </div>
    );
  }

  // Calculate most used model
  const mostUsedModel =
    (forecastsData?.forecasts ?? []).length > 0
      ? (forecastsData?.forecasts ?? []).reduce((acc, curr) => {
          acc[curr.model] = (acc[curr.model] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      : {};
  const topModel =
    Object.entries(mostUsedModel).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Sales Forecasting</h1>
          <p className="text-muted-foreground">
            Generate and analyze sales predictions, including all products and
            category-level forecasts.
          </p>
        </div>
        <RoleRoute requiredRoles={["Manager", "Admin", "Owner"]}>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setShowGenerator(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Generate Forecast
            </Button>
            <Button
              variant="outline"
              onClick={() => handleOpenBatchForScope("all")}
            >
              <Layers className="w-4 h-4 mr-2" />
              All Products
            </Button>
            <Button
              variant="outline"
              disabled={!uniqueCategories.length}
              onClick={() => handleOpenBatchForScope("category")}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              By Category
            </Button>
          </div>
        </RoleRoute>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Forecasts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {forecastsData?.total || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Latest Confidence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(forecastsData?.forecasts ?? []).length > 0
                ? `${forecastsData?.forecasts[0]?.predictions[0]?.confidence.toFixed(
                    1
                  )}%`
                : "N/A"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Most Used Model
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{topModel}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-48">
                <Select
                  value={filters.forecastPeriod || "all"}
                  onValueChange={(value) =>
                    handleFilterChange({
                      forecastPeriod: value === "all" ? undefined : value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Periods</SelectItem>
                    <SelectItem value="Daily">Daily</SelectItem>
                    <SelectItem value="Weekly">Weekly</SelectItem>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-64">
                <Select
                  value={filters.productId || "all"}
                  onValueChange={(value) =>
                    handleFilterChange({
                      productId: value === "all" ? undefined : value,
                    })
                  }
                  disabled={!products.length}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by product" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Products</SelectItem>
                    {products.map((product) => (
                      <SelectItem key={product._id} value={product._id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Forecast History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ForecastList
            forecasts={forecastsData?.forecasts || []}
            isLoading={forecastsLoading}
          />
          {(forecastsData?.totalPages ?? 0) > 1 && (
            <div className="flex justify-between items-center mt-4">
              <Button
                disabled={filters.page === 1}
                onClick={() => handlePageChange(filters.page - 1)}
              >
                Previous
              </Button>
              <span>
                Page {filters.page} of {forecastsData?.totalPages}
              </span>
              <Button
                disabled={filters.page === forecastsData?.totalPages}
                onClick={() => handlePageChange(filters.page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {(forecastsData?.forecasts ?? []).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Latest Forecast vs Actual Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ForecastChart
                forecast={forecastsData?.forecasts?.[0] ?? null}
                sales={salesData?.sales || []}
              />
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={showGenerator} onOpenChange={setShowGenerator}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Generate New Forecast</DialogTitle>
          </DialogHeader>
          <ForecastGenerator
            onSuccess={handleGenerateSuccess}
            products={products}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showBatchGenerator} onOpenChange={setShowBatchGenerator}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              Batch Forecasts –{" "}
              {batchScope === "all" ? "All Products" : "By Category"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <span className="text-sm font-medium">Forecast Period</span>
                <Select
                  value={batchPeriod}
                  onValueChange={(value) =>
                    setBatchPeriod(
                      value as "Daily" | "Weekly" | "Monthly"
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Daily">Daily</SelectItem>
                    <SelectItem value="Weekly">Weekly</SelectItem>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <span className="text-sm font-medium">Model</span>
                <Select
                  value={batchModel}
                  onValueChange={(value) =>
                    setBatchModel(value as "ARIMA" | "RandomForest")
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ARIMA">ARIMA</SelectItem>
                    <SelectItem value="RandomForest">
                      Random Forest
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {batchScope === "category" && (
              <div className="space-y-2">
                <span className="text-sm font-medium">Product Category</span>
                <Select
                  value={batchCategory || ""}
                  onValueChange={(value) => setBatchCategory(value)}
                  disabled={!uniqueCategories.length}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!uniqueCategories.length && (
                  <p className="text-xs text-muted-foreground">
                    No product categories found. Add categories to your
                    products first.
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1 text-sm">
                <span className="font-medium">Start Date</span>
                <input
                  type="date"
                  className="border rounded px-2 py-1 w-full text-sm"
                  value={format(batchStartDate, "yyyy-MM-dd")}
                  onChange={(event) =>
                    setBatchStartDate(new Date(event.target.value))
                  }
                />
              </div>
              <div className="space-y-1 text-sm">
                <span className="font-medium">End Date</span>
                <input
                  type="date"
                  className="border rounded px-2 py-1 w-full text-sm"
                  value={format(batchEndDate, "yyyy-MM-dd")}
                  onChange={(event) =>
                    setBatchEndDate(new Date(event.target.value))
                  }
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              This will generate forecasts for{" "}
              {batchScope === "all"
                ? "all available products"
                : "all products in the selected category"}
              . Existing forecasts are kept; new ones are added.
            </p>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowBatchGenerator(false)}
                disabled={batchMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSubmitBatch}
                disabled={batchMutation.isPending}
              >
                {batchMutation.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {batchScope === "all"
                  ? "Run for All Products"
                  : "Run for Category"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Forecasts;
