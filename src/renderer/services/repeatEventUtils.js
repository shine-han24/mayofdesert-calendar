// src/renderer/services/repeatEventUtils.js

/**
 * 반복 일정을 주어진 기간 내의 모든 발생 일정으로 확장
 * @param {Array} events - 원본 일정 배열
 * @param {Date} startDate - 조회 시작 날짜
 * @param {Date} endDate - 조회 종료 날짜
 * @returns {Array} - 확장된 일정 배열
 */
export const expandRepeatEvents = (events, startDate, endDate) => {
  const expandedEvents = [];

  events.forEach(event => {
    if (!event.repeatType || event.repeatType === 'none') {
      // 반복 없는 일정은 그대로 추가
      expandedEvents.push(event);
      return;
    }

    // 반복 일정 생성
    const occurrences = generateOccurrences(event, startDate, endDate);
    expandedEvents.push(...occurrences);
  });

  return expandedEvents;
};

/**
 * 반복 일정의 모든 발생을 생성
 */
const generateOccurrences = (event, viewStart, viewEnd) => {
  const occurrences = [];
  const originalDate = new Date(event.date);
  const repeatEndDate = event.repeatEndDate ? new Date(event.repeatEndDate) : viewEnd;
  const excludedDates = event.excludedDates || [];
  
  let currentDate = new Date(originalDate);

  // 최대 1000개로 제한 (무한 루프 방지)
  let count = 0;
  const maxOccurrences = 1000;

  while (currentDate <= repeatEndDate && currentDate <= viewEnd && count < maxOccurrences) {
    // viewStart보다 크거나 같은 날짜만 추가
    if (currentDate >= viewStart) {
      const dateString = currentDate.toISOString().split('T')[0];
      
      // 제외된 날짜가 아닌 경우만 추가
      if (!excludedDates.includes(dateString)) {
        occurrences.push({
          ...event,
          id: `${event.id}_${currentDate.toISOString()}`, // 고유 ID 생성
          date: new Date(currentDate),
          isRepeatInstance: true, // 반복 인스턴스 표시
          originalEventId: event.id // 원본 일정 ID
        });
      }
    }

    // 다음 발생 날짜 계산
    currentDate = getNextOccurrence(currentDate, event.repeatType, originalDate);
    count++;
  }

  return occurrences;
};

/**
 * 다음 반복 발생 날짜 계산
 */
const getNextOccurrence = (currentDate, repeatType, originalDate) => {
  const next = new Date(currentDate);

  switch (repeatType) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;

    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;

    case 'biweekly':
      next.setDate(next.getDate() + 14);
      break;

    case 'monthly':
      // 같은 날짜로 다음 달
      next.setMonth(next.getMonth() + 1);
      // 날짜가 유효하지 않으면 (예: 1/31 -> 2/31) 해당 월의 마지막 날로
      if (next.getDate() !== originalDate.getDate()) {
        next.setDate(0); // 이전 달의 마지막 날
      }
      break;

    case 'yearly':
      next.setFullYear(next.getFullYear() + 1);
      // 윤년 처리 (2/29)
      if (next.getDate() !== originalDate.getDate()) {
        next.setDate(0);
      }
      break;

    default:
      return next;
  }

  return next;
};

/**
 * 반복 일정의 다음 발생 날짜 가져오기 (미리보기용)
 */
export const getNextOccurrencePreview = (event) => {
  if (!event.repeatType || event.repeatType === 'none') {
    return null;
  }

  const nextDate = getNextOccurrence(new Date(event.date), event.repeatType, new Date(event.date));
  
  return nextDate;
};

/**
 * 반복 유형을 사람이 읽을 수 있는 텍스트로 변환
 */
export const getRepeatTypeLabel = (repeatType, date) => {
  if (!date) return '반복 안 함';
  
  const eventDate = new Date(date);
  const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][eventDate.getDay()];
  const dayOfMonth = eventDate.getDate();
  const month = eventDate.getMonth() + 1;

  switch (repeatType) {
    case 'daily':
      return '매일';
    case 'weekly':
      return `매주 ${dayOfWeek}요일`;
    case 'biweekly':
      return `격주 ${dayOfWeek}요일`;
    case 'monthly':
      return `매월 ${dayOfMonth}일`;
    case 'yearly':
      return `매년 ${month}월 ${dayOfMonth}일`;
    default:
      return '반복 안 함';
  }
};