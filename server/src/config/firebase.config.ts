import admin from "firebase-admin";
import { logger } from "../utils/logger.util";

let firebaseApp: admin.app.App | null = null;

export const initializeFirebase = (): admin.app.App | null => {
  if (firebaseApp) {
    return firebaseApp;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  if (!projectId || !privateKey || !clientEmail) {
    logger.warn(
      "Firebase configuration is incomplete. Google authentication will not work.",
    );
    return null;
  }

  try {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        privateKey,
        clientEmail,
      }),
    });

    logger.info("Firebase Admin SDK initialized successfully");
    return firebaseApp;
  } catch (error) {
    logger.error("Error initializing Firebase Admin SDK:", error);
    return null;
  }
};

export const getFirebaseAuth = (): admin.auth.Auth | null => {
  const app = initializeFirebase();
  return app ? admin.auth(app) : null;
};

export const verifyGoogleToken = async (
  idToken: string,
): Promise<admin.auth.DecodedIdToken | null> => {
  const auth = getFirebaseAuth();

  if (!auth) {
    logger.error("Firebase Auth is not initialized");
    return null;
  }

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    logger.error("Error verifying Google token:", error);
    return null;
  }
};
