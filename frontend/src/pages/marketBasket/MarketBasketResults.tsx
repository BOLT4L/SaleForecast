import { useState } from "react";
import { format, parseISO } from "date-fns";
import { Eye } from "lucide-react";
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
import MarketBasketDetails from "./MarketBasketDetails";
import type { MarketBasket } from "../../types/marketBasket";

interface MarketBasketResultsProps {
  marketBaskets: MarketBasket[];
  isLoading: boolean;
}

const MarketBasketResults = ({
  marketBaskets,
  isLoading,
}: MarketBasketResultsProps) => {
  const [selectedAnalysis, setSelectedAnalysis] = useState<MarketBasket | null>(
    null
  );
  const [showDetails, setShowDetails] = useState(false);

  const handleViewDetails = (analysis: MarketBasket) => {
    setSelectedAnalysis(analysis);
    setShowDetails(true);
  };

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {[
                "Analysis Date",
                "Date Range",
                "Min Support",
                "Min Confidence",
                "Itemsets",
                "Rules",
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
                {[...Array(7)].map((__, j) => (
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

  if (!marketBaskets.length) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-semibold">
          No market basket analyses found
        </h3>
        <p className="text-muted-foreground">
          Generate a new analysis to get started.
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
              <TableHead>Analysis Date</TableHead>
              <TableHead>Date Range</TableHead>
              <TableHead>Min Support</TableHead>
              <TableHead>Min Confidence</TableHead>
              <TableHead>Itemsets</TableHead>
              <TableHead>Rules</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {marketBaskets.map((analysis) => (
              <TableRow key={analysis.id}>
                <TableCell className="font-medium">
                  {format(parseISO(analysis.analysisDate), "MMM dd, yyyy")}
                </TableCell>
                <TableCell>
                  {analysis.dateRange?.startDate
                    ? format(parseISO(analysis.dateRange.startDate), "MMM dd")
                    : "N/A"}{" "}
                  -{" "}
                  {analysis.dateRange?.endDate
                    ? format(
                        parseISO(analysis.dateRange.endDate),
                        "MMM dd, yyyy"
                      )
                    : "N/A"}
                </TableCell>
                <TableCell>{(analysis.minSupport * 100).toFixed(2)}%</TableCell>
                <TableCell>
                  {(analysis.minConfidence * 100).toFixed(2)}%
                </TableCell>
                <TableCell>{analysis.itemsets.length} itemsets</TableCell>
                <TableCell>{analysis.rules.length} rules</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewDetails(analysis)}
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
            <DialogTitle>Market Basket Analysis Details</DialogTitle>
          </DialogHeader>
          {selectedAnalysis && (
            <MarketBasketDetails analysis={selectedAnalysis} />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MarketBasketResults;
