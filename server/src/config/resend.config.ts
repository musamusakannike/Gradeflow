import { Resend } from "resend";
import { logger } from "../utils/logger.util";

let resendClient: Resend | null = null;

export const initializeResend = (): Resend | null => {
  if (resendClient) {
    return resendClient;
  }

  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    logger.warn(
      "Resend API key is not configured. Email sending will not work.",
    );
    return null;
  }

  resendClient = new Resend(apiKey);
  logger.info("Resend client initialized");
  return resendClient;
};

export const getResendClient = (): Resend | null => {
  if (!resendClient) {
    return initializeResend();
  }
  return resendClient;
};

export const resendConfig = {
  from: process.env.EMAIL_FROM || "noreply@gradeflow.com",
  appName: process.env.APP_NAME || "GradeFlow",
  appUrl: process.env.APP_URL || "http://localhost:3000",
};
