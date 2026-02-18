import admin from 'firebase-admin'

let firebaseAuthInstance = null

const getFirebaseAuth = () => {
    if (firebaseAuthInstance) {
        return firebaseAuthInstance
    }

    const projectId = process.env.FIREBASE_PROJECT_ID
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

    if (!projectId || !clientEmail || !privateKey) {
        throw new Error('Firebase admin credentials are missing. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.')
    }

    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId,
                clientEmail,
                privateKey
            })
        })
    }

    firebaseAuthInstance = admin.auth()
    return firebaseAuthInstance
}

export default getFirebaseAuth
