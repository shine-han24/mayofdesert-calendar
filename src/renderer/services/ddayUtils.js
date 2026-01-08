// src/renderer/services/ddayUtils.js

/**
 * 디데이 계산 함수
 * @param {Date|string} targetDate - 목표 날짜
 * @returns {string} - 디데이 문자열 (예: "D-7", "D-Day", "D+3")
 */
export const calculateDday = (targetDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);
  
  const diffTime = target - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'D-Day';
  if (diffDays > 0) return `D-${diffDays}`;
  return `D+${Math.abs(diffDays)}`;
};

/**
 * 디데이 색상 결정 함수
 * @param {number} days - 남은 날짜 수
 * @returns {string} - CSS 클래스명
 */
export const getDdayColorClass = (days) => {
  if (days === 0) return 'dday-today';
  if (days > 0 && days <= 7) return 'dday-urgent';
  if (days > 7 && days <= 30) return 'dday-soon';
  if (days > 30) return 'dday-future';
  return 'dday-past';
};