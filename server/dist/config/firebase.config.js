"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyGoogleToken = exports.getFirebaseAuth = exports.initializeFirebase = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const logger_util_1 = require("../utils/logger.util");
let firebaseApp = null;
const initializeFirebase = () => {
    if (firebaseApp) {
        return firebaseApp;
    }
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    if (!projectId || !privateKey || !clientEmail) {
        logger_util_1.logger.warn("Firebase configuration is incomplete. Google authentication will not work.");
        return null;
    }
    try {
        firebaseApp = firebase_admin_1.default.initializeApp({
            credential: firebase_admin_1.default.credential.cert({
                projectId,
                privateKey,
                clientEmail,
            }),
        });
        logger_util_1.logger.info("Firebase Admin SDK initialized successfully");
        return firebaseApp;
    }
    catch (error) {
        logger_util_1.logger.error("Error initializing Firebase Admin SDK:", error);
        return null;
    }
};
exports.initializeFirebase = initializeFirebase;
const getFirebaseAuth = () => {
    const app = (0, exports.initializeFirebase)();
    return app ? firebase_admin_1.default.auth(app) : null;
};
exports.getFirebaseAuth = getFirebaseAuth;
const verifyGoogleToken = async (idToken) => {
    const auth = (0, exports.getFirebaseAuth)();
    if (!auth) {
        logger_util_1.logger.error("Firebase Auth is not initialized");
        return null;
    }
    try {
        const decodedToken = await auth.verifyIdToken(idToken);
        return decodedToken;
    }
    catch (error) {
        logger_util_1.logger.error("Error verifying Google token:", error);
        return null;
    }
};
exports.verifyGoogleToken = verifyGoogleToken;
//# sourceMappingURL=firebase.config.js.map