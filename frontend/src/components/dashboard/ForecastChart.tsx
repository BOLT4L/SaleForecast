import { useMemo } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Area,
} from "recharts";
import { format, parseISO, isValid } from "date-fns";
import type { Forecast } from "../../types/forecast";
import type { Sale } from "../../types/sale";

interface ForecastChartProps {
  forecast: Forecast | null;
  sales: Sale[];
}

const ForecastChart = ({ forecast, sales }: ForecastChartProps) => {
  // Memoize chart data processing
  const chartData = useMemo(() => {
    if (!forecast?.predictions?.length) return [];

    const targetProductId = forecast?.product?.id;
    // Group sales by date
    const salesByDate = sales.reduce<
      Record<string, { date: string; actual: number }>
    >((acc, sale) => {
      try {
        const parsedDate = parseISO(sale.date);
        if (!isValid(parsedDate)) {
          console.warn(`Invalid sale date: ${sale.date}`);
          return acc;
        }
        const dateKey = format(parsedDate, "yyyy-MM-dd");
        const relevantAmount = targetProductId
          ? sale.items
              ?.filter((item) => item.productId === targetProductId)
              .reduce(
                (sum, item) => sum + item.quantity * item.price,
                0
              ) || 0
          : sale.totalAmount;
        if (relevantAmount <= 0) {
          return acc;
        }
        acc[dateKey] = {
          date: dateKey,
          actual: (acc[dateKey]?.actual || 0) + relevantAmount,
        };
        return acc;
      } catch (error) {
        console.warn(`Error parsing sale date: ${sale.date}`, error);
        return acc;
      }
    }, {});

    // Combine forecast predictions with sales data
    const combinedData = forecast.predictions
      .map((prediction) => {
        try {
          const parsedDate = parseISO(prediction.date);
          if (!isValid(parsedDate)) {
            console.warn(`Invalid prediction date: ${prediction.date}`);
            return null;
          }
          const dateKey = format(parsedDate, "yyyy-MM-dd");
          return {
            date: dateKey,
            predicted: Number(prediction.predictedValue) || 0,
            confidence: Number(prediction.confidence) || 0,
            actual: salesByDate[dateKey]?.actual ?? null,
          };
        } catch (error) {
          console.warn(
            `Error parsing prediction date: ${prediction.date}`,
            error
          );
          return null;
        }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    return combinedData;
  }, [forecast, sales]);

  // Handle empty or invalid data
  if (!forecast?.predictions?.length || chartData.length === 0) {
    return (
      <div
        className="flex items-center justify-center h-full text-muted-foreground"
        role="alert"
        aria-label="No forecast data available"
      >
        <p>No forecast data available</p>
      </div>
    );
  }

  return (
    <div
      className="h-full w-full"
      role="region"
      aria-label="Sales forecast chart"
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--chart-grid, #888)"
            opacity={0.2}
          />
          <XAxis
            dataKey="date"
            tickFormatter={(date) => {
              try {
                return format(parseISO(date), "MMM dd");
              } catch {
                console.warn(`Invalid XAxis date: ${date}`);
                return date;
              }
            }}
            stroke="var(--chart-text, #888)"
            aria-label="Date"
          />
          <YAxis
            yAxisId="sales"
            tickFormatter={(value) => `$${value}`}
            stroke="var(--chart-text, #888)"
            label={{
              value: "Sales ($)",
              angle: -90,
              position: "insideLeft",
              style: { textAnchor: "middle", fill: "var(--chart-text, #888)" },
            }}
            aria-label="Sales amount"
          />
          <YAxis
            yAxisId="confidence"
            orientation="right"
            tickFormatter={(value) => `${value}%`}
            stroke="var(--chart-text, #888)"
            domain={[0, 100]}
            label={{
              value: "Confidence (%)",
              angle: 90,
              position: "insideRight",
              style: { textAnchor: "middle", fill: "var(--chart-text, #888)" },
            }}
            aria-label="Confidence percentage"
          />
          <Tooltip
            formatter={(value, name, info) => {
              const key = info.dataKey;
            
              if (key === "confidence") {
                return [`${Number(value).toFixed(2)}%`, "Confidence"];
              }
              if (key === "predicted") {
                return [`$${Number(value).toFixed(2)}`, "Predicted Sales"];
              }
              if (key === "actual") {
                return [`$${Number(value).toFixed(2)}`, "Actual Sales"];
              }
            
              return value;
            }}
            
            labelFormatter={(date) => {
              try {
                return format(parseISO(date), "MMMM dd, yyyy");
              } catch {
                return date;
              }
            }}
            contentStyle={{
              backgroundColor: "var(--chart-tooltip-bg, #1f2937)",
              color: "var(--chart-tooltip-text, #ffffff)",
              border: "none",
              borderRadius: "4px",
            }}
          />
          <Legend wrapperStyle={{ color: "var(--chart-text, #888)" }} />
          <Bar
            yAxisId="sales"
            dataKey="predicted"
            name="Predicted Sales"
            fill="var(--chart-predicted, #3b82f6)"
            barSize={20}
            fillOpacity={0.8}
            aria-label="Predicted sales"
          />
          <Area
            yAxisId="confidence"
            dataKey="confidence"
            name="Confidence (%)"
            fill="var(--chart-confidence, #10b981)"
            stroke="var(--chart-confidence, #10b981)"
            fillOpacity={0.3}
            aria-label="Confidence level"
          />
          <Line
            yAxisId="sales"
            type="monotone"
            dataKey="actual"
            name="Actual Sales"
            stroke="var(--chart-actual, #f59e0b)"
            strokeWidth={2}
            dot={{ r: 4, fill: "var(--chart-actual, #f59e0b)" }}
            connectNulls={false} // Avoid connecting nulls
            aria-label="Actual sales"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ForecastChart;
