import { useEffect, useMemo, useState } from "react";
import { format, parseISO, isValid } from "date-fns";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { Badge } from "../../components/ui/Badge";
import { Separator } from "../../components/ui/Separator";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Label } from "../../components/ui/Label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/Card";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import type {
  Forecast,
  PricePredictionResponse,
} from "../../types/forecast";
import { forecastService } from "../../services/forecastService";

// Register Chart.js components
ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend
);

interface ForecastDetailsProps {
  forecast: Forecast | null;
}

const ForecastDetails = ({ forecast }: ForecastDetailsProps) => {
  const { user } = useAuth();
  const isAuthorized = ["Manager", "Admin", "Owner"].includes(user?.role || "");
  const [initialCost, setInitialCost] = useState(() =>
    forecast?.insights?.price?.average
      ? forecast.insights.price.average.toFixed(2)
      : ""
  );
  const [profitMargin, setProfitMargin] = useState("20");
  const [isPredicting, setIsPredicting] = useState(false);
  const [prediction, setPrediction] = useState<PricePredictionResponse | null>(
    null
  );

  useEffect(() => {
    setInitialCost(
      forecast?.insights?.price?.average
        ? forecast.insights.price.average.toFixed(2)
        : ""
    );
    setPrediction(null);
    setProfitMargin("20");
  }, [forecast?.id, forecast?.insights?.price?.average]);

  if (!isAuthorized) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">
          Access denied: Insufficient permissions
        </p>
      </div>
    );
  }

  if (!forecast || !forecast.predictions?.length) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No forecast data available</p>
      </div>
    );
  }

  const canPredict = Boolean(forecast.product?.id);
  const priceInsights = forecast.insights?.price;
  const demandInsights = forecast.insights?.demand;
  const formatCurrency = (value?: number) =>
    typeof value === "number" ? `$${value.toFixed(2)}` : "N/A";
  const formatPercent = (value?: number, isFraction = false) => {
    if (typeof value !== "number") return "N/A";
    const actual = isFraction ? value * 100 : value;
    return `${actual.toFixed(1)}%`;
  };

  const chartData = useMemo(() => {
    return forecast.predictions
      .map((prediction, index) => {
        try {
          const parsedDate = parseISO(prediction.date);
          if (!isValid(parsedDate)) {
            console.warn(
              `Invalid date in prediction ${index}: ${prediction.date}`
            );
            return null;
          }
          return {
            date: format(parsedDate, "MMM dd"),
            Predicted: prediction.predictedValue,
            Upper: prediction.confidenceUpper,
            Lower: prediction.confidenceLower,
            Confidence: prediction.confidence,
          };
        } catch (error) {
          console.warn(`Error parsing date in prediction ${index}: ${error}`);
          return null;
        }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [forecast.predictions]);

  const chartConfig = {
    type: "line" as const,
    data: {
      labels: chartData.map((item) => item.date),
      datasets: [
        {
          label: "Predicted Sales",
          data: chartData.map((item) => item.Predicted),
          borderColor: "#3b82f6",
          backgroundColor: "rgba(59, 130, 246, 0.2)",
          fill: false,
          tension: 0.4,
        },
        {
          label: "Confidence Upper",
          data: chartData.map((item) => item.Upper),
          borderColor: "#10b981",
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          fill: {
            target: "Confidence Lower",
            above: "rgba(16, 185, 129, 0.1)",
            below: "rgba(16, 185, 129, 0.1)",
          },
          tension: 0.4,
          borderDash: [5, 5],
        },
        {
          label: "Confidence Lower",
          data: chartData.map((item) => item.Lower),
          borderColor: "#10b981",
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          fill: false,
          tension: 0.4,
          borderDash: [5, 5],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: "category",
          title: { display: true, text: "Date" },
          grid: { display: false },
        },
        y: {
          title: { display: true, text: "Sales ($)" },
          beginAtZero: true,
          ticks: {
            callback: (value: number) => `$${value.toFixed(0)}`,
          },
        },
      },
      plugins: {
        legend: { position: "top" as const },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              const dataset = context.dataset.label;
              const value = context.parsed.y;
              return `${dataset}: $${value.toFixed(2)}`;
            },
          },
        },
      },
    },
  };

  const handlePredictPrice = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!forecast.product?.id) {
      toast.error("This forecast is not linked to a product");
      return;
    }

    const costValue = Number(initialCost);
    const marginValue = Number(profitMargin);
    if (!Number.isFinite(costValue) || costValue <= 0) {
      toast.error("Enter a valid initial cost greater than 0");
      return;
    }
    if (!Number.isFinite(marginValue) || marginValue < 0) {
      toast.error("Profit margin must be zero or higher");
      return;
    }

    setIsPredicting(true);
    try {
      const result = await forecastService.predictPrice({
        productId: forecast.product.id,
        initialCost: costValue,
        profitMargin: marginValue,
      });
      setPrediction(result);
      toast.success("Price prediction generated");
    } catch (error: any) {
      toast.error(error.message || "Failed to generate price prediction");
    } finally {
      setIsPredicting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div>
          <h4 className="font-medium text-muted-foreground">Product</h4>
          <p className="text-lg font-semibold">
            {forecast.product?.name || "Unassigned"}
          </p>
          {forecast.product?.category && (
            <span className="text-xs text-muted-foreground">
              {forecast.product.category}
            </span>
          )}
        </div>
        <div>
          <h4 className="font-medium text-muted-foreground">Period</h4>
          <p className="text-lg">
            <Badge variant="outline">{forecast.period}</Badge>
          </p>
        </div>
        <div>
          <h4 className="font-medium text-muted-foreground">Model</h4>
          <p className="text-lg">{forecast.model}</p>
        </div>
        <div>
          <h4 className="font-medium text-muted-foreground">
            Confidence Level
          </h4>
          <p className="text-lg font-semibold">
            {forecast.predictions[0]?.confidence
              ? `${forecast.predictions[0].confidence.toFixed(1)}%`
              : "N/A"}
          </p>
        </div>
        <div>
          <h4 className="font-medium text-muted-foreground">Created</h4>
          <p>
            {forecast.createdAt
              ? format(parseISO(forecast.createdAt), "MMM dd, yyyy")
              : "N/A"}
          </p>
        </div>
      </div>

      <div>
        <h4 className="font-medium mb-2">Date Range</h4>
        <p>
          From{" "}
          <span className="font-medium">
            {forecast.startDate
              ? format(parseISO(forecast.startDate), "MMMM dd, yyyy")
              : "N/A"}
          </span>{" "}
          to{" "}
          <span className="font-medium">
            {forecast.endDate
              ? format(parseISO(forecast.endDate), "MMMM dd, yyyy")
              : "N/A"}
          </span>
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Forecast Visualization</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <div className="h-80">
              <Line
                data={chartConfig.data}
                options={chartConfig.options as any}
              />
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center">
              <p className="text-muted-foreground">
                No valid prediction data available
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {forecast.insights && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Price Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm">
                <li>
                  <strong>Average Price:</strong>{" "}
                  {formatCurrency(priceInsights?.average)}
                </li>
                <li>
                  <strong>Price Range:</strong>{" "}
                  {`${formatCurrency(priceInsights?.min)} - ${formatCurrency(
                    priceInsights?.max
                  )}`}
                </li>
                <li>
                  <strong>Volatility:</strong>{" "}
                  {priceInsights
                    ? formatCurrency(priceInsights.volatility)
                    : "N/A"}
                </li>
                <li>
                  <strong>Trend:</strong> {priceInsights?.trend || "N/A"}
                </li>
              </ul>
            </CardContent>
          </Card>

            <Card>
              <CardHeader>
                <CardTitle>Demand Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1 text-sm">
                  <li>
                    <strong>Total Units Sold:</strong>{" "}
                    {demandInsights?.totalUnits?.toLocaleString() ?? "N/A"}
                  </li>
                  <li>
                    <strong>Total Revenue:</strong>{" "}
                    {formatCurrency(demandInsights?.totalRevenue)}
                  </li>
                  <li>
                    <strong>Avg Qty / Order:</strong>{" "}
                    {demandInsights?.avgQuantityPerOrder?.toFixed(2) ?? "N/A"}
                  </li>
                  <li>
                    <strong>Avg Purchase Gap:</strong>{" "}
                    {demandInsights?.avgPurchaseIntervalDays
                      ? `${demandInsights.avgPurchaseIntervalDays.toFixed(
                          1
                        )} days`
                      : "N/A"}
                  </li>
                  <li>
                    <strong>Monthly Frequency:</strong>{" "}
                    {demandInsights?.purchaseFrequencyPerMonth
                      ? demandInsights.purchaseFrequencyPerMonth.toFixed(2)
                      : "N/A"}
                  </li>
                  <li>
                    <strong>Repeat Purchase Rate:</strong>{" "}
                    {formatPercent(demandInsights?.repeatPurchaseRate, true)}
                  </li>
                  <li>
                    <strong>Behaviour:</strong>{" "}
                    {demandInsights?.behaviourLabel || "N/A"}
                  </li>
                  <li>
                    <strong>Last Purchase:</strong>{" "}
                    {demandInsights?.lastPurchaseDate
                      ? format(
                          parseISO(demandInsights.lastPurchaseDate),
                          "MMM dd, yyyy"
                        )
                      : "N/A"}
                  </li>
                </ul>
              </CardContent>
            </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Features and Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Features</h4>
              <ul className="space-y-1 text-sm">
                <li>
                  <strong>Seasonality:</strong>{" "}
                  {forecast.features?.seasonality ?? "N/A"}
                </li>
                <li>
                  <strong>Promotion:</strong>{" "}
                  {forecast.features?.promotion ? "Yes" : "No"}
                </li>
                <li>
                  <strong>Lagged Sales:</strong>{" "}
                  {forecast.features?.laggedSales ?? "N/A"}
                </li>
                <li>
                  <strong>Economic Trend:</strong>{" "}
                  {forecast.features?.economicTrend ?? "N/A"}
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Metrics</h4>
              <ul className="space-y-1 text-sm">
                <li>
                  <strong>RMSE:</strong>{" "}
                  {forecast.metrics?.rmse
                    ? forecast.metrics.rmse.toFixed(2)
                    : "N/A"}
                </li>
                <li>
                  <strong>MAE:</strong>{" "}
                  {forecast.metrics?.mae
                    ? forecast.metrics.mae.toFixed(2)
                    : "N/A"}
                </li>
                <li>
                  <strong>MAPE:</strong>{" "}
                  {forecast.metrics?.mape
                    ? `${forecast.metrics.mape.toFixed(2)}%`
                    : "N/A"}
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Smart Pricing</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePredictPrice} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="initialCost">Initial Cost (per unit)</Label>
                <Input
                  id="initialCost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={initialCost}
                  onChange={(event) => setInitialCost(event.target.value)}
                  disabled={!canPredict || isPredicting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profitMargin">Target Profit Margin (%)</Label>
                <Input
                  id="profitMargin"
                  type="number"
                  min="0"
                  step="1"
                  value={profitMargin}
                  onChange={(event) => setProfitMargin(event.target.value)}
                  disabled={!canPredict || isPredicting}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={!canPredict || isPredicting}>
                {isPredicting ? "Predicting..." : "Predict"}
              </Button>
            </div>
          </form>
          {!canPredict && (
            <p className="text-sm text-muted-foreground mt-2">
              This forecast was generated before product tracking was enabled.
            </p>
          )}
          {prediction && (
            <div className="mt-4 rounded-lg border bg-muted/40 p-4 space-y-3">
              <div>
                <p className="text-xs uppercase text-muted-foreground tracking-wide">
                  Recommended price
                </p>
                <p className="text-3xl font-bold text-primary">
                  {formatCurrency(prediction.recommendedPrice)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Target range{" "}
                  {`${formatCurrency(prediction.priceBand.min)} - ${formatCurrency(
                    prediction.priceBand.max
                  )}`}
                </p>
              </div>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <strong>Margin / Unit:</strong>{" "}
                  {formatCurrency(prediction.expectedMarginPerUnit)}
                </div>
                <div>
                  <strong>Demand Ratio:</strong>{" "}
                  {prediction.inputs.demandRatio.toFixed(2)}x
                </div>
                <div>
                  <strong>Avg Forecast Demand:</strong>{" "}
                  {prediction.reference.avgForecastDemand.toFixed(1)}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Historical Units:</strong>{" "}
                  {prediction.reference.historicalAvgUnits.toFixed(1)}
                </div>
                <div>
                  <strong>Target Margin:</strong>{" "}
                  {Number(profitMargin || 0).toFixed(1)}%
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {forecast.alert?.isActive && (
        <Card>
          <CardHeader>
            <CardTitle>Alert</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">
              {forecast.alert.message || "No alert message provided"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ForecastDetails;
