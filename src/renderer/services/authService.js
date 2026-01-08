// src/renderer/services/authService.js
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

// 회원가입
export const signUp = async (email, password, displayName) => {
  try {
    // Firebase Auth에 사용자 생성
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 프로필에 이름 설정
    await updateProfile(user, { displayName });

    // Firestore에 사용자 문서 생성
    await setDoc(doc(db, 'users', user.uid), {
      email: user.email,
      displayName: displayName,
      calendars: [], // 빈 캘린더 목록
      createdAt: new Date().toISOString()
    });

    // 개인 캘린더 자동 생성
    const personalCalendarRef = doc(db, 'calendars', `personal_${user.uid}`);
    await setDoc(personalCalendarRef, {
      name: '개인 일정',
      members: [user.uid],
      createdBy: user.uid,
      createdAt: new Date().toISOString(),
      isPersonal: true
    });

    // 사용자 문서에 개인 캘린더 추가
    await setDoc(doc(db, 'users', user.uid), {
      email: user.email,
      displayName: displayName,
      calendars: [`personal_${user.uid}`],
      createdAt: new Date().toISOString()
    });

    return user;
  } catch (error) {
    throw handleAuthError(error);
  }
};

// 로그인
export const signIn = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw handleAuthError(error);
  }
};

// 로그아웃
export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    throw handleAuthError(error);
  }
};

// 현재 사용자 가져오기
export const getCurrentUser = () => {
  return auth.currentUser;
};

// 사용자 상태 변경 리스너
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// 사용자 데이터 가져오기
export const getUserData = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting user data:', error);
    throw error;
  }
};

// 에러 메시지 한글화
const handleAuthError = (error) => {
  const errorMessages = {
    'auth/email-already-in-use': '이미 사용 중인 이메일입니다.',
    'auth/invalid-email': '유효하지 않은 이메일 형식입니다.',
    'auth/operation-not-allowed': '이메일/비밀번호 로그인이 비활성화되어 있습니다.',
    'auth/weak-password': '비밀번호가 너무 약합니다. 6자 이상 입력해주세요.',
    'auth/user-disabled': '비활성화된 계정입니다.',
    'auth/user-not-found': '등록되지 않은 이메일입니다.',
    'auth/wrong-password': '잘못된 비밀번호입니다.',
    'auth/invalid-credential': '이메일 또는 비밀번호가 올바르지 않습니다.',
    'auth/too-many-requests': '너무 많은 시도가 있었습니다. 잠시 후 다시 시도해주세요.'
  };

  const message = errorMessages[error.code] || error.message;
  return new Error(message);
};