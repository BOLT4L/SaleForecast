import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  TrendingUp,
  ShoppingCart,
  DollarSign,
  Package,
  Upload,
  BarChart,
} from "lucide-react";
import { salesService } from "../services/salesService";
import { forecastService } from "../services/forecastService";
import { marketBasketService } from "../services/marketBasketService";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import { DateRangePicker } from "../components/ui/DateRangePicker";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/Tabs";
import SalesChart from "../components/dashboard/SalesChart";
import ForecastChart from "../components/dashboard/ForecastChart";
import MarketBasketChart from "../components/dashboard/MarketBasketChart";
import { TabsContent } from "@radix-ui/react-tabs";

const Dashboard = () => {
  const { user } = useAuth();
  const isManager = user?.role === "Manager";

  // Fetch sales data
  const {
    data: salesData,
    isLoading: salesLoading,
    error: salesError,
  } = useQuery({
    queryKey: ["sales", (user as any)?.id],
    queryFn: () => salesService.getSales({ userId: (user as any)?.id }),
    enabled: !!(user as any)?.id,
  });

  // Fetch forecasts
  const {
    data: forecastsData,
    isLoading: forecastsLoading,
    error: forecastsError,
  } = useQuery({
    queryKey: ["forecasts", (user as any)?.id],
    queryFn: () => forecastService.getForecasts({ page: 1, limit: 1 }),
    enabled: !!(user as any)?.id,
  });

  // Fetch market basket analyses
  const {
    data: marketBaskets,
    isLoading: marketBasketsLoading,
    error: marketBasketsError,
  } = useQuery({
    queryKey: ["marketBaskets", (user as any)?.id],
    queryFn: () => marketBasketService.getMarketBaskets(),
    enabled: !!(user as any)?.id,
  });

  if (salesLoading || forecastsLoading || marketBasketsLoading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-muted animate-pulse rounded" />
            <div className="h-4 w-32 bg-muted animate-pulse rounded" />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="h-10 w-40 bg-muted animate-pulse rounded" />
            {isManager && (
              <div className="flex gap-2">
                <div className="h-8 w-32 bg-muted animate-pulse rounded" />
                <div className="h-8 w-32 bg-muted animate-pulse rounded" />
              </div>
            )}
          </div>
        </div>

        {/* Metrics Cards Skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                <div className="h-4 w-4 bg-muted animate-pulse rounded-full" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-32 bg-muted animate-pulse rounded" />
                <div className="mt-2 h-4 w-20 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Chart Tabs Skeleton */}
        <div className="space-y-4">
          <div className="flex gap-2">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-8 w-24 bg-muted animate-pulse rounded"
              />
            ))}
          </div>
          <Card>
            <CardHeader>
              <div className="h-6 w-36 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-80 w-full bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (salesError || forecastsError || marketBasketsError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-destructive mb-4">
            {salesError?.message ||
              forecastsError?.message ||
              marketBasketsError?.message ||
              "Failed to load data"}
          </p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  // Validate data
  const sales = Array.isArray(salesData?.sales) ? salesData.sales : [];
  const forecastList = Array.isArray(forecastsData?.forecasts)
    ? forecastsData.forecasts
    : [];
  const marketBasketList = Array.isArray(marketBaskets) ? marketBaskets : [];

  // Calculate metrics with additional safeguards
  const totalSales = sales.reduce(
    (sum, sale) => sum + (sale.totalAmount || 0),
    0
  );
  const averageSale = sales.length ? totalSales / sales.length : 0;
  const latestForecast = forecastList.length ? forecastList[0] : null;
  const topItemset =
    marketBasketList.length && marketBasketList[0]?.itemsets?.length
      ? [...marketBasketList[0].itemsets].sort(
          (a, b) => (b.support || 0) - (a.support || 0)
        )[0]
      : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.username || "User"}!
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <DateRangePicker />
          {isManager && (
            <div className="flex gap-2">
              {/* <Button size="sm" className="gap-1">
                <Upload className="w-4 h-4" />
                <span>Upload Sales</span>
              </Button>
              <Button size="sm" className="gap-1">
                <BarChart className="w-4 h-4" />
                <span>Generate Forecast</span>
              </Button> */}
            </div>
          )}
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              <DollarSign className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalSales.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {sales.length} transactions
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Average Sale
              </CardTitle>
              <ShoppingCart className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${averageSale.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">Per transaction</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Latest Forecast
              </CardTitle>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {latestForecast?.predictions?.[0]?.predictedValue
                  ? `$${latestForecast.predictions[0].predictedValue.toFixed(
                      2
                    )}`
                  : "N/A"}
              </div>
              <p className="text-xs text-muted-foreground">
                {latestForecast?.predictions?.[0]?.confidence
                  ? `${latestForecast.predictions[0].confidence.toFixed(
                      1
                    )}% confidence`
                  : "No forecasts available"}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Top Product Set
              </CardTitle>
              <Package className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {topItemset?.items?.length
                  ? `${topItemset.items.length} items`
                  : "N/A"}
              </div>
              <p className="text-xs text-muted-foreground">
                {topItemset?.support
                  ? `${(topItemset.support * 100).toFixed(1)}% support`
                  : "No market basket data"}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts */}
      <Tabs defaultValue="sales" className="w-full">
        <TabsList>
          <TabsTrigger value="sales">Sales Trends</TabsTrigger>
          <TabsTrigger value="forecast">Forecast</TabsTrigger>
          <TabsTrigger value="marketbasket">Market Basket</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="p-0">
          <Card>
            <CardHeader>
              <CardTitle>Sales Trends</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <SalesChart sales={sales} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forecast" className="p-0">
          <Card>
            <CardHeader>
              <CardTitle>Sales Forecast</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <ForecastChart forecast={latestForecast} sales={sales} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="marketbasket" className="p-0">
          <Card>
            <CardHeader>
              <CardTitle>Market Basket Analysis</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <MarketBasketChart marketBasket={marketBasketList[0] || null} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
