"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CreditCard, Calendar, CheckCircle2, XCircle, Plus } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Label } from "../../components/ui/Label";
import { Separator } from "../../components/ui/Separator";
import { Badge } from "../../components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import toast from "react-hot-toast";

const paymentMethodSchema = z.object({
  cardNumber: z.string().min(16, "Card number must be 16 digits").max(19),
  expiryDate: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "Format: MM/YY"),
  cvv: z.string().min(3, "CVV must be 3 digits").max(4),
  cardholderName: z.string().min(2, "Cardholder name is required"),
  billingAddress: z.string().min(5, "Billing address is required"),
  zipCode: z.string().min(5, "Zip code is required"),
});

type PaymentMethodFormValues = z.infer<typeof paymentMethodSchema>;

const PaymentSettings = () => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);

  // Mock subscription data - in a real app, this would come from an API
  const [subscriptionStatus] = useState<"active" | "expired" | "trial">("active");
  const [subscriptionPlan] = useState("Premium");
  const [nextBillingDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
  const [paymentMethods] = useState([
    {
      id: "1",
      type: "Visa",
      last4: "4242",
      expiryDate: "12/25",
      isDefault: true,
    },
  ]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PaymentMethodFormValues>({
    resolver: zodResolver(paymentMethodSchema),
    defaultValues: {
      cardNumber: "",
      expiryDate: "",
      cvv: "",
      cardholderName: "",
      billingAddress: "",
      zipCode: "",
    },
  });

  const onSubmit = async (data: PaymentMethodFormValues) => {
    setIsSubmitting(true);
    try {
      // In a real app, this would call an API to save the payment method
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Payment method added successfully");
      setShowAddPayment(false);
      reset();
    } catch (error) {
      toast.error("Failed to add payment method");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(" ");
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\D/g, "");
    if (v.length >= 2) {
      return v.substring(0, 2) + "/" + v.substring(2, 4);
    }
    return v;
  };

  return (
    <div className="space-y-6">
      {/* Subscription Status */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">Subscription Status</h3>
          <p className="text-muted-foreground">
            Manage your subscription and billing information
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Current Plan</CardTitle>
              <Badge
                variant={
                  subscriptionStatus === "active"
                    ? "default"
                    : subscriptionStatus === "trial"
                    ? "secondary"
                    : "destructive"
                }
                className="flex items-center gap-1"
              >
                {subscriptionStatus === "active" ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : subscriptionStatus === "expired" ? (
                  <XCircle className="h-3 w-3" />
                ) : null}
                {subscriptionStatus.charAt(0).toUpperCase() + subscriptionStatus.slice(1)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{subscriptionPlan} Plan</p>
                <p className="text-sm text-muted-foreground">
                  Account: {user?.username}
                </p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Next billing date:</span>
              <span className="font-medium">
                {nextBillingDate.toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Payment Methods */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Payment Methods</h3>
            <p className="text-muted-foreground">
              Manage your payment methods for billing
            </p>
          </div>
          {!showAddPayment && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddPayment(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Payment Method
            </Button>
          )}
        </div>

        {paymentMethods.length > 0 && (
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <Card key={method.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <CreditCard className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{method.type} •••• {method.last4}</p>
                          {method.isDefault && (
                            <Badge variant="secondary" className="text-xs">
                              Default
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Expires {method.expiryDate}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!method.isDefault && (
                        <Button variant="outline" size="sm">
                          Set as Default
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        Remove
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {showAddPayment && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Add Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input
                    id="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    {...register("cardNumber", {
                      onChange: (e) => {
                        e.target.value = formatCardNumber(e.target.value);
                      },
                    })}
                  />
                  {errors.cardNumber && (
                    <p className="text-sm text-destructive">
                      {errors.cardNumber.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiryDate">Expiry Date</Label>
                    <Input
                      id="expiryDate"
                      placeholder="MM/YY"
                      maxLength={5}
                      {...register("expiryDate", {
                        onChange: (e) => {
                          e.target.value = formatExpiryDate(e.target.value);
                        },
                      })}
                    />
                    {errors.expiryDate && (
                      <p className="text-sm text-destructive">
                        {errors.expiryDate.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cvv">CVV</Label>
                    <Input
                      id="cvv"
                      type="password"
                      placeholder="123"
                      maxLength={4}
                      {...register("cvv")}
                    />
                    {errors.cvv && (
                      <p className="text-sm text-destructive">
                        {errors.cvv.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cardholderName">Cardholder Name</Label>
                  <Input
                    id="cardholderName"
                    placeholder="John Doe"
                    {...register("cardholderName")}
                  />
                  {errors.cardholderName && (
                    <p className="text-sm text-destructive">
                      {errors.cardholderName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="billingAddress">Billing Address</Label>
                  <Input
                    id="billingAddress"
                    placeholder="123 Main St"
                    {...register("billingAddress")}
                  />
                  {errors.billingAddress && (
                    <p className="text-sm text-destructive">
                      {errors.billingAddress.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zipCode">Zip Code</Label>
                  <Input
                    id="zipCode"
                    placeholder="12345"
                    maxLength={10}
                    {...register("zipCode")}
                  />
                  {errors.zipCode && (
                    <p className="text-sm text-destructive">
                      {errors.zipCode.message}
                    </p>
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddPayment(false);
                      reset();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Adding..." : "Add Payment Method"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>

      <Separator />

      {/* Billing History */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">Billing History</h3>
          <p className="text-muted-foreground">
            View and download your past invoices
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-muted-foreground">
              <p>No billing history available</p>
              <p className="text-sm mt-2">
                Your invoices will appear here once you have billing activity
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentSettings;


