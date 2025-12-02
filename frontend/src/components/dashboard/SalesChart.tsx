import { useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { format, parseISO, isValid } from "date-fns";
import type { Sale } from "../../types/sale";

interface SalesChartProps {
  sales: Sale[];
}

const SalesChart = ({ sales }: SalesChartProps) => {
  // Process data for the chart
  const chartData = useMemo(() => {
    // Group sales by date
    const groupedSales = sales.reduce((acc, sale) => {
      try {
        const parsedDate = parseISO(sale.date);
        if (!isValid(parsedDate)) return acc; // Skip invalid dates
        const date = format(parsedDate, "yyyy-MM-dd");

        if (!acc[date]) {
          acc[date] = {
            date,
            total: 0,
            promotion: 0,
            regular: 0,
          };
        }

        acc[date].total += sale.totalAmount;
        if (sale.promotion) {
          acc[date].promotion += sale.totalAmount;
        } else {
          acc[date].regular += sale.totalAmount;
        }

        return acc;
      } catch {
        return acc; // Skip invalid sale dates
      }
    }, {} as Record<string, { date: string; total: number; promotion: number; regular: number }>);

    // Convert to array and sort by date
    return Object.values(groupedSales).sort((a, b) =>
      a.date.localeCompare(b.date)
    );
  }, [sales]);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No sales data available</p>
      </div>
    );
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#888" opacity={0.2} />
          <XAxis
            dataKey="date"
            tickFormatter={(date) => {
              try {
                return format(parseISO(date), "MMM dd");
              } catch {
                return date;
              }
            }}
            stroke="#888"
          />
          <YAxis
            tickFormatter={(value) => `$${value}`}
            stroke="#888"
            width={60}
          />
          <Tooltip
            formatter={(value, name) => [
              `$${Number(value).toFixed(2)}`,
              name === "total"
                ? "Total Sales"
                : name === "promotion"
                ? "Promotion Sales"
                : "Regular Sales",
            ]}
            labelFormatter={(date) => {
              try {
                return format(parseISO(date), "MMMM dd, yyyy");
              } catch {
                return date;
              }
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="total"
            name="Total Sales"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="promotion"
            name="Promotion Sales"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="regular"
            name="Regular Sales"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SalesChart;
