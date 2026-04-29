import axios, { AxiosInstance } from "axios";
import { logger } from "../utils/logger.util";

const PAYSTACK_BASE_URL = "https://api.paystack.co";

let paystackClient: AxiosInstance | null = null;

export const initializePaystack = (): AxiosInstance => {
  if (paystackClient) {
    return paystackClient;
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!secretKey) {
    logger.warn(
      "Paystack secret key is not configured. Payments will not work.",
    );
  }

  paystackClient = axios.create({
    baseURL: PAYSTACK_BASE_URL,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
  });

  // Response interceptor for error handling
  paystackClient.interceptors.response.use(
    (response) => response,
    (error) => {
      logger.error("Paystack API Error:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      return Promise.reject(error);
    },
  );

  logger.info("Paystack client initialized");
  return paystackClient;
};

export const getPaystackClient = (): AxiosInstance => {
  if (!paystackClient) {
    return initializePaystack();
  }
  return paystackClient;
};

export const paystackConfig = {
  publicKey: process.env.PAYSTACK_PUBLIC_KEY || "",
  secretKey: process.env.PAYSTACK_SECRET_KEY || "",
  webhookSecret: process.env.PAYSTACK_WEBHOOK_SECRET || "",
  currency: "NGN",
  channels: ["card", "bank", "ussd", "bank_transfer"] as const,
};

// Paystack API Types
export interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    domain: string;
    status: "success" | "failed" | "abandoned";
    reference: string;
    amount: number;
    currency: string;
    channel: string;
    paid_at: string;
    customer: {
      id: number;
      email: string;
      first_name: string;
      last_name: string;
    };
    metadata: Record<string, unknown>;
  };
}

export interface PaystackWebhookEvent {
  event: string;
  data: {
    id: number;
    reference: string;
    amount: number;
    currency: string;
    status: string;
    customer: {
      email: string;
    };
    metadata: Record<string, unknown>;
  };
}
