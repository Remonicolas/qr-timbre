import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app'
import { getMessaging } from 'firebase-admin/messaging'

const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')

const app =
  getApps().length > 0
    ? getApp()
    : initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
          privateKey,
        }),
      })

export const firebaseAdmin = {
  messaging: () => getMessaging(app),
}