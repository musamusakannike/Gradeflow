import {
  Expo,
  ExpoPushMessage,
  ExpoPushTicket,
  ExpoPushReceipt,
} from "expo-server-sdk";
import { logger } from "../utils/logger.util";

let expoClient: Expo | null = null;

export const initializeExpo = (): Expo => {
  if (expoClient) {
    return expoClient;
  }

  const accessToken = process.env.EXPO_ACCESS_TOKEN;

  expoClient = new Expo({
    accessToken: accessToken || undefined,
  });

  logger.info("Expo Server SDK initialized");
  return expoClient;
};

export const getExpoClient = (): Expo => {
  if (!expoClient) {
    return initializeExpo();
  }
  return expoClient;
};

export const isValidExpoPushToken = (token: string): boolean => {
  return Expo.isExpoPushToken(token);
};

export interface PushNotificationResult {
  successful: ExpoPushTicket[];
  failed: { token: string; error: string }[];
}

export const sendPushNotifications = async (
  messages: ExpoPushMessage[],
): Promise<PushNotificationResult> => {
  const expo = getExpoClient();
  const result: PushNotificationResult = {
    successful: [],
    failed: [],
  };

  // Filter valid tokens
  const validMessages = messages.filter((message) => {
    if (typeof message.to === "string") {
      if (!Expo.isExpoPushToken(message.to)) {
        result.failed.push({
          token: message.to,
          error: "Invalid Expo push token",
        });
        return false;
      }
      return true;
    }
    return true;
  });

  if (validMessages.length === 0) {
    return result;
  }

  // Chunk messages for batch sending
  const chunks = expo.chunkPushNotifications(validMessages);

  for (const chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      result.successful.push(...ticketChunk);
    } catch (error) {
      logger.error("Error sending push notification chunk:", error);
      chunk.forEach((msg) => {
        result.failed.push({
          token: typeof msg.to === "string" ? msg.to : msg.to.join(", "),
          error: error instanceof Error ? error.message : "Unknown error",
        });
      });
    }
  }

  return result;
};

export const getPushNotificationReceipts = async (
  ticketIds: string[],
): Promise<{ [id: string]: ExpoPushReceipt }> => {
  const expo = getExpoClient();
  const receiptIdChunks = expo.chunkPushNotificationReceiptIds(ticketIds);
  const allReceipts: { [id: string]: ExpoPushReceipt } = {};

  for (const chunk of receiptIdChunks) {
    try {
      const receipts = await expo.getPushNotificationReceiptsAsync(chunk);
      Object.assign(allReceipts, receipts);
    } catch (error) {
      logger.error("Error getting push notification receipts:", error);
    }
  }

  return allReceipts;
};
