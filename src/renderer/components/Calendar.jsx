// src/renderer/components/Calendar.jsx
import React, { useState } from 'react';
import '../styles/Calendar.css';
import { calculateDday, getDdayColorClass } from '../services/ddayUtils';


function Calendar({ events, onDateClick, onEventClick }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'month' or 'week'
  const [hoveredEvent, setHoveredEvent] = useState(null);
  const [selectedWeekDate, setSelectedWeekDate] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [showDatePicker, setShowDatePicker] = useState(false); // 날짜 선택 피커
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  //디데이
  const getDaysUntil = (targetDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);
    const diffTime = target - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // 월의 첫날과 마지막날
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  // 달력 시작 요일 (일요일 = 0)
  const startDay = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  // 주간 뷰를 위한 함수들
  const getWeekStart = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day; // 일요일로 조정
    return new Date(d.setDate(diff));
  };

  const getWeekDays = () => {
    const weekStart = getWeekStart(currentDate);
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      days.push(day);
    }
    return days;
  };

  // 이전/다음 달 또는 주로 이동
  const prevPeriod = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month - 1, 1));
    } else {
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() - 7);
      setCurrentDate(newDate);
    }
  };

  const nextPeriod = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month + 1, 1));
    } else {
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() + 7);
      setCurrentDate(newDate);
    }
  };

  // 오늘로 이동
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // 년/월 선택
  const handleYearChange = (newYear) => {
    setCurrentDate(new Date(newYear, month, 1));
    // 피커는 닫지 않음
  };

  const handleMonthSelect = (selectedMonth) => {
    setCurrentDate(new Date(year, selectedMonth, 1));
    setShowDatePicker(false); // 월 선택 시에만 닫기
  };

  // 스와이프 핸들러
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      nextPeriod();
    }
    if (isRightSwipe) {
      prevPeriod();
    }
  };

  // 오늘 날짜 확인
  const isToday = (date) => {
    const today = new Date();
    return today.getFullYear() === date.getFullYear() &&
           today.getMonth() === date.getMonth() &&
           today.getDate() === date.getDate();
  };

  // 특정 날짜의 이벤트 가져오기
  const getEventsForDate = (date) => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.getFullYear() === date.getFullYear() &&
             eventDate.getMonth() === date.getMonth() &&
             eventDate.getDate() === date.getDate();
    });
  };

  // 주간 뷰 렌더링
  const renderWeekView = () => {
    const weekDays = getWeekDays();
    const displayDate = selectedWeekDate || (weekDays.find(d => isToday(d)) || weekDays[0]);
    const displayEvents = getEventsForDate(displayDate);
    
    return (
      <div className="week-view-container">
        {/* 상단: 날짜 선택 영역 */}
        <div className="week-dates-section">
          <div className="week-header">
            {weekDays.map((date, index) => (
              <div
                key={index}
                className={`week-header-day ${isToday(date) ? 'today' : ''} ${
                  selectedWeekDate && 
                  selectedWeekDate.getDate() === date.getDate() && 
                  selectedWeekDate.getMonth() === date.getMonth() 
                    ? 'selected' 
                    : ''
                }`}
                onClick={() => setSelectedWeekDate(date)}
              >
                <div className="week-header-name">
                  {['일', '월', '화', '수', '목', '금', '토'][date.getDay()]}
                </div>
                <div className="week-header-date">{date.getDate()}</div>
                {getEventsForDate(date).length > 0 && (
                  <div className="week-event-indicator">
                    {getEventsForDate(date).length}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 하단: 선택된 날짜의 일정 표시 */}
        <div className="week-events-section">
          <div className="week-events-header">
            <h3 className="week-events-title">
              {displayDate.getMonth() + 1}월 {displayDate.getDate()}일 ({['일', '월', '화', '수', '목', '금', '토'][displayDate.getDay()]})
            </h3>
            <button 
              className="add-event-button"
              onClick={() => onDateClick(displayDate)}
            >
              + 일정 추가
            </button>
          </div>
          
          <div className="week-events-list">
            {displayEvents.length === 0 ? (
              <div className="no-events-message">
                일정이 없습니다
              </div>
            ) : (
              displayEvents.map(event => {
                const daysUntil = getDaysUntil(event.date);
                return (
                  <div
                    key={event.id}
                    className="week-event-card"
                    style={{ borderLeftColor: event.color }}
                    onClick={() => onEventClick(event)}
                  >
                    <div className="week-event-color-bar" style={{ backgroundColor: event.color }}></div>
                    <div className="week-event-info">
                      <div className="week-event-card-title">
                        {event.isRepeatInstance && '🔄 '}
                        {event.title}
                        {event.showDday && (
                          <span className={`week-event-dday ${getDdayColorClass(daysUntil)}`}>
                            {calculateDday(event.date)}
                          </span>
                        )}
                      </div>
                      {event.description && (
                        <div className="week-event-card-description">{event.description}</div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  };

  // 월간 뷰 렌더링
  const renderMonthView = () => {
    const days = [];
    
    // 빈 칸 (이전 달)
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    // 실제 날짜
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayEvents = getEventsForDate(date);

      days.push(
        <div
          key={day}
          className={`calendar-day ${isToday(date) ? 'today' : ''}`}
          onClick={() => onDateClick(date)}
        >
          <div className="day-number">{day}</div>
          <div className="day-events">
            {dayEvents.slice(0, 2).map(event => {
              const daysUntil = getDaysUntil(event.date);
              console.log('📅 일정 렌더링:', event.title, 'showDday:', event.showDday, 'daysUntil:', daysUntil);
              return (
                <div
                  key={event.id}
                  className="event-dot"
                  style={{ backgroundColor: event.color }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEventClick(event);
                  }}
                  onMouseEnter={(e) => {
                    if (hoveredEvent !== event.id) {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setTooltipPosition({
                        x: rect.left + rect.width / 2,
                        y: rect.top
                      });
                      setHoveredEvent(event.id);
                    }
                  }}
                  onMouseLeave={(e) => {
                    setHoveredEvent(null);
                  }}
                >
                  <span className="event-title" style={{ pointerEvents: 'none' }}>
                    {event.isRepeatInstance && '🔄 '}
                    {event.title}
                    {event.showDday && (
                      <span className={`event-dday ${getDdayColorClass(daysUntil)}`}>
                        {calculateDday(event.date)}
                      </span>
                    )}
                  </span>
                </div>
              );
            })}
            {dayEvents.length > 2 && (
              <div className="more-events">+{dayEvents.length - 2}</div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  const monthNames = [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월'
  ];

  // 주간 뷰 타이틀
  const getWeekTitle = () => {
    const weekDays = getWeekDays();
    const start = weekDays[0];
    const end = weekDays[6];
    
    if (start.getMonth() === end.getMonth()) {
      return `${start.getFullYear()}년 ${monthNames[start.getMonth()]} ${start.getDate()}일 - ${end.getDate()}일`;
    } else {
      return `${start.getFullYear()}년 ${monthNames[start.getMonth()]} ${start.getDate()}일 - ${monthNames[end.getMonth()]} ${end.getDate()}일`;
    }
  };

  return (
    <div 
      className="calendar-container"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div className="calendar-header">
        <div className="header-left">
          <button onClick={prevPeriod} className="nav-button">‹</button>
          <h2 
            className="calendar-title clickable" 
            onClick={() => setShowDatePicker(!showDatePicker)}
            title="날짜 선택"
          >
            {viewMode === 'month' ? `${year}년 ${monthNames[month]}` : getWeekTitle()}
          </h2>
          <button onClick={nextPeriod} className="nav-button">›</button>
        </div>
        
        <div className="header-right">
          <button onClick={goToToday} className="today-button">
            오늘
          </button>
          <div className="view-switcher">
            <button
              className={`view-button ${viewMode === 'month' ? 'active' : ''}`}
              onClick={() => setViewMode('month')}
            >
              월
            </button>
            <button
              className={`view-button ${viewMode === 'week' ? 'active' : ''}`}
              onClick={() => setViewMode('week')}
            >
              주
            </button>
          </div>
        </div>
      </div>

      {/* 날짜 선택 피커 */}
      {showDatePicker && (
        <div className="date-picker-overlay" onClick={() => setShowDatePicker(false)}>
          <div className="date-picker-content" onClick={(e) => e.stopPropagation()}>
            <div className="date-picker-header">
              <button 
                className="date-picker-nav"
                onClick={() => handleYearChange(year - 1)}
              >
                ‹
              </button>
              <span className="date-picker-year">{year}년</span>
              <button 
                className="date-picker-nav"
                onClick={() => handleYearChange(year + 1)}
              >
                ›
              </button>
            </div>
            <div className="date-picker-months">
              {monthNames.map((monthName, idx) => (
                <button
                  key={idx}
                  className={`month-button ${month === idx ? 'active' : ''}`}
                  onClick={() => handleMonthSelect(idx)}
                >
                  {monthName}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {viewMode === 'month' && (
        <>
          <div className="calendar-weekdays">
            <div className="weekday">일</div>
            <div className="weekday">월</div>
            <div className="weekday">화</div>
            <div className="weekday">수</div>
            <div className="weekday">목</div>
            <div className="weekday">금</div>
            <div className="weekday">토</div>
          </div>

          <div className="calendar-grid">
            {renderMonthView()}
          </div>
        </>
      )}

      {viewMode === 'week' && renderWeekView()}
      
      {/* 툴팁을 월간 뷰에서만 표시 */}
      {viewMode === 'month' && hoveredEvent && events.find(e => e.id === hoveredEvent)?.description && (
        <div 
          className="event-hover-tooltip"
          style={{
            position: 'fixed',
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y - 10}px`,
            transform: 'translate(-50%, -100%)',
            zIndex: 99999,
            pointerEvents: 'none'
          }}
        >
          <div className="tooltip-content">
            <div className="tooltip-title">
              {events.find(e => e.id === hoveredEvent)?.title}
            </div>
            <div className="tooltip-description">
              {events.find(e => e.id === hoveredEvent)?.description}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Calendar;