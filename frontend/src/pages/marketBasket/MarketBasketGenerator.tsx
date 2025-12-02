import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarIcon, Network } from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { marketBasketService } from "../../services/marketBasketService";
import { Button } from "../../components/ui/Button";
import { Label } from "../../components/ui/Label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../components/ui/Popover";
import { Calendar } from "../../components/ui/Calendar";
import { Input } from "../../components/ui/Input";
import { cn } from "../../utils/cn";

const marketBasketSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
  minSupport: z.number().min(0).max(1).default(0.01),
  minConfidence: z.number().min(0).max(1).default(0.5),
});

type MarketBasketFormValues = z.infer<typeof marketBasketSchema>;

interface MarketBasketGeneratorProps {
  onSuccess: () => void;
}

const MarketBasketGenerator = ({ onSuccess }: MarketBasketGeneratorProps) => {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    handleSubmit,
    setValue,
    watch,
    register,
    formState: { errors },
  } = useForm<MarketBasketFormValues>({
    resolver: zodResolver(marketBasketSchema),
    defaultValues: {
      startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
      endDate: new Date(),
      minSupport: 0.01,
      minConfidence: 0.5,
    },
  });

  const startDate = watch("startDate");
  const endDate = watch("endDate");

  const generateMutation = useMutation({
    mutationFn: marketBasketService.createMarketBasket,
    onSuccess: () => {
      toast.success("Market basket analysis generated successfully");
      queryClient.invalidateQueries({ queryKey: ["marketBaskets"] });
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to generate market basket analysis");
    },
  });

  const onSubmit = async (data: MarketBasketFormValues) => {
    setIsSubmitting(true);

    const marketBasketData = {
      startDate: format(data.startDate, "yyyy-MM-dd"),
      endDate: format(data.endDate, "yyyy-MM-dd"),
      minSupport: data.minSupport,
      minConfidence: data.minConfidence,
    };

    try {
      await generateMutation.mutateAsync(marketBasketData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Start Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "PPP") : "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={(date) => setValue("startDate", date!)}
              />
            </PopoverContent>
          </Popover>
          {errors.startDate && (
            <p className="text-sm text-destructive">
              {errors.startDate.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>End Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "PPP") : "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={(date) => setValue("endDate", date!)}
              />
            </PopoverContent>
          </Popover>
          {errors.endDate && (
            <p className="text-sm text-destructive">{errors.endDate.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Minimum Support (%)</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            max="1"
            {...register("minSupport", { valueAsNumber: true })}
            placeholder="0.01"
          />
          {errors.minSupport && (
            <p className="text-sm text-destructive">
              {errors.minSupport.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Minimum Confidence (%)</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            max="1"
            {...register("minConfidence", { valueAsNumber: true })}
            placeholder="0.5"
          />
          {errors.minConfidence && (
            <p className="text-sm text-destructive">
              {errors.minConfidence.message}
            </p>
          )}
        </div>
      </div>

      <div className="bg-muted/50 p-4 rounded-lg">
        <h4 className="font-medium mb-2 flex items-center gap-2">
          <Network className="w-4 h-4" />
          About Market Basket Analysis
        </h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Discovers which products are frequently purchased together</li>
          <li>• Identifies association rules between products</li>
          <li>
            • Helps with product placement, promotions, and recommendations
          </li>
          <li>• Requires sufficient sales data for meaningful results</li>
          <li>• Recommended date range: 1-3 months for best results</li>
          <li>• Minimum support: Lower values include more itemsets</li>
          <li>• Minimum confidence: Higher values ensure stronger rules</li>
        </ul>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Generating..." : "Generate Analysis"}
        </Button>
      </div>
    </form>
  );
};

export default MarketBasketGenerator;
