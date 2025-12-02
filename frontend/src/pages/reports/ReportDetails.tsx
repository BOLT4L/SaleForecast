import { format, parseISO, isValid } from "date-fns";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/Tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/Card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/Table";
import type { Report } from "../../types/report";

interface ReportDetailsProps {
  report: Report;
}

const ReportDetails = ({ report }: ReportDetailsProps) => {
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

  const salesByDayData = [
    { name: "Mon", value: 1200 },
    { name: "Tue", value: 1900 },
    { name: "Wed", value: 1500 },
    { name: "Thu", value: 1700 },
    { name: "Fri", value: 2200 },
    { name: "Sat", value: 1800 },
    { name: "Sun", value: 1100 },
  ];

  const topProductsData = [
    { id: "1", name: "Product A", value: 4000 },
    { id: "2", name: "Product B", value: 3000 },
    { id: "3", name: "Product C", value: 2000 },
    { id: "4", name: "Product D", value: 1500 },
    { id: "5", name: "Product E", value: 1000 },
  ];

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="col-span-2">
          <h4 className="font-medium text-muted-foreground">Date Range</h4>
          <p className="text-lg">
            {report.dateRange
              ? `${formatDate(report.dateRange.startDate)} to ${formatDate(
                  report.dateRange.endDate
                )}`
              : "N/A"}
          </p>
        </div>
        <div>
          <h4 className="font-medium text-muted-foreground">Created</h4>
          <p>{formatDate(report.createdAt)}</p>
        </div>
        <div>
          <h4 className="font-medium text-muted-foreground">Type</h4>
          <p>{report.reportType || "Unknown"}</p>
        </div>
      </div>

      <Tabs defaultValue="salesByDay" className="w-full">
        <TabsList>
          <TabsTrigger value="salesByDay">Sales by Day</TabsTrigger>
          <TabsTrigger value="topProducts">Top Products</TabsTrigger>
        </TabsList>

        <TabsContent value="salesByDay">
          <Card>
            <CardHeader>
              <CardTitle>Sales by Day</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={salesByDayData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#888"
                      opacity={0.2}
                    />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => `$${value}`} />
                    <Tooltip formatter={(value) => [`$${value}`, "Sales"]} />
                    <Legend />
                    <Bar dataKey="value" name="Sales" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="topProducts">
          <Card>
            <CardHeader>
              <CardTitle>Top Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={topProductsData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius="80"
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {topProductsData.map((entry) => (
                          <Cell
                            key={`cell-${entry.id}`}
                            fill={COLORS[parseInt(entry.id) % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`$${value}`, "Sales"]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Sales</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topProductsData.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">
                            {product.name}
                          </TableCell>
                          <TableCell>${product.value}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportDetails;
