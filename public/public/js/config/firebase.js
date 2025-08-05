// js/config/firebase.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.0/firebase-app.js"
import { getAuth } from "https://www.gstatic.com/firebasejs/9.6.0/firebase-auth.js"
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.6.0/firebase-firestore.js"
import { getStorage } from "https://www.gstatic.com/firebasejs/9.6.0/firebase-storage.js"
import { getMessaging, isSupported } from "https://www.gstatic.com/firebasejs/9.6.0/firebase-messaging.js"

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBEWmvJgOjKhJGGGvGGvGGvGGvGGvGGvGG",
  authDomain: "organia-fertilizantes.firebaseapp.com",
  projectId: "organia-fertilizantes",
  storageBucket: "organia-fertilizantes.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdefghijklmnopqr",
  measurementId: "G-ABCDEFGHIJ",
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase services
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

// Initialize messaging only if supported
let messaging = null
isSupported()
  .then((supported) => {
    if (supported) {
      messaging = getMessaging(app)
    }
  })
  .catch((error) => {
    console.log("Firebase Messaging not supported:", error)
  })

export { messaging }

// Auth persistence
import { setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/9.6.0/firebase-auth.js"

setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log("Firebase Auth persistence set to LOCAL")
  })
  .catch((error) => {
    console.error("Error setting auth persistence:", error)
  })

// Export the app instance
export default app
