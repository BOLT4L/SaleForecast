import { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import type { MarketBasket } from "../../types/marketBasket";

interface MarketBasketChartProps {
  marketBasket: MarketBasket | undefined;
}

const MarketBasketChart = ({ marketBasket }: MarketBasketChartProps) => {
  // Process data for the chart
  const chartData = useMemo(() => {
    if (!marketBasket || !marketBasket.itemsets.length) return [];

    // Sort itemsets by support (descending) and take top 10
    return marketBasket.itemsets
      .sort((a, b) => b.support - a.support)
      .slice(0, 10)
      .map((itemset) => ({
        name: itemset.items.map((item) => item.name).join(", "), // Map to names before joining
        support: itemset.support * 100, // Convert to percentage
        items: itemset.items.length, // Number of items in the itemset
      }));
  }, [marketBasket]);

  if (!marketBasket || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No market basket data available</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={chartData}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        layout="vertical"
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#888" opacity={0.2} />
        <XAxis
          type="number"
          tickFormatter={(value) => `${value.toFixed(1)}%`}
          domain={[0, "dataMax"]}
          stroke="#888"
        />
        <YAxis
          dataKey="name"
          type="category"
          width={150}
          tick={{ fontSize: 12 }}
          stroke="#888"
        />
        <Tooltip
          formatter={(value, name) =>
            name === "support"
              ? [`${Number(value).toFixed(2)}%`, "Support"]
              : [value, "Items"]
          }
        />
        <Legend />
        <Bar
          dataKey="support"
          name="Support (%)"
          fill="#3b82f6"
          radius={[0, 4, 4, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default MarketBasketChart;
