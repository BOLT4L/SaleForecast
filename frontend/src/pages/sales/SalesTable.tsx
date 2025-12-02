import { useState } from "react";
import { format, parseISO } from "date-fns";
import { MoreHorizontal, Edit, Trash2, Eye } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { salesService } from "../../services/salesService";
import { useAuth } from "../../context/AuthContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/Table";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/DropdownMenu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/Dialog";
import SaleDetails from "./SaleDetails";
import type { Sale } from "../../types/sale";

interface SalesTableProps {
  sales: Sale[];
  isLoading: boolean;
  onEdit?: (sale: Sale) => void;
  onRefresh: () => void;
}

const SalesTable = ({
  sales,
  isLoading,
  onEdit,
  onRefresh,
}: SalesTableProps) => {
  const { user } = useAuth();
  const isAuthorized = ["Manager", "Admin", "Owner"].includes(user?.role || "");
  const queryClient = useQueryClient();
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: salesService.deleteSale,
    onSuccess: () => {
      toast.success("Sale deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      onRefresh();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete sale");
    },
  });

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this sale?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleViewDetails = (sale: Sale) => {
    setSelectedSale(sale);
    setShowDetails(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-muted animate-pulse rounded" />
        ))}
      </div>
    );
  }

  if (!sales.length) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No sales records found</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Total Amount</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Promotion</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales.map((sale) => (
              <TableRow key={sale._id}>
                <TableCell className="font-medium">
                  {format(parseISO(sale.date), "MMM dd, yyyy")}
                </TableCell>
                <TableCell>${sale.totalAmount.toFixed(2)}</TableCell>
                <TableCell>{sale.items.length} items</TableCell>
                <TableCell>
                  <Badge variant={sale.promotion ? "success" : "secondary"}>
                    {sale.promotion ? "Yes" : "No"}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {format(parseISO(sale.createdAt), "MMM dd, yyyy")}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleViewDetails(sale)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      {isAuthorized && onEdit && (
                        <DropdownMenuItem onClick={() => onEdit(sale)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                      )}
                      {isAuthorized && (
                        <DropdownMenuItem
                          onClick={() => handleDelete(sale._id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sale Details</DialogTitle>
          </DialogHeader>
          {selectedSale && <SaleDetails sale={selectedSale} />}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SalesTable;
