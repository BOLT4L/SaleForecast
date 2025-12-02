import { format, parseISO } from "date-fns";
import { Badge } from "../../components/ui/Badge";
import { Separator } from "../../components/ui/Separator";
import type { Sale } from "../../types/sale";

interface SaleDetailsProps {
  sale: Sale;
}

const SaleDetails = ({ sale }: SaleDetailsProps) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium text-muted-foreground">Sale Date</h4>
          <p className="text-lg">
            {format(parseISO(sale.date), "MMMM dd, yyyy")}
          </p>
        </div>
        <div>
          <h4 className="font-medium text-muted-foreground">Total Amount</h4>
          <p className="text-lg font-semibold">
            ${sale.totalAmount.toFixed(2)}
          </p>
        </div>
        <div>
          <h4 className="font-medium text-muted-foreground">Promotion</h4>
          <Badge variant={sale.promotion ? "success" : "secondary"}>
            {sale.promotion ? "Yes" : "No"}
          </Badge>
        </div>
        <div>
          <h4 className="font-medium text-muted-foreground">Created</h4>
          <p>{format(parseISO(sale.createdAt), "MMM dd, yyyy 'at' h:mm a")}</p>
        </div>
      </div>

      <Separator />

      <div>
        <h4 className="font-medium mb-4">Items ({sale.items.length})</h4>
        <div className="space-y-3">
          {sale.items.map((item, index) => (
            <div
              key={index}
              className="flex justify-between items-center p-3 bg-muted/50 rounded-lg"
            >
              <div>
                <p className="font-medium">{item.productName || "Unknown"}</p>
                <p className="text-sm text-muted-foreground">
                  Quantity: {item.quantity} | Promotion:{" "}
                  {item.promotion ? "Yes" : "No"}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium">${item.price.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">
                  Total: ${(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SaleDetails;
