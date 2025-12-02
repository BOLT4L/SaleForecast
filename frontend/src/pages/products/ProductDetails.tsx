import { format, parseISO, isValid } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { salesService } from "../../services/salesService";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/Card";
import { Separator } from "../../components/ui/Separator";
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
import type { Product } from "../../types/product";
import type { Sale } from "../../types/sale";

interface ProductDetailsProps {
  product: Product;
}

const ProductDetails = ({ product }: ProductDetailsProps) => {
  const { data: salesData, isLoading } = useQuery({
    queryKey: ["sales", "product", product._id],
    queryFn: () => salesService.getSales({ productId: product._id }),
  });

  const formatDate = (dateStr?: string): string => {
    if (!dateStr) {
      console.warn("Missing date string");
      return "N/A";
    }
    try {
      const parsedDate = parseISO(dateStr);
      if (!isValid(parsedDate)) {
        console.warn(`Invalid date: ${dateStr}`);
        return "Invalid Date";
      }
      return format(parsedDate, "MMM dd, yyyy");
    } catch (error) {
      console.warn(`Error parsing date: ${dateStr}`, error);
      return "Invalid Date";
    }
  };

  const chartData = salesData?.sales
    ? salesData.sales.reduce<
        Array<{ date: string; quantity: number; revenue: number }>
      >((acc, sale: Sale) => {
        try {
          const parsedDate = parseISO(sale.date);
          if (!isValid(parsedDate)) {
            console.warn(`Invalid sale date: ${sale.date}`);
            return acc;
          }
          const date = format(parsedDate, "MMM dd");
          const saleItem = sale.items?.find(
            (item) => item.productId === product._id
          );

          if (saleItem) {
            const existingDate = acc.find((item) => item.date === date);

            if (existingDate) {
              existingDate.quantity += saleItem.quantity;
              existingDate.revenue += saleItem.price * saleItem.quantity;
            } else {
              acc.push({
                date,
                quantity: saleItem.quantity,
                revenue: saleItem.price * saleItem.quantity,
              });
            }
          }
        } catch (error) {
          console.warn(`Error processing sale date: ${sale.date}`, error);
        }
        return acc;
      }, [])
    : [];

  const totalSold = chartData.reduce((sum, item) => sum + item.quantity, 0);
  const totalRevenue = chartData.reduce((sum, item) => sum + item.revenue, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium text-muted-foreground">Product ID</h4>
          <p className="text-lg font-semibold">{product._id}</p>
        </div>
        <div>
          <h4 className="font-medium text-muted-foreground">Product Name</h4>
          <p className="text-lg font-semibold">{product.name}</p>
        </div>
        <div>
          <h4 className="font-medium text-muted-foreground">Price</h4>
          <p className="text-lg font-semibold">${product.price.toFixed(2)}</p>
        </div>
        <div>
          <h4 className="font-medium text-muted-foreground">Stock Quantity</h4>
          <p className="text-lg font-semibold">{product.stockQuantity}</p>
        </div>
        <div>
          <h4 className="font-medium text-muted-foreground">Category</h4>
          <p className="text-lg font-semibold">{product.category || "N/A"}</p>
        </div>
        <div>
          <h4 className="font-medium text-muted-foreground">
            Low Stock Threshold
          </h4>
          <p className="text-lg font-semibold">{product.lowStockThreshold}</p>
        </div>
        <div>
          <h4 className="font-medium text-muted-foreground">
            Reorder Quantity
          </h4>
          <p className="text-lg font-semibold">{product.reorderQuantity}</p>
        </div>
        <div>
          <h4 className="font-medium text-muted-foreground">Last Restocked</h4>
          <p>{formatDate(product.lastRestocked)}</p>
        </div>
        <div>
          <h4 className="font-medium text-muted-foreground">Created</h4>
          <p>{formatDate(product.createdAt)}</p>
        </div>
        <div>
          <h4 className="font-medium text-muted-foreground">Last Updated</h4>
          <p>{formatDate(product.updatedAt)}</p>
        </div>
        <div className="md:col-span-2">
          <h4 className="font-medium text-muted-foreground">Description</h4>
          <p>{product.description || "No description available"}</p>
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Sales Summary</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-24 flex items-center justify-center">
                <p>Loading sales data...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Total Sold
                    </h4>
                    <p className="text-2xl font-bold">{totalSold} units</p>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Total Revenue
                    </h4>
                    <p className="text-2xl font-bold">
                      ${totalRevenue.toFixed(2)}
                    </p>
                  </div>
                </div>
                {chartData.length === 0 && (
                  <p className="text-center text-muted-foreground">
                    No sales data available
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sales History</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#888"
                      opacity={0.2}
                    />
                    <XAxis dataKey="date" stroke="#888" />
                    <YAxis stroke="#888" />
                    <Tooltip
                      formatter={(value, name) =>
                        name === "quantity"
                          ? [`${value} units`, "Units Sold"]
                          : [`$${Number(value).toFixed(2)}`, "Revenue"]
                      }
                    />
                    <Legend />
                    <Bar
                      dataKey="quantity"
                      name="Units Sold"
                      fill="var(--chart-quantity, #3b82f6)"
                    />
                    <Bar
                      dataKey="revenue"
                      name="Revenue"
                      fill="var(--chart-revenue, #10b981)"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-60 flex items-center justify-center">
                <p className="text-muted-foreground">
                  No sales history available
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProductDetails;
