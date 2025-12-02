"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { productService } from "../../services/productService";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Label } from "../../components/ui/Label";
import { Textarea } from "../../components/ui/Textarea";
import type { Product, ProductInput } from "../../types/product";

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  price: z.number().min(0, "Price must be positive"),
  description: z.string().optional(),
  stockQuantity: z.number().min(0, "Stock quantity must be non-negative"),
  category: z.string().optional(),
  lowStockThreshold: z
    .number()
    .min(0, "Threshold must be non-negative")
    .optional(),
  reorderQuantity: z
    .number()
    .min(0, "Reorder quantity must be non-negative")
    .optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
  product?: Product | null;
  onSuccess: () => void;
}

const ProductForm = ({ product, onSuccess }: ProductFormProps) => {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name || "",
      price: product?.price || 0,
      description: product?.description || "",
      stockQuantity: product?.stockQuantity || 0,
      category: product?.category || "",
      lowStockThreshold: product?.lowStockThreshold || 10,
      reorderQuantity: product?.reorderQuantity || 50,
    },
  });

  const createMutation = useMutation({
    mutationFn: productService.createProduct,
    onSuccess: () => {
      toast.success("Product created successfully");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create product");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ProductInput> }) =>
      productService.updateProduct(id, data),
    onSuccess: () => {
      toast.success("Product updated successfully");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update product");
    },
  });

  const onSubmit = async (data: ProductFormValues) => {
    setIsSubmitting(true);

    const productData: ProductInput = {
      name: data.name,
      price: data.price,
      description: data.description,
      stockQuantity: data.stockQuantity,
      category: data.category,
      lowStockThreshold: data.lowStockThreshold,
      reorderQuantity: data.reorderQuantity,
    };

    try {
      if (product) {
        await updateMutation.mutateAsync({
          id: product._id,
          data: productData,
        });
      } else {
        await createMutation.mutateAsync(productData);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Product Name</Label>
          <Input id="name" {...register("name")} />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">Price</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            min="0"
            {...register("price", { valueAsNumber: true })}
          />
          {errors.price && (
            <p className="text-sm text-destructive">{errors.price.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="stockQuantity">Stock Quantity</Label>
          <Input
            id="stockQuantity"
            type="number"
            min="0"
            {...register("stockQuantity", { valueAsNumber: true })}
          />
          {errors.stockQuantity && (
            <p className="text-sm text-destructive">
              {errors.stockQuantity.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Input id="category" {...register("category")} />
          {errors.category && (
            <p className="text-sm text-destructive">
              {errors.category.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
          <Input
            id="lowStockThreshold"
            type="number"
            min="0"
            {...register("lowStockThreshold", { valueAsNumber: true })}
          />
          {errors.lowStockThreshold && (
            <p className="text-sm text-destructive">
              {errors.lowStockThreshold.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="reorderQuantity">Reorder Quantity</Label>
          <Input
            id="reorderQuantity"
            type="number"
            min="0"
            {...register("reorderQuantity", { valueAsNumber: true })}
          />
          {errors.reorderQuantity && (
            <p className="text-sm text-destructive">
              {errors.reorderQuantity.message}
            </p>
          )}
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" rows={4} {...register("description")} />
          {errors.description && (
            <p className="text-sm text-destructive">
              {errors.description.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Saving..."
            : product
            ? "Update Product"
            : "Create Product"}
        </Button>
      </div>
    </form>
  );
};

export default ProductForm;
