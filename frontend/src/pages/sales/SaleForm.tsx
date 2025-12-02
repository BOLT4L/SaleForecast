import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { salesService } from "../../services/salesService";
import { productService } from "../../services/productService";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Label } from "../../components/ui/Label";
import { Switch } from "../../components/ui/Switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/Select";
import type { Sale, SaleInput } from "../../types/sale";
import type { Product } from "../../types/product";

const saleSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  promotion: z.boolean(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1, "Product is required"),
        quantity: z.number().min(1, "Quantity must be at least 1"),
        price: z.number().min(0, "Price must be positive"),
        promotion: z.boolean(),
      })
    )
    .min(1, "At least one item is required"),
});

type SaleFormValues = z.infer<typeof saleSchema>;

interface SaleFormProps {
  sale?: Sale | null;
  onSuccess: () => void;
}

const SaleForm = ({ sale, onSuccess }: SaleFormProps) => {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: products } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: () => productService.getProducts(),
  });

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SaleFormValues>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      date: sale?.date.split("T")[0] || new Date().toISOString().split("T")[0],
      promotion: sale?.promotion || false,
      items: sale?.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        promotion: item.promotion,
      })) || [{ productId: "", quantity: 1, price: 0, promotion: false }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchedItems = watch("items");

  const createMutation = useMutation({
    mutationFn: salesService.createSale,
    onSuccess: () => {
      toast.success("Sale created successfully");
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create sale");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: SaleInput }) =>
      salesService.updateSale(id, data),
    onSuccess: () => {
      toast.success("Sale updated successfully");
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update sale");
    },
  });

  const onSubmit = async (data: SaleFormValues) => {
    setIsSubmitting(true);

    const totalAmount = data.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const saleData: SaleInput = {
      date: data.date,
      totalAmount,
      promotion: data.promotion,
      items: data.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        promotion: item.promotion,
      })),
    };

    try {
      if (sale) {
        await updateMutation.mutateAsync({ id: sale.id, data: saleData });
      } else {
        await createMutation.mutateAsync(saleData);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProductChange = (index: number, productId: string) => {
    const product = products?.find((p) => p._id === productId);
    if (product) {
      setValue(`items.${index}.productId`, productId);
      setValue(`items.${index}.price`, product.price || 0);
      setValue(`items.${index}.promotion`, false);
    }
  };

  const totalAmount = watchedItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Sale Date</Label>
          <Input id="date" type="date" {...register("date")} />
          {errors.date && (
            <p className="text-sm text-destructive">{errors.date.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Promotion</Label>
          <div className="flex items-center space-x-2">
            <Switch
              id="promotion"
              {...register("promotion")}
              onCheckedChange={(checked) => setValue("promotion", checked)}
            />
            <span className="text-sm">This sale includes a promotion</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label>Items</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              append({ productId: "", quantity: 1, price: 0, promotion: false })
            }
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>

        {fields.map((field, index) => (
          <div key={field.id} className="grid grid-cols-12 gap-2 items-end">
            <div className="col-span-4">
              <Label>Product</Label>
              <Select
                value={watchedItems[index]?.productId || ""}
                onValueChange={(value) => handleProductChange(index, value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products?.map((product) => (
                    <SelectItem key={product._id} value={product._id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.items?.[index]?.productId && (
                <p className="text-sm text-destructive">
                  {errors.items[index]?.productId?.message}
                </p>
              )}
            </div>

            <div className="col-span-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                min="1"
                {...register(`items.${index}.quantity`, {
                  valueAsNumber: true,
                })}
              />
              {errors.items?.[index]?.quantity && (
                <p className="text-sm text-destructive">
                  {errors.items[index]?.quantity?.message}
                </p>
              )}
            </div>

            <div className="col-span-2">
              <Label>Price</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                {...register(`items.${index}.price`, { valueAsNumber: true })}
              />
              {errors.items?.[index]?.price && (
                <p className="text-sm text-destructive">
                  {errors.items[index]?.price?.message}
                </p>
              )}
            </div>

            <div className="col-span-2">
              <Label>Promotion</Label>
              <Switch
                id={`items.${index}.promotion`}
                {...register(`items.${index}.promotion`)}
                onCheckedChange={(checked) =>
                  setValue(`items.${index}.promotion`, checked)
                }
              />
            </div>

            <div className="col-span-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => remove(index)}
                disabled={fields.length === 1}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}

        {errors.items && (
          <p className="text-sm text-destructive">{errors.items.message}</p>
        )}
      </div>

      <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
        <span className="font-medium">Total Amount:</span>
        <span className="text-lg font-bold">${totalAmount.toFixed(2)}</span>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : sale ? "Update Sale" : "Create Sale"}
        </Button>
      </div>
    </form>
  );
};

export default SaleForm;
