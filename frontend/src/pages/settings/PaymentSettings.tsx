\"use client\";

import { useEffect, useMemo, useState } from \"react\";
import { Calendar, CheckCircle2, Loader2, XCircle } from \"lucide-react\";
import { useAuth } from \"../../context/AuthContext\";
import { Button } from \"../../components/ui/Button\";
import { Separator } from \"../../components/ui/Separator\";
import { Badge } from \"../../components/ui/Badge\";
import { Card, CardContent, CardHeader, CardTitle } from \"../../components/ui/Card\";
import toast from \"react-hot-toast\";
import {
  subscriptionService,
  type Subscription,
  type SubscriptionStatus,
} from \"../../services/subscriptionService\";

const formatDate = (value?: string) => {
  if (!value) return \"-\";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return \"-\";

  return date.toLocaleDateString(\"en-US\", {
    year: \"numeric\",
    month: \"long\",
    day: \"numeric\",
  });
};

const PaymentSettings = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const effectiveStatus: SubscriptionStatus = useMemo(() => {
    if (!subscription) return \"trial\";
    return subscription.status;
  }, [subscription]);

  const nextBillingDate = subscription?.currentPeriodEnd;

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const data = await subscriptionService.getCurrent();
        setSubscription(data);
      } catch (error) {
        console.error(\"Failed to fetch subscription\", error);
        toast.error(\"Failed to load subscription details\");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscription();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const txRef = params.get(\"tx_ref\");
    const status = params.get(\"status\");

    if (!txRef || status !== \"success\") {
      return;
    }

    const verify = async () => {
      setIsVerifying(true);
      try {
        const result = await subscriptionService.verify(txRef);
        setSubscription(result.subscription);
        toast.success(\"Subscription activated successfully\");

        params.delete(\"tx_ref\");
        params.delete(\"status\");
        const newQuery = params.toString();
        const newUrl = `${window.location.pathname}${newQuery ? `?${newQuery}` : \"\"}`;
        window.history.replaceState({}, \"\", newUrl);
      } catch (error) {
        console.error(\"Failed to verify payment\", error);
        toast.error(\"Failed to verify payment. Please contact support.\");
      } finally {
        setIsVerifying(false);
      }
    };

    verify();
  }, []);

  const handleManageSubscription = async () => {
    setIsCheckoutLoading(true);
    try {
      const { checkoutUrl } = await subscriptionService.createCheckout(\"premium\");
      window.location.href = checkoutUrl;
    } catch (error: any) {
      console.error(\"Failed to start checkout\", error);
      const message =
        error?.response?.data?.error ||
        error?.message ||
        \"Failed to start payment. Please try again.\";
      toast.error(message);
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  const isActive = effectiveStatus === \"active\";

  return (
    <div className=\"space-y-6\">
      <div className=\"space-y-4\">
        <div>
          <h3 className=\"text-lg font-medium\">Subscription Status</h3>
          <p className=\"text-muted-foreground\">
            Manage your subscription and billing via Chapa (test mode)
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className=\"flex items-center justify-between\">
              <CardTitle className=\"text-base\">Current Plan</CardTitle>
              <Badge
                variant={
                  effectiveStatus === \"active\"
                    ? \"default\"
                    : effectiveStatus === \"trial\"
                    ? \"secondary\"
                    : \"destructive\"
                }
                className=\"flex items-center gap-1\"
              >
                {effectiveStatus === \"active\" ? (
                  <CheckCircle2 className=\"h-3 w-3\" />
                ) : effectiveStatus === \"expired\" ? (
                  <XCircle className=\"h-3 w-3\" />
                ) : null}
                {effectiveStatus.charAt(0).toUpperCase() + effectiveStatus.slice(1)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className=\"space-y-4\">
            <div className=\"flex items-center justify-between\">
              <div>
                <p className=\"font-medium\">
                  {subscription?.plan ? `${subscription.plan} Plan` : \"Free Plan\"}
                </p>
                <p className=\"text-sm text-muted-foreground\">
                  Account: {user?.username}
                </p>
              </div>
              <Button
                size=\"sm\"
                onClick={handleManageSubscription}
                disabled={isCheckoutLoading || isLoading || isVerifying}
              >
                {isCheckoutLoading ? (
                  <span className=\"flex items-center gap-2\">
                    <Loader2 className=\"h-4 w-4 animate-spin\" />
                    Redirecting...
                  </span>
                ) : isActive ? (
                  \"Manage Billing\"
                ) : (
                  \"Subscribe with Chapa (Test)\"
                )}
              </Button>
            </div>

            <Separator />

            <div className=\"flex items-center gap-2 text-sm\">
              <Calendar className=\"h-4 w-4 text-muted-foreground\" />
              <span className=\"text-muted-foreground\">Next billing date:</span>
              <span className=\"font-medium\">
                {isLoading || isVerifying ? \"Loading...\" : formatDate(nextBillingDate)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      <div className=\"space-y-4\">
        <div>
          <h3 className=\"text-lg font-medium\">Billing History</h3>
          <p className=\"text-muted-foreground\">
            Billing history will be available once you start a subscription.
          </p>
        </div>

        <Card>
          <CardContent className=\"pt-6\">
            <div className=\"text-center py-8 text-muted-foreground\">
              {isLoading || isVerifying ? (
                <div className=\"flex flex-col items-center gap-2\">
                  <Loader2 className=\"h-5 w-5 animate-spin\" />
                  <p>Loading subscription details...</p>
                </div>
              ) : (
                <>
                  <p>No billing history available</p>
                  <p className=\"text-sm mt-2\">
                    Your invoices will appear here once you have billing activity.
                  </p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentSettings;

