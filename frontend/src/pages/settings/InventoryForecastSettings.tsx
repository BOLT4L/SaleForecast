import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { settingsService } from "../../services/settingsService";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Label } from "../../components/ui/Label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/Select";
import { Separator } from "../../components/ui/Separator";
import { Switch } from "../../components/ui/Switch";

const inventorySettingsSchema = z.object({
  lowStockThreshold: z
    .number()
    .min(0, "Threshold must be non-negative")
    .optional(),
  reorderQuantity: z
    .number()
    .min(0, "Quantity must be non-negative")
    .optional(),
  category: z.string().optional(),
});

const forecastSettingsSchema = z.object({
  features: z.object({
    seasonality: z.enum(["None", "Weekly", "Monthly", "Yearly"]).optional(),
    promotion: z.boolean().optional(),
    laggedSales: z
      .number()
      .min(0, "Lagged sales must be non-negative")
      .optional(),
    economicTrend: z.enum(["Stable", "Growth", "Decline"]).optional(),
  }),
});

const retrainForecastSchema = z
  .object({
    forecastPeriod: z.enum(["Daily", "Weekly", "Monthly"]),
    modelType: z.enum(["ARIMA", "RandomForest"]),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
  })
  .refine((data) => new Date(data.startDate) < new Date(data.endDate), {
    message: "Start date must be before end date",
    path: ["endDate"],
  });

type InventorySettingsForm = z.infer<typeof inventorySettingsSchema>;
type ForecastSettingsForm = z.infer<typeof forecastSettingsSchema>;
type RetrainForecastForm = z.infer<typeof retrainForecastSchema>;

const InventoryForecastSettings = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inventory settings form
  const inventoryForm = useForm<InventorySettingsForm>({
    resolver: zodResolver(inventorySettingsSchema),
    defaultValues: {
      lowStockThreshold: undefined,
      reorderQuantity: undefined,
      category: "",
    },
  });

  // Forecast settings form
  const forecastForm = useForm<ForecastSettingsForm>({
    resolver: zodResolver(forecastSettingsSchema),
    defaultValues: {
      features: {
        seasonality: "None",
        promotion: false,
        laggedSales: 0,
        economicTrend: "Stable",
      },
    },
  });

  // Retrain forecast form
  const retrainForm = useForm<RetrainForecastForm>({
    resolver: zodResolver(retrainForecastSchema),
    defaultValues: {
      forecastPeriod: "Monthly",
      modelType: "RandomForest",
      startDate: "",
      endDate: "",
    },
  });

  const inventoryMutation = useMutation({
    mutationFn: settingsService.updateInventorySettings,
    onSuccess: (data) => {
      toast.success(`Updated settings for ${data.modifiedCount} products`);
      inventoryForm.reset();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update inventory settings");
    },
  });

  const forecastMutation = useMutation({
    mutationFn: settingsService.updateForecastSettings,
    onSuccess: () => {
      toast.success("Forecast settings updated successfully");
      forecastForm.reset();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update forecast settings");
    },
  });

  const retrainMutation = useMutation({
    mutationFn: settingsService.retrainForecast,
    onSuccess: () => {
      toast.success("Forecast retrained successfully");
      retrainForm.reset();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to retrain forecast");
    },
  });

  const onInventorySubmit = async (data: InventorySettingsForm) => {
    setIsSubmitting(true);
    try {
      await inventoryMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onForecastSubmit = async (data: ForecastSettingsForm) => {
    setIsSubmitting(true);
    try {
      await forecastMutation.mutateAsync(data as any);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onRetrainSubmit = async (data: RetrainForecastForm) => {
    setIsSubmitting(true);
    try {
      await retrainMutation.mutateAsync(data as any);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Inventory Settings</h3>
        <p className="text-muted-foreground">
          Configure inventory management settings
        </p>
      </div>
      <form
        onSubmit={inventoryForm.handleSubmit(onInventorySubmit)}
        className="space-y-4"
      >
        <div className="space-y-2">
          <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
          <Input
            id="lowStockThreshold"
            type="number"
            {...inventoryForm.register("lowStockThreshold", {
              valueAsNumber: true,
            })}
          />
          {inventoryForm.formState.errors.lowStockThreshold && (
            <p className="text-sm text-destructive">
              {inventoryForm.formState.errors.lowStockThreshold.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="reorderQuantity">Reorder Quantity</Label>
          <Input
            id="reorderQuantity"
            type="number"
            {...inventoryForm.register("reorderQuantity", {
              valueAsNumber: true,
            })}
          />
          {inventoryForm.formState.errors.reorderQuantity && (
            <p className="text-sm text-destructive">
              {inventoryForm.formState.errors.reorderQuantity.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Category (Optional)</Label>
          <Input id="category" {...inventoryForm.register("category")} />
        </div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Inventory Settings"}
        </Button>
      </form>

      <Separator />

      <div>
        <h3 className="text-lg font-medium">Forecast Settings</h3>
        <p className="text-muted-foreground">
          Configure forecast model features
        </p>
      </div>
      <form
        onSubmit={forecastForm.handleSubmit(onForecastSubmit)}
        className="space-y-4"
      >
        <div className="space-y-2">
          <Label htmlFor="seasonality">Seasonality</Label>
          <Select
            onValueChange={(value) =>
              forecastForm.setValue("features.seasonality", value as any)
            }
            defaultValue={forecastForm.getValues("features.seasonality")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select seasonality" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="None">None</SelectItem>
              <SelectItem value="Weekly">Weekly</SelectItem>
              <SelectItem value="Monthly">Monthly</SelectItem>
              <SelectItem value="Yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="promotion">Include Promotions</Label>
          <Switch
            id="promotion"
            checked={forecastForm.getValues("features.promotion")}
            onCheckedChange={(checked) =>
              forecastForm.setValue("features.promotion", checked)
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="laggedSales">Lagged Sales</Label>
          <Input
            id="laggedSales"
            type="number"
            {...forecastForm.register("features.laggedSales", {
              valueAsNumber: true,
            })}
          />
          {forecastForm.formState.errors.features?.laggedSales && (
            <p className="text-sm text-destructive">
              {forecastForm.formState.errors.features.laggedSales.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="economicTrend">Economic Trend</Label>
          <Select
            onValueChange={(value) =>
              forecastForm.setValue("features.economicTrend", value as any)
            }
            defaultValue={forecastForm.getValues("features.economicTrend")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select economic trend" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Stable">Stable</SelectItem>
              <SelectItem value="Growth">Growth</SelectItem>
              <SelectItem value="Decline">Decline</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Forecast Settings"}
        </Button>
      </form>

      <Separator />

      <div>
        <h3 className="text-lg font-medium">Retrain Forecast</h3>
        <p className="text-muted-foreground">
          Retrain the forecast model with new parameters
        </p>
      </div>
      <form
        onSubmit={retrainForm.handleSubmit(onRetrainSubmit)}
        className="space-y-4"
      >
        <div className="space-y-2">
          <Label htmlFor="forecastPeriod">Forecast Period</Label>
          <Select
            onValueChange={(value) =>
              retrainForm.setValue("forecastPeriod", value as any)
            }
            defaultValue={retrainForm.getValues("forecastPeriod")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select forecast period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Daily">Daily</SelectItem>
              <SelectItem value="Weekly">Weekly</SelectItem>
              <SelectItem value="Monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="modelType">Model Type</Label>
          <Select
            onValueChange={(value) =>
              retrainForm.setValue("modelType", value as any)
            }
            defaultValue={retrainForm.getValues("modelType")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select model type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ARIMA">ARIMA</SelectItem>
              <SelectItem value="RandomForest">RandomForest</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date</Label>
          <Input
            id="startDate"
            type="date"
            {...retrainForm.register("startDate")}
          />
          {retrainForm.formState.errors.startDate && (
            <p className="text-sm text-destructive">
              {retrainForm.formState.errors.startDate.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">End Date</Label>
          <Input
            id="endDate"
            type="date"
            {...retrainForm.register("endDate")}
          />
          {retrainForm.formState.errors.endDate && (
            <p className="text-sm text-destructive">
              {retrainForm.formState.errors.endDate.message}
            </p>
          )}
        </div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Retraining..." : "Retrain Forecast"}
        </Button>
      </form>
    </div>
  );
};

export default InventoryForecastSettings;
