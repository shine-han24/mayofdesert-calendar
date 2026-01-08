// src/renderer/components/EventModal.jsx
import React, { useState, useEffect } from 'react';
import ColorPicker from './ColorPicker';
import '../styles/EventModal.css';

function EventModal({ date, event, calendars, activeCalendar, onSave, onDelete, onClose, onUpdateRepeatEvent }) {
  const [title, setTitle] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [description, setDescription] = useState('');
  const [calendarId, setCalendarId] = useState('');
  const [showDday, setShowDday] = useState(false);
  const [repeatType, setRepeatType] = useState('none'); // 반복 유형
  const [repeatEndDate, setRepeatEndDate] = useState(''); // 반복 종료일
  const [showDeleteOptions, setShowDeleteOptions] = useState(false); // 삭제 옵션 모달

  useEffect(() => {
    if (event) {
      setTitle(event.title || '');
      setColor(event.color || '#3b82f6');
      setDescription(event.description || '');
      setCalendarId(event.calendarId || '');
      setShowDday(event.showDday || false);
      setRepeatType(event.repeatType || 'none');
      setRepeatEndDate(event.repeatEndDate || '');
    } else {
      setTitle('');
      setColor('#3b82f6');
      setDescription('');
      setShowDday(false);
      setRepeatType('none');
      setRepeatEndDate('');
      // 기본값: 현재 활성 캘린더
      setCalendarId(activeCalendar || (calendars?.length > 0 ? calendars[0].id : ''));
    }
  }, [event, calendars, activeCalendar]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const eventData = {
      title: title.trim(),
      color,
      description: description.trim(),
      date: date,
      calendarId: calendarId,
      showDday: showDday,
      repeatType: repeatType,
      repeatEndDate: repeatEndDate || null
    };
    
    console.log('💾 저장하는 일정 데이터:', eventData);
    onSave(eventData);
  };

  const colors = [
    { name: '파랑', value: '#3b82f6' },
    { name: '초록', value: '#10b981' },
    { name: '빨강', value: '#ef4444' },
    { name: '보라', value: '#8b5cf6' },
    { name: '주황', value: '#f59e0b' },
    { name: '분홍', value: '#ec4899' },
  ];

  const formatDate = (d) => {
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
  };

  const calculateDday = (targetDate) => {
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{event ? '일정 수정' : '새 일정'}</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="event-form">
          {event && event.isRepeatInstance && (
            <div className="repeat-warning">
              ⚠️ 반복 일정을 수정하면 모든 반복 일정에 적용됩니다
            </div>
          )}
          
          <div className="form-group">
            <label>날짜</label>
            <div className="date-display">{formatDate(date)}</div>
          </div>

          <div className="form-group">
            <label>제목 *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="일정 제목"
              autoFocus
              required
            />
          </div>

          <div className="form-group">
            <label>캘린더</label>
            <select
              value={calendarId}
              onChange={(e) => setCalendarId(e.target.value)}
              className="calendar-select"
              required
            >
              {calendars && calendars.map(cal => (
                <option key={cal.id} value={cal.id}>
                  {cal.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>설명</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="일정 설명 (선택사항)"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label>색상</label>
            <ColorPicker
              value={color}
              onChange={setColor}
              presetColors={colors.map(c => c.value)}
            />
          </div>

          {/* 디데이 토글 */}
          <div className="form-group dday-toggle">
            <label className="dday-label">
              <input
                type="checkbox"
                checked={showDday}
                onChange={(e) => {
                  console.log('✅ 디데이 체크:', e.target.checked);
                  setShowDday(e.target.checked);
                }}
                className="dday-checkbox"
              />
              <span className="dday-text">
                디데이 표시 
                {showDday && <span className="dday-preview">{calculateDday(date)}</span>}
              </span>
            </label>
          </div>

          {/* 반복 일정 */}
          <div className="form-group">
            <label>반복</label>
            <select
              value={repeatType}
              onChange={(e) => setRepeatType(e.target.value)}
              className="repeat-select"
            >
              <option value="none">반복 안 함</option>
              <option value="daily">매일</option>
              <option value="weekly">매주 {['일', '월', '화', '수', '목', '금', '토'][date.getDay()]}요일</option>
              <option value="biweekly">격주 {['일', '월', '화', '수', '목', '금', '토'][date.getDay()]}요일</option>
              <option value="monthly">매월 {date.getDate()}일</option>
              <option value="yearly">매년 {date.getMonth() + 1}월 {date.getDate()}일</option>
            </select>
          </div>

          {/* 반복 종료일 (반복 선택 시에만 표시) */}
          {repeatType !== 'none' && (
            <div className="form-group">
              <label>반복 종료일 (선택사항)</label>
              <input
                type="date"
                value={repeatEndDate}
                onChange={(e) => setRepeatEndDate(e.target.value)}
                min={date.toISOString().split('T')[0]}
                className="date-input"
              />
              <span className="help-text">미설정 시 무한 반복</span>
            </div>
          )}

          <div className="modal-actions">
            {event && (
              <button
                type="button"
                className="delete-button"
                onClick={() => {
                  if (event.isRepeatInstance) {
                    // 반복 인스턴스인 경우 옵션 모달 표시
                    setShowDeleteOptions(true);
                  } else {
                    // 일반 일정은 바로 삭제
                    if (window.confirm('이 일정을 삭제하시겠습니까?')) {
                      onDelete(event.id, event.calendarId);
                    }
                  }
                }}
              >
                삭제
              </button>
            )}
            <div className="right-actions">
              <button type="button" className="cancel-button" onClick={onClose}>
                취소
              </button>
              <button type="submit" className="save-button">
                저장
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* 반복 일정 삭제 옵션 모달 */}
      {showDeleteOptions && event && event.isRepeatInstance && (
        <div className="delete-options-overlay">
          <div className="delete-options-content">
            <h3>반복 일정 삭제</h3>
            <p>어떻게 삭제하시겠습니까?</p>
            
            <div className="delete-options-buttons">
              <button
                className="delete-option-button"
                onClick={async () => {
                  try {
                    // 이 일정만 삭제 (excludedDates에 추가)
                    const dateString = new Date(event.date).toISOString().split('T')[0];
                    const eventId = event.originalEventId || event.id;
                    
                    if (onUpdateRepeatEvent) {
                      // 먼저 현재 excludedDates를 가져와서 추가
                      const { getEvent } = await import('../services/eventService');
                      const originalEvent = await getEvent(event.calendarId, eventId);
                      
                      await onUpdateRepeatEvent(event.calendarId, eventId, {
                        excludedDates: [...(originalEvent.excludedDates || []), dateString]
                      });
                    }
                    
                    setShowDeleteOptions(false);
                    onClose();
                  } catch (error) {
                    console.error('일정 제외 실패:', error);
                    alert('일정 제외에 실패했습니다: ' + error.message);
                  }
                }}
              >
                <span className="option-icon">📅</span>
                <div className="option-text">
                  <div className="option-title">이 일정만 삭제</div>
                  <div className="option-desc">
                    {new Date(event.date).getMonth() + 1}월 {new Date(event.date).getDate()}일 일정만 삭제됩니다
                  </div>
                </div>
              </button>

              <button
                className="delete-option-button"
                onClick={async () => {
                  try {
                    // 이후 일정 모두 삭제 (repeatEndDate를 이전 날짜로 설정)
                    const eventDate = new Date(event.date);
                    const previousDate = new Date(eventDate);
                    previousDate.setDate(previousDate.getDate() - 1);
                    const eventId = event.originalEventId || event.id;
                    
                    if (onUpdateRepeatEvent) {
                      await onUpdateRepeatEvent(event.calendarId, eventId, {
                        repeatEndDate: previousDate.toISOString().split('T')[0]
                      });
                    }
                    
                    setShowDeleteOptions(false);
                    onClose();
                  } catch (error) {
                    console.error('반복 종료일 설정 실패:', error);
                    alert('반복 종료일 설정에 실패했습니다: ' + error.message);
                  }
                }}
              >
                <span className="option-icon">📆</span>
                <div className="option-text">
                  <div className="option-title">이 일정 및 이후 일정 삭제</div>
                  <div className="option-desc">
                    {new Date(event.date).getMonth() + 1}월 {new Date(event.date).getDate()}일부터 모든 일정이 삭제됩니다
                  </div>
                </div>
              </button>

              <button
                className="delete-option-button danger"
                onClick={() => {
                  if (window.confirm('모든 반복 일정을 삭제하시겠습니까?')) {
                    const eventId = event.originalEventId || event.id;
                    onDelete(eventId, event.calendarId);
                    setShowDeleteOptions(false);
                  }
                }}
              >
                <span className="option-icon">🗑️</span>
                <div className="option-text">
                  <div className="option-title">모든 반복 일정 삭제</div>
                  <div className="option-desc">모든 반복 일정이 영구적으로 삭제됩니다</div>
                </div>
              </button>

              <button
                className="cancel-option-button"
                onClick={() => setShowDeleteOptions(false)}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EventModal;