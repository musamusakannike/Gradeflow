import admin from "firebase-admin";
import { initializeFirebase } from "../config/firebase.config";
import { AppError } from "../utils/errors.util";
import { logger } from "../utils/logger.util";

// Initialize Firebase
initializeFirebase();

export interface GoogleUserInfo {
  uid: string;
  email: string;
  emailVerified: boolean;
  displayName?: string;
  photoURL?: string;
  phoneNumber?: string;
}

/**
 * Firebase Service
 * Handles Google authentication verification
 */
class FirebaseService {
  /**
   * Verify Google ID token
   */
  async verifyGoogleToken(idToken: string): Promise<GoogleUserInfo> {
    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);

      return {
        uid: decodedToken.uid,
        email: decodedToken.email || "",
        emailVerified: decodedToken.email_verified || false,
        displayName: decodedToken.name,
        photoURL: decodedToken.picture,
        phoneNumber: decodedToken.phone_number,
      };
    } catch (error) {
      logger.error("Error verifying Google token:", error);
      throw new AppError("Invalid or expired Google token", 401);
    }
  }

  /**
   * Get user by UID from Firebase
   */
  async getFirebaseUser(uid: string): Promise<admin.auth.UserRecord | null> {
    try {
      const userRecord = await admin.auth().getUser(uid);
      return userRecord;
    } catch (error) {
      logger.error("Error getting Firebase user:", error);
      return null;
    }
  }

  /**
   * Delete Firebase user
   */
  async deleteFirebaseUser(uid: string): Promise<boolean> {
    try {
      await admin.auth().deleteUser(uid);
      return true;
    } catch (error) {
      logger.error("Error deleting Firebase user:", error);
      return false;
    }
  }

  /**
   * Create custom token for user
   */
  async createCustomToken(uid: string, claims?: object): Promise<string> {
    try {
      const customToken = await admin.auth().createCustomToken(uid, claims);
      return customToken;
    } catch (error) {
      logger.error("Error creating custom token:", error);
      throw new AppError("Failed to create custom token", 500);
    }
  }

  /**
   * Set custom claims for user
   */
  async setCustomClaims(uid: string, claims: object): Promise<void> {
    try {
      await admin.auth().setCustomUserClaims(uid, claims);
    } catch (error) {
      logger.error("Error setting custom claims:", error);
      throw new AppError("Failed to set custom claims", 500);
    }
  }

  /**
   * Revoke refresh tokens for user
   */
  async revokeRefreshTokens(uid: string): Promise<void> {
    try {
      await admin.auth().revokeRefreshTokens(uid);
    } catch (error) {
      logger.error("Error revoking refresh tokens:", error);
      throw new AppError("Failed to revoke refresh tokens", 500);
    }
  }
}

export const firebaseService = new FirebaseService();
