"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Network } from "lucide-react";
import { marketBasketService } from "../../services/marketBasketService";
import { Button } from "../../components/ui/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/Card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/Dialog";
import MarketBasketGenerator from "./MarketBasketGenerator";
import MarketBasketResults from "./MarketBasketResults";
import { useAuth } from "../../context/AuthContext";

const MarketBasket = () => {
  const { user } = useAuth();
  const [showGenerator, setShowGenerator] = useState(false);

  const {
    data: marketBaskets,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["marketBaskets"],
    queryFn: () => marketBasketService.getMarketBaskets(),
    enabled: !!user,
  });

  const handleGenerateSuccess = () => {
    setShowGenerator(false);
    refetch();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-muted animate-pulse rounded" />
            <div className="h-4 w-64 bg-muted animate-pulse rounded" />
          </div>
          {/* {user?.role === "Manager" && (
            <div className="h-8 w-32 bg-muted animate-pulse rounded" />
          )} */}
          <div className="h-8 w-32 bg-muted animate-pulse rounded" />
        </div>

        {/* Metrics Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 w-36 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-24 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Table Card Skeleton */}
        <Card>
          <CardHeader>
            <div className="h-6 w-48 bg-muted animate-pulse rounded" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={`skeleton-${i}`}
                  className="h-12 bg-muted animate-pulse rounded"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-destructive mb-4">
            Failed to load market basket analyses
          </p>
          <Button onClick={() => refetch()}>Try Again</Button>
        </div>
      </div>
    );
  }

  // Calculate average support and confidence from itemsets and rules
  const averageSupport =
    marketBaskets && marketBaskets.length > 0
      ? marketBaskets.reduce((sum, mb) => {
          const itemsetSupport =
            mb.itemsets.reduce((s, itemset) => s + itemset.support, 0) /
            (mb.itemsets.length || 1);
          return sum + itemsetSupport;
        }, 0) / marketBaskets.length
      : 0;

  const averageConfidence =
    marketBaskets && marketBaskets.length > 0
      ? marketBaskets.reduce((sum, mb) => {
          const ruleConfidence =
            mb.rules.reduce((s, rule) => s + rule.confidence, 0) /
            (mb.rules.length || 1);
          return sum + ruleConfidence;
        }, 0) / marketBaskets.length
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Market Basket Analysis</h1>
          <p className="text-muted-foreground">
            Discover product associations and buying patterns
          </p>
        </div>
        {/* {user?.role === "Manager" && (
          <Button onClick={() => setShowGenerator(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Analysis
          </Button>
        )} */}
        <Button onClick={() => setShowGenerator(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Analysis
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Analyses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {marketBaskets?.length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Average Itemset Support
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {averageSupport ? `${(averageSupport * 100).toFixed(1)}%` : "N/A"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Average Rule Confidence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {averageConfidence
                ? `${(averageConfidence * 100).toFixed(1)}%`
                : "N/A"}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="w-5 h-5" />
            Analysis Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MarketBasketResults
            marketBaskets={marketBaskets || []}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      <Dialog open={showGenerator} onOpenChange={setShowGenerator}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Generate Market Basket Analysis</DialogTitle>
          </DialogHeader>
          <MarketBasketGenerator onSuccess={handleGenerateSuccess} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MarketBasket;
