import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

const hasCredentials = Boolean(
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  process.env.FIREBASE_PRIVATE_KEY
)

export let firebaseAdminReady = false

if (hasCredentials) {
  try {
    if (getApps().length === 0) {
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        })
      })
    }
    firebaseAdminReady = true
    console.log('Firebase Admin ready')
  } catch (error) {
    console.warn(`Firebase Admin is not available: ${error.message}`)
  }
} else {
  console.warn('Firebase Admin credentials are missing. Protected API routes are disabled.')
}

export { getAuth }
