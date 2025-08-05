import { initializeApp, getApps, type FirebaseApp } from "firebase/app"
import { getAuth, type Auth, connectAuthEmulator } from "firebase/auth"
import { getFirestore, type Firestore, connectFirestoreEmulator } from "firebase/firestore"
import { getStorage, type FirebaseStorage, connectStorageEmulator } from "firebase/storage"
import { getMessaging, type Messaging, isSupported } from "firebase/messaging"
import { getAnalytics, type Analytics, isSupported as isAnalyticsSupported } from "firebase/analytics"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

// Validate required config
const requiredConfig = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
]

for (const key of requiredConfig) {
  if (!process.env[key]) {
    throw new Error(`Missing required Firebase config: ${key}`)
  }
}

// Initialize Firebase
let app: FirebaseApp
let auth: Auth
let db: Firestore
let storage: FirebaseStorage
let messaging: Messaging | null = null
let analytics: Analytics | null = null

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig)
} else {
  app = getApps()[0]
}

// Initialize services
auth = getAuth(app)
db = getFirestore(app)
storage = getStorage(app)

// Initialize messaging only in browser and if supported
if (typeof window !== "undefined") {
  isSupported()
    .then((supported) => {
      if (supported) {
        messaging = getMessaging(app)
      }
    })
    .catch(console.error)

  // Initialize analytics only in browser and if supported
  isAnalyticsSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(app)
      }
    })
    .catch(console.error)
}

// Connect to emulators in development
if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
  try {
    // Only connect if not already connected
    if (!auth.config.emulator) {
      connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true })
    }

    // Check if Firestore emulator is not already connected
    if (!(db as any)._delegate._databaseId.projectId.includes("demo-")) {
      connectFirestoreEmulator(db, "localhost", 8080)
    }

    if (!storage.app.options.storageBucket?.includes("demo-")) {
      connectStorageEmulator(storage, "localhost", 9199)
    }
  } catch (error) {
    // Emulators might already be connected
    console.log("Firebase emulators connection info:", error)
  }
}

export { app, auth, db, storage, messaging, analytics }
export default app
