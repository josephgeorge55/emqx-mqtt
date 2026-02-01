import admin from "firebase-admin";

// Initialize Firebase Admin
// We expect the service account to be in environment variables or standard Google auth
if (!admin.apps.length) {
  try {
    // If FIREBASE_SERVICE_ACCOUNT is provided as a JSON string
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log("Firebase Admin initialized with FIREBASE_SERVICE_ACCOUNT");
    } else {
      // Fallback to default application credentials (GOOGLE_APPLICATION_CREDENTIALS)
      admin.initializeApp();
      console.log("Firebase Admin initialized with default credentials");
    }
  } catch (error) {
    console.error("Failed to initialize Firebase Admin:", error);
  }
}

export const firestore = admin.firestore();
