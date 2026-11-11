// Firebase Console থেকে আপনার Web App-এর config এখানে বসান।
// এই config public; নিরাপত্তা নিশ্চিত হবে Firebase Authentication ও Firestore Rules দিয়ে।
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  appId: "YOUR_APP_ID"
};

// Firebase Authentication-এ তৈরি করা অ্যাডমিন ইমেইলটি এখানে লিখুন।
export const ADMIN_EMAIL = "YOUR_ADMIN_EMAIL@example.com";
