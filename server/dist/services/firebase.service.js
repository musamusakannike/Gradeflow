"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.firebaseService = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const firebase_config_1 = require("../config/firebase.config");
const errors_util_1 = require("../utils/errors.util");
const logger_util_1 = require("../utils/logger.util");
// Initialize Firebase
(0, firebase_config_1.initializeFirebase)();
/**
 * Firebase Service
 * Handles Google authentication verification
 */
class FirebaseService {
    /**
     * Verify Google ID token
     */
    async verifyGoogleToken(idToken) {
        try {
            const decodedToken = await firebase_admin_1.default.auth().verifyIdToken(idToken);
            return {
                uid: decodedToken.uid,
                email: decodedToken.email || "",
                emailVerified: decodedToken.email_verified || false,
                displayName: decodedToken.name,
                photoURL: decodedToken.picture,
                phoneNumber: decodedToken.phone_number,
            };
        }
        catch (error) {
            logger_util_1.logger.error("Error verifying Google token:", error);
            throw new errors_util_1.AppError("Invalid or expired Google token", 401);
        }
    }
    /**
     * Get user by UID from Firebase
     */
    async getFirebaseUser(uid) {
        try {
            const userRecord = await firebase_admin_1.default.auth().getUser(uid);
            return userRecord;
        }
        catch (error) {
            logger_util_1.logger.error("Error getting Firebase user:", error);
            return null;
        }
    }
    /**
     * Delete Firebase user
     */
    async deleteFirebaseUser(uid) {
        try {
            await firebase_admin_1.default.auth().deleteUser(uid);
            return true;
        }
        catch (error) {
            logger_util_1.logger.error("Error deleting Firebase user:", error);
            return false;
        }
    }
    /**
     * Create custom token for user
     */
    async createCustomToken(uid, claims) {
        try {
            const customToken = await firebase_admin_1.default.auth().createCustomToken(uid, claims);
            return customToken;
        }
        catch (error) {
            logger_util_1.logger.error("Error creating custom token:", error);
            throw new errors_util_1.AppError("Failed to create custom token", 500);
        }
    }
    /**
     * Set custom claims for user
     */
    async setCustomClaims(uid, claims) {
        try {
            await firebase_admin_1.default.auth().setCustomUserClaims(uid, claims);
        }
        catch (error) {
            logger_util_1.logger.error("Error setting custom claims:", error);
            throw new errors_util_1.AppError("Failed to set custom claims", 500);
        }
    }
    /**
     * Revoke refresh tokens for user
     */
    async revokeRefreshTokens(uid) {
        try {
            await firebase_admin_1.default.auth().revokeRefreshTokens(uid);
        }
        catch (error) {
            logger_util_1.logger.error("Error revoking refresh tokens:", error);
            throw new errors_util_1.AppError("Failed to revoke refresh tokens", 500);
        }
    }
}
exports.firebaseService = new FirebaseService();
//# sourceMappingURL=firebase.service.js.map