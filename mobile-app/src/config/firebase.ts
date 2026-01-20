// Firebase Configuration for Shadow Bean Co
// Project: Shadow Bean Co (shadown-bean-co)
// Google Analytics Property ID: 519498804

import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';

// Firebase configuration from Firebase Console
export const firebaseConfig = {
    apiKey: "AIzaSyChmu33MoD2veUF0FP7AGUAJIlfvwervN8",
    authDomain: "shadown-bean-co.firebaseapp.com",
    projectId: "shadown-bean-co",
    storageBucket: "shadown-bean-co.firebasestorage.app",
    messagingSenderId: "1061284172096",
    appId: "1:1061284172096:web:282878c9923fead539aaa5",
    measurementId: "G-M42CKD26L1"
};

// Google Analytics Property Details
export const analyticsConfig = {
    propertyId: "519498804",
    measurementId: "G-M42CKD26L1",
    streamName: "Shadow Bean Co App",
};

// Initialize Firebase (for web)
let app: ReturnType<typeof initializeApp> | null = null;
let analytics: ReturnType<typeof getAnalytics> | null = null;

export const initializeFirebase = async () => {
    if (!app) {
        app = initializeApp(firebaseConfig);

        // Analytics only works in browser environment
        const analyticsSupported = await isSupported();
        if (analyticsSupported) {
            analytics = getAnalytics(app);
        }
    }
    return { app, analytics };
};

export { app, analytics };
