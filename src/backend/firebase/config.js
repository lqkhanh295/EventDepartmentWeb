// Firebase Configuration
// Hướng dẫn setup Firebase:
// 1. Truy cập https://console.firebase.google.com/
// 2. Tạo project mới hoặc chọn project có sẵn
// 3. Vào Project Settings > General > Your apps
// 4. Click "Add app" > Web (</>)
// 5. Đặt tên app và click "Register app"
// 6. Copy các giá trị config và paste vào đây

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

// ⚠️ QUAN TRỌNG: Thay thế các giá trị dưới đây bằng config từ Firebase Console
const firebaseConfig = {
    apiKey: "AIzaSyAbzHxBVqfVwObXZL4qKGDgQPscSV7F0CE",
    authDomain: "csg-event-department.firebaseapp.com",
    projectId: "csg-event-department",
    storageBucket: "csg-event-department.firebasestorage.app",
    messagingSenderId: "445979925806",
    appId: "1:445979925806:web:3b82519cab891edf87eebf",
    measurementId: "G-7WY6XPTBNE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Storage
export const storage = getStorage(app);

// Initialize Auth
export const auth = getAuth(app);

export default app;

