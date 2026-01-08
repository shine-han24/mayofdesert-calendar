// src/renderer/services/eventService.js
import { 
  collection, 
  doc, 
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  query,
  where,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';

// 일정 추가
export const createEvent = async (calendarId, eventData) => {
  try {
    const eventsRef = collection(db, 'calendars', calendarId, 'events');
    
    const docRef = await addDoc(eventsRef, {
      title: eventData.title,
      description: eventData.description || '',
      color: eventData.color,
      startDate: Timestamp.fromDate(eventData.date),
      endDate: Timestamp.fromDate(eventData.date), // 같은 날짜
      calendarId: calendarId,
      createdBy: eventData.createdBy,
      createdAt: Timestamp.now(),
      showDday: eventData.showDday || false,  // 디데이 표시 여부
      repeatType: eventData.repeatType || 'none',  // 반복 유형
      repeatEndDate: eventData.repeatEndDate ? Timestamp.fromDate(new Date(eventData.repeatEndDate)) : null,  // 반복 종료일
      excludedDates: eventData.excludedDates || []  // 제외된 날짜 배열
    });

    return {
      id: docRef.id,
      ...eventData,
      calendarId: calendarId
    };
  } catch (error) {
    console.error('Error creating event:', error);
    throw new Error('일정 생성에 실패했습니다.');
  }
};

// 일정 수정
export const updateEvent = async (calendarId, eventId, eventData) => {
  try {
    const eventRef = doc(db, 'calendars', calendarId, 'events', eventId);
    
    await updateDoc(eventRef, {
      title: eventData.title,
      description: eventData.description || '',
      color: eventData.color,
      startDate: Timestamp.fromDate(eventData.date),
      endDate: Timestamp.fromDate(eventData.date),
      showDday: eventData.showDday || false,  // 디데이 표시 여부
      repeatType: eventData.repeatType || 'none',  // 반복 유형
      repeatEndDate: eventData.repeatEndDate ? Timestamp.fromDate(new Date(eventData.repeatEndDate)) : null,  // 반복 종료일
      excludedDates: eventData.excludedDates || [],  // 제외된 날짜 배열
      updatedAt: Timestamp.now()
    });

    return {
      id: eventId,
      ...eventData,
      calendarId: calendarId
    };
  } catch (error) {
    console.error('Error updating event:', error);
    throw new Error('일정 수정에 실패했습니다.');
  }
};

// 일정 삭제
export const deleteEvent = async (calendarId, eventId) => {
  try {
    const eventRef = doc(db, 'calendars', calendarId, 'events', eventId);
    await deleteDoc(eventRef);
  } catch (error) {
    console.error('Error deleting event:', error);
    throw new Error('일정 삭제에 실패했습니다.');
  }
};

// 특정 캘린더의 모든 일정 실시간 구독
export const subscribeToCalendarEvents = (calendarId, callback) => {
  const eventsRef = collection(db, 'calendars', calendarId, 'events');
  
  return onSnapshot(eventsRef, (snapshot) => {
    const events = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      events.push({
        id: doc.id,
        title: data.title,
        description: data.description || '',
        color: data.color,
        date: data.startDate.toDate(),
        calendarId: calendarId,
        createdBy: data.createdBy,
        createdAt: data.createdAt?.toDate(),
        showDday: data.showDday || false,  // 디데이 표시 여부
        repeatType: data.repeatType || 'none',  // 반복 유형
        repeatEndDate: data.repeatEndDate ? data.repeatEndDate.toDate() : null,  // 반복 종료일
        excludedDates: data.excludedDates || []  // 제외된 날짜 배열
      });
    });
    callback(events);
  }, (error) => {
    console.error('Error listening to events:', error);
  });
};

// 여러 캘린더의 일정 실시간 구독
export const subscribeToMultipleCalendars = (calendarIds, callback) => {
  if (calendarIds.length === 0) {
    callback([]);
    return () => {};
  }

  const unsubscribers = [];
  const allEvents = {};

  calendarIds.forEach((calendarId) => {
    const unsubscribe = subscribeToCalendarEvents(calendarId, (events) => {
      allEvents[calendarId] = events;
      
      // 모든 캘린더의 일정을 합쳐서 콜백 호출
      const combined = Object.values(allEvents).flat();
      callback(combined);
    });
    
    unsubscribers.push(unsubscribe);
  });

  // 모든 구독 취소 함수 반환
  return () => {
    unsubscribers.forEach(unsub => unsub());
  };
};

// 반복 일정 부분 업데이트 (excludedDates, repeatEndDate만 수정)
export const updateRepeatEvent = async (calendarId, eventId, updates) => {
  try {
    const eventRef = doc(db, 'calendars', calendarId, 'events', eventId);
    
    // repeatEndDate가 있으면 Timestamp로 변환
    const processedUpdates = { ...updates };
    if (updates.repeatEndDate) {
      processedUpdates.repeatEndDate = Timestamp.fromDate(new Date(updates.repeatEndDate));
    }
    
    await updateDoc(eventRef, {
      ...processedUpdates,
      updatedAt: Timestamp.now()
    });

    return true;
  } catch (error) {
    console.error('Error updating repeat event:', error);
    throw new Error('반복 일정 업데이트에 실패했습니다.');
  }
};

// 특정 이벤트 가져오기
export const getEvent = async (calendarId, eventId) => {
  try {
    const eventRef = doc(db, 'calendars', calendarId, 'events', eventId);
    const eventDoc = await getDoc(eventRef);
    
    if (!eventDoc.exists()) {
      throw new Error('일정을 찾을 수 없습니다.');
    }
    
    const data = eventDoc.data();
    return {
      id: eventDoc.id,
      title: data.title,
      description: data.description || '',
      color: data.color,
      date: data.startDate.toDate(),
      calendarId: calendarId,
      createdBy: data.createdBy,
      createdAt: data.createdAt?.toDate(),
      showDday: data.showDday || false,
      repeatType: data.repeatType || 'none',
      repeatEndDate: data.repeatEndDate ? data.repeatEndDate.toDate() : null,
      excludedDates: data.excludedDates || []
    };
  } catch (error) {
    console.error('Error getting event:', error);
    throw error;
  }
};