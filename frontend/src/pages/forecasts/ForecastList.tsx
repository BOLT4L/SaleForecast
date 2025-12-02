import { useState } from "react";
import { format, parseISO } from "date-fns";
import { Eye, BarChart3 } from "lucide-react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/Table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/Dialog";
import ForecastDetails from "./ForecastDetails";
import { useAuth } from "../../context/AuthContext";
import type { Forecast } from "../../types/forecast";

interface ForecastListProps {
  forecasts: Forecast[];
  isLoading: boolean;
}

const ForecastList = ({ forecasts, isLoading }: ForecastListProps) => {
  const { user } = useAuth();
  const isAuthorized = ["Manager", "Admin", "Owner"].includes(user?.role || "");
  const [selectedForecast, setSelectedForecast] = useState<Forecast | null>(
    null
  );
  const [showDetails, setShowDetails] = useState(false);

  const handleViewDetails = (forecast: Forecast) => {
    setSelectedForecast(forecast);
    setShowDetails(true);
  };

  if (!isAuthorized) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">
          Access denied: Insufficient permissions
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {[
                "Product",
                "Period",
                "Model",
                "Date Range",
                "Confidence",
                "Created",
                "Actions",
              ].map((header, i) => (
                <TableHead key={i}>
                  <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={`skeleton-${i}`}>
                {[...Array(6)].map((__, j) => (
                  <TableCell key={j}>
                    <div className="h-4 w-full bg-muted animate-pulse rounded" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (!forecasts.length) {
    return (
      <div className="text-center py-8">
        <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-2 text-lg font-semibold">No forecasts found</h3>
        <p className="text-muted-foreground">
          Generate a new forecast to get started.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Model</TableHead>
              <TableHead>Date Range</TableHead>
              <TableHead>Confidence</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {forecasts.map((forecast) => (
              <TableRow key={forecast.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {forecast.product?.name || "Unassigned"}
                    </span>
                    {forecast.product?.category && (
                      <span className="text-xs text-muted-foreground">
                        {forecast.product.category}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{forecast.period}</Badge>
                </TableCell>
                <TableCell>{forecast.model}</TableCell>
                <TableCell>
                  {format(parseISO(forecast.startDate), "MMM dd, yyyy")} -{" "}
                  {format(parseISO(forecast.endDate), "MMM dd, yyyy")}
                </TableCell>
                <TableCell>
                  {forecast.predictions[0]?.confidence.toFixed(1)}%
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {format(parseISO(forecast.createdAt), "MMM dd, yyyy")}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewDetails(forecast)}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Forecast Details</DialogTitle>
          </DialogHeader>
          {selectedForecast && <ForecastDetails forecast={selectedForecast} />}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ForecastList;
