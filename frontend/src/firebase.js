// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDK1PXf7gGu05b8GjwB7TD9l8Sxuwh5YWE",
  authDomain: "hrms-attendance-3195c.firebaseapp.com",
  projectId: "hrms-attendance-3195c",
  storageBucket: "hrms-attendance-3195c.firebasestorage.app",
  messagingSenderId: "704217410632",
  appId: "1:704217410632:web:57b646a0ca4478fe1f3c7d",
  measurementId: "G-QBCKQCQJQM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);