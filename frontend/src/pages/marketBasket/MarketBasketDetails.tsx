import { useState } from "react";
import { format, parseISO } from "date-fns";
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
import { Badge } from "../../components/ui/Badge";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { NetworkGraph } from "./NetworkGraph"; // New component
import type { MarketBasket } from "../../types/marketBasket";

interface MarketBasketDetailsProps {
  analysis: MarketBasket;
}

const MarketBasketDetails = ({ analysis }: MarketBasketDetailsProps) => {
  const [ruleFilter, setRuleFilter] = useState("");
  const [sortBy, setSortBy] = useState<"confidence" | "lift" | "support">(
    "confidence"
  );

  // Process data for itemsets chart
  const itemsetsChartData = analysis.itemsets
    .sort((a, b) => b.support - a.support)
    .slice(0, 10)
    .map((itemset) => ({
      name: itemset.items.map((item) => item.name).join(", "),
      support: itemset.support * 100,
    }));

  // Filter and sort rules
  const filteredRules = analysis.rules
    .filter((rule) =>
      rule.antecedents
        .concat(rule.consequents)
        .some((item) =>
          item.name.toLowerCase().includes(ruleFilter.toLowerCase())
        )
    )
    .sort((a, b) => b[sortBy] - a[sortBy]);

  // Process data for rules chart
  const rulesChartData = filteredRules.slice(0, 10).map((rule) => ({
    name: `${rule.antecedents
      .map((a) => a.name)
      .join(", ")} → ${rule.consequents.map((c) => c.name).join(", ")}`,
    confidence: rule.confidence * 100,
    lift: rule.lift,
    support: rule.support * 100,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <h4 className="font-medium text-muted-foreground">Analysis Date</h4>
          <p className="text-lg">
            {format(parseISO(analysis.analysisDate), "MMMM dd, yyyy")}
          </p>
        </div>
        <div className="col-span-2">
          <h4 className="font-medium text-muted-foreground">Date Range</h4>
          <p className="text-lg">
            {analysis.dateRange
              ? `${format(
                  parseISO(analysis.dateRange.startDate),
                  "MMMM dd, yyyy"
                )} to ${format(
                  parseISO(analysis.dateRange.endDate),
                  "MMMM dd, yyyy"
                )}`
              : "N/A"}
          </p>
        </div>
        <div>
          <h4 className="font-medium text-muted-foreground">Created</h4>
          <p>{format(parseISO(analysis.createdAt), "MMM dd, yyyy")}</p>
        </div>
        <div>
          <h4 className="font-medium text-muted-foreground">Min Support</h4>
          <p>{(analysis.minSupport * 100).toFixed(2)}%</p>
        </div>
        <div>
          <h4 className="font-medium text-muted-foreground">Min Confidence</h4>
          <p>{(analysis.minConfidence * 100).toFixed(2)}%</p>
        </div>
      </div>

      <Tabs defaultValue="itemsets" className="w-full">
        <TabsList>
          <TabsTrigger value="itemsets">Frequent Itemsets</TabsTrigger>
          <TabsTrigger value="rules">Association Rules</TabsTrigger>
          <TabsTrigger value="network">Network Graph</TabsTrigger>
        </TabsList>

        <TabsContent value="itemsets">
          <Card>
            <CardHeader>
              <CardTitle>Top Frequent Itemsets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={itemsetsChartData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#888"
                      opacity={0.2}
                    />
                    <XAxis
                      type="number"
                      tickFormatter={(value) => `${value.toFixed(1)}%`}
                    />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={150}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      formatter={(value) => [
                        `${Number(value).toFixed(2)}%`,
                        "Support",
                      ]}
                    />
                    <Legend />
                    <Bar dataKey="support" name="Support (%)" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-6">
                <h4 className="font-medium mb-2">All Frequent Itemsets</h4>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Items</TableHead>
                        <TableHead>Support</TableHead>
                        <TableHead>Size</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analysis.itemsets.map((itemset) => (
                        <TableRow key={itemset.id}>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {itemset.items.map((item) => (
                                <Badge key={item.id} variant="outline">
                                  {item.name}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            {(itemset.support * 100).toFixed(2)}%
                          </TableCell>
                          <TableCell>{itemset.items.length} items</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules">
          <Card>
            <CardHeader>
              <CardTitle>Association Rules</CardTitle>
              <div className="flex gap-2">
                <Input
                  placeholder="Filter by product name"
                  value={ruleFilter}
                  onChange={(e) => setRuleFilter(e.target.value)}
                />
                <Button
                  onClick={() => setSortBy("confidence")}
                  variant={sortBy === "confidence" ? "default" : "outline"}
                >
                  Sort by Confidence
                </Button>
                <Button
                  onClick={() => setSortBy("lift")}
                  variant={sortBy === "lift" ? "default" : "outline"}
                >
                  Sort by Lift
                </Button>
                <Button
                  onClick={() => setSortBy("support")}
                  variant={sortBy === "support" ? "default" : "outline"}
                >
                  Sort by Support
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={rulesChartData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#888"
                      opacity={0.2}
                    />
                    <XAxis
                      type="number"
                      tickFormatter={(value) => `${value.toFixed(1)}%`}
                    />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={150}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      formatter={(value, name) => [
                        name === "confidence" || name === "support"
                          ? `${Number(value).toFixed(2)}%`
                          : Number(value).toFixed(2),
                        name === "confidence"
                          ? "Confidence"
                          : name === "support"
                          ? "Support"
                          : "Lift",
                      ]}
                    />
                    <Legend />
                    <Bar
                      dataKey="confidence"
                      name="Confidence (%)"
                      fill="#5555e6"
                    />
                    <Bar dataKey="support" name="Support (%)" fill="#3b82f6" />
                    <Bar dataKey="lift" name="Lift" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-6">
                <h4 className="font-medium mb-2">All Association Rules</h4>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>If Customer Buys</TableHead>
                        <TableHead>Then They Also Buy</TableHead>
                        <TableHead>Support</TableHead>
                        <TableHead>Confidence</TableHead>
                        <TableHead>Lift</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRules.map((rule) => (
                        <TableRow key={rule.id}>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {rule.antecedents.map((item) => (
                                <Badge key={item.id} variant="outline">
                                  {item.name}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {rule.consequents.map((item) => (
                                <Badge key={item.id} variant="secondary">
                                  {item.name}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            {(rule.support * 100).toFixed(2)}%
                          </TableCell>
                          <TableCell>
                            {(rule.confidence * 100).toFixed(2)}%
                          </TableCell>
                          <TableCell>{rule.lift.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="network">
          <Card>
            <CardHeader>
              <CardTitle>Association Rules Network</CardTitle>
            </CardHeader>
            <CardContent>
              <NetworkGraph analysis={analysis} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MarketBasketDetails;
