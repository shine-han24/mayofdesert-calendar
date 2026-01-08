import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Firebase 콘솔에서 복사한 설정 정보를 여기에 붙여넣으세요
const firebaseConfig = {
  apiKey: "AIzaSyDxvyW6JfTKlRPH-MDHU9tYTFiap0K4c90",
  authDomain: "desktop-calendar-49a8c.firebaseapp.com",
  projectId: "desktop-calendar-49a8c",
  storageBucket: "desktop-calendar-49a8c.firebasestorage.app",
  messagingSenderId: "736029797788",
  appId: "1:736029797788:web:9458b9ca67d482ef28ac59"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);

// Firestore 및 Auth 내보내기
export const db = getFirestore(app);
export const auth = getAuth(app);


