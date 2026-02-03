import api from "./api";

export type SubscriptionStatus =
  | "trial"
  | "active"
  | "expired"
  | "canceled"
  | "past_due";

export interface Subscription {
  _id: string;
  user: string;
  plan: string;
  status: SubscriptionStatus;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  chapaTxRef?: string;
  chapaPaymentStatus?: string;
  createdAt: string;
  updatedAt: string;
}

interface CheckoutResponse {
  checkoutUrl: string;
  txRef: string;
}

interface VerifyResponse {
  subscription: Subscription;
}

export const subscriptionService = {
  getCurrent: async (): Promise<Subscription | null> => {
    const response = await api.get<Subscription | null>("/subscription");
    return response.data;
  },

  createCheckout: async (plan: string): Promise<CheckoutResponse> => {
    const response = await api.post<CheckoutResponse>("/subscription/checkout", {
      plan,
    });
    return response.data;
  },

  verify: async (txRef: string): Promise<VerifyResponse> => {
    const response = await api.get<VerifyResponse>(`/subscription/verify/${txRef}`);
    return response.data;
  },
};


