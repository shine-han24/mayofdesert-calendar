// src/renderer/services/calendarService.js
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  arrayUnion,
  query,
  where 
} from 'firebase/firestore';
import { db } from '../firebase';

// 랜덤 초대코드 생성 (6자리)
const generateInviteCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// 캘린더 색상 목록
const calendarColors = [
  '#3b82f6', // 파랑
  '#10b981', // 초록
  '#f59e0b', // 주황
  '#8b5cf6', // 보라
  '#ec4899', // 분홍
  '#ef4444', // 빨강
  '#06b6d4', // 시안
  '#84cc16', // 라임
];

// 사용자의 모든 캘린더 가져오기
export const getUserCalendars = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) return [];

    const calendarIds = userDoc.data().calendars || [];
    if (calendarIds.length === 0) return [];

    const calendars = [];
    for (const calendarId of calendarIds) {
      const calendarDoc = await getDoc(doc(db, 'calendars', calendarId));
      if (calendarDoc.exists()) {
        calendars.push({
          id: calendarDoc.id,
          ...calendarDoc.data(),
          memberCount: calendarDoc.data().members?.length || 1
        });
      }
    }

    return calendars;
  } catch (error) {
    console.error('Error getting calendars:', error);
    throw error;
  }
};

// 새 캘린더 만들기
export const createCalendar = async (userId, calendarName) => {
  try {
    const inviteCode = generateInviteCode();
    const calendarId = `calendar_${Date.now()}`;
    
    // 랜덤 색상 선택
    const color = calendarColors[Math.floor(Math.random() * calendarColors.length)];

    // 캘린더 문서 생성
    await setDoc(doc(db, 'calendars', calendarId), {
      name: calendarName,
      inviteCode: inviteCode,
      members: [userId],
      createdBy: userId,
      createdAt: new Date().toISOString(),
      color: color,
      isPersonal: false
    });

    // 사용자 문서에 캘린더 추가
    await updateDoc(doc(db, 'users', userId), {
      calendars: arrayUnion(calendarId)
    });

    return {
      id: calendarId,
      name: calendarName,
      inviteCode: inviteCode,
      members: [userId],
      createdBy: userId,
      color: color,
      memberCount: 1,
      isPersonal: false
    };
  } catch (error) {
    console.error('Error creating calendar:', error);
    throw new Error('캘린더 생성에 실패했습니다.');
  }
};

// 초대코드로 캘린더 참여하기
export const joinCalendarByCode = async (userId, inviteCode) => {
  try {
    console.log('1. 초대코드로 검색 시작:', inviteCode);
    
    // 초대코드로 캘린더 찾기
    const calendarsRef = collection(db, 'calendars');
    const q = query(calendarsRef, where('inviteCode', '==', inviteCode));
    
    console.log('2. 쿼리 실행 중...');
    const querySnapshot = await getDocs(q);
    console.log('3. 쿼리 완료, 결과 수:', querySnapshot.size);

    if (querySnapshot.empty) {
      console.log('4. 캘린더를 찾을 수 없음');
      throw new Error('유효하지 않은 초대코드입니다.');
    }

    const calendarDoc = querySnapshot.docs[0];
    const calendarId = calendarDoc.id;
    const calendarData = calendarDoc.data();
    
    console.log('5. 찾은 캘린더:', calendarId, calendarData);

    // 이미 참여한 캘린더인지 확인
    if (calendarData.members.includes(userId)) {
      console.log('6. 이미 참여한 캘린더');
      throw new Error('이미 참여한 캘린더입니다.');
    }

    console.log('7. 캘린더에 사용자 추가 시도...');
    // 캘린더에 사용자 추가
    await updateDoc(doc(db, 'calendars', calendarId), {
      members: arrayUnion(userId)
    });
    
    console.log('8. 사용자 문서 업데이트 시도...');
    // 사용자 문서에 캘린더 추가
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      console.log('8-1. 기존 사용자 문서 업데이트');
      await updateDoc(userRef, {
        calendars: arrayUnion(calendarId)
      });
    } else {
      console.log('8-2. 사용자 문서가 없어서 생성');
      await setDoc(userRef, {
        calendars: [calendarId],
        createdAt: new Date().toISOString()
      });
    }

    console.log('9. 참여 완료!');
    return {
      id: calendarId,
      ...calendarData,
      memberCount: calendarData.members.length + 1
    };
  } catch (error) {
    console.error('Error joining calendar:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    throw error;
  }
};

// 특정 캘린더 정보 가져오기
export const getCalendar = async (calendarId) => {
  try {
    const calendarDoc = await getDoc(doc(db, 'calendars', calendarId));
    if (!calendarDoc.exists()) {
      throw new Error('캘린더를 찾을 수 없습니다.');
    }
    return {
      id: calendarDoc.id,
      ...calendarDoc.data()
    };
  } catch (error) {
    console.error('Error getting calendar:', error);
    throw error;
  }
};

// 캘린더 멤버 정보 가져오기
export const getCalendarMembers = async (calendarId) => {
  try {
    const calendarDoc = await getDoc(doc(db, 'calendars', calendarId));
    if (!calendarDoc.exists()) {
      throw new Error('캘린더를 찾을 수 없습니다.');
    }

    const calendarData = calendarDoc.data();
    const memberIds = calendarData.members || [];

    // 각 멤버의 정보 가져오기
    const members = [];
    for (const memberId of memberIds) {
      const userDoc = await getDoc(doc(db, 'users', memberId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        members.push({
          id: memberId,
          displayName: userData.displayName || userData.email || '이름 없음',
          email: userData.email
        });
      }
    }

    return members;
  } catch (error) {
    console.error('Error getting calendar members:', error);
    throw error;
  }
};
export const leaveCalendar = async (userId, calendarId) => {
  try {
    const calendarRef = doc(db, 'calendars', calendarId);
    const calendarDoc = await getDoc(calendarRef);
    
    if (!calendarDoc.exists()) {
      throw new Error('캘린더를 찾을 수 없습니다.');
    }

    const calendarData = calendarDoc.data();

    // 개인 캘린더는 삭제 불가
    if (calendarData.isPersonal) {
      throw new Error('개인 캘린더는 삭제할 수 없습니다.');
    }

    // 캘린더에서 사용자 제거
    await updateDoc(calendarRef, {
      members: calendarData.members.filter(id => id !== userId)
    });

    // 사용자 문서에서 캘린더 제거
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      await updateDoc(userRef, {
        calendars: userData.calendars.filter(id => id !== calendarId)
      });
    }

    return true;
  } catch (error) {
    console.error('Error leaving calendar:', error);
    throw error;
  }
};