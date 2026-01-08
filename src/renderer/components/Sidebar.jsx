// src/renderer/components/Sidebar.jsx
import React, { useState } from 'react';
import StickerTab from './StickerTab';
import { getCalendarMembers } from '../services/calendarService';
import { calculateDday } from '../services/ddayUtils';
import '../styles/Sidebar.css';

function Sidebar({ 
  calendars, 
  selectedCalendars,
  activeCalendar,
  onToggleCalendar,
  onSetActiveCalendar,
  onCreateCalendar, 
  onJoinCalendar,
  onLeaveCalendar,
  onToggleSidebar,
  onSelectSticker,
  events, // 디데이 표시를 위해 추가
  onEventUpdate, // 디데이 해제를 위해 추가
  onLockAllStickers, // 스티커 전체 잠금
  onDeleteAllStickers // 스티커 전체 삭제
}) {
  const [activeTab, setActiveTab] = useState('calendars');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [newCalendarName, setNewCalendarName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');
  const [contextMenu, setContextMenu] = useState(null);
  const [ddayContextMenu, setDdayContextMenu] = useState(null); // 디데이 우클릭 메뉴
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [currentMembers, setCurrentMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [showCalendarDropdown, setShowCalendarDropdown] = useState(false);

  const handleCreateCalendar = async (e) => {
    e.preventDefault();
    if (!newCalendarName.trim()) return;

    setIsCreating(true);
    setError('');
    try {
      await onCreateCalendar(newCalendarName.trim());
      setNewCalendarName('');
      setShowCreateModal(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinCalendar = async (e) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    setIsJoining(true);
    setError('');
    try {
      await onJoinCalendar(inviteCode.trim().toUpperCase());
      setInviteCode('');
      setShowJoinModal(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsJoining(false);
    }
  };

  const isAllSelected = calendars.length > 0 && 
    calendars.every(cal => selectedCalendars.includes(cal.id));

  const handleToggleAll = () => {
    if (isAllSelected) {
      onToggleCalendar([]);
    } else {
      onToggleCalendar(calendars.map(cal => cal.id));
    }
  };

  const handleCheckboxChange = (calendarId) => {
    if (selectedCalendars.includes(calendarId)) {
      onToggleCalendar(selectedCalendars.filter(id => id !== calendarId));
    } else {
      onToggleCalendar([...selectedCalendars, calendarId]);
    }
  };

  const handleLeaveCalendar = async (calendar) => {
    if (calendar.isPersonal) {
      alert('개인 캘린더는 삭제할 수 없습니다.');
      return;
    }

    const confirmMessage = `"${calendar.name}" 캘린더에서 나가시겠습니까?\n\n이 캘린더의 일정을 더 이상 볼 수 없게 됩니다.`;
    
    if (window.confirm(confirmMessage)) {
      try {
        await onLeaveCalendar(calendar.id);
        setContextMenu(null);
      } catch (error) {
        alert('캘린더 나가기 실패: ' + error.message);
      }
    }
  };

  const handleContextMenu = (e, calendar) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (calendar.isPersonal) return;
    
    setContextMenu({
      calendar: calendar,
      x: e.clientX,
      y: e.clientY
    });
  };

  const handleShowInviteCode = (calendar) => {
    const inviteCode = calendar.inviteCode;
    
    navigator.clipboard.writeText(inviteCode).then(() => {
      alert(`초대코드가 복사되었습니다!\n\n${inviteCode}\n\n이 코드를 공유하면 다른 사람도 이 캘린더를 볼 수 있어요!`);
    }).catch(err => {
      console.error('복사 실패:', err);
      alert(`초대코드: ${inviteCode}\n\n이 코드를 공유하면 다른 사람도 이 캘린더를 볼 수 있어요!`);
    });
    
    setContextMenu(null);
  };

  const handleShowMembers = async (calendar) => {
    setContextMenu(null);
    setShowMembersModal(true);
    setLoadingMembers(true);
    
    try {
      const members = await getCalendarMembers(calendar.id);
      setCurrentMembers(members);
    } catch (error) {
      console.error('멤버 로드 실패:', error);
      alert('멤버 정보를 불러올 수 없습니다.');
      setShowMembersModal(false);
    } finally {
      setLoadingMembers(false);
    }
  };

  React.useEffect(() => {
    const handleClick = () => {
      setContextMenu(null);
      setDdayContextMenu(null);
    };
    if (contextMenu || ddayContextMenu) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [contextMenu, ddayContextMenu]);

  // 디데이 우클릭 핸들러
  const handleDdayContextMenu = (e, event) => {
    e.preventDefault();
    e.stopPropagation();
    setDdayContextMenu({
      event: event,
      x: e.clientX,
      y: e.clientY
    });
  };

  // 디데이 해제 핸들러
  const handleRemoveDday = async (event) => {
    try {
      if (onEventUpdate) {
        // 반복 인스턴스인 경우 원본 ID 사용
        const eventId = event.originalEventId || event.id;
        
        await onEventUpdate(event.calendarId, eventId, {
          ...event,
          showDday: false
        });
      }
      setDdayContextMenu(null);
    } catch (error) {
      console.error('디데이 해제 실패:', error);
      alert('디데이 해제에 실패했습니다: ' + error.message);
    }
  };

  return (
    <>
      <div className="sidebar">
        {/* 탭 제거 */}

        {activeTab === 'calendars' ? (
          <>
            {/* 디데이 일정 섹션 */}
            {events && (() => {
              const ddayEvents = events.filter(e => e.showDday && selectedCalendars.includes(e.calendarId));
              console.log('🔍 Sidebar 디데이 필터:', {
                totalEvents: events.length,
                ddayEvents: ddayEvents.length,
                selectedCalendars
              });
              
              // 반복 일정의 경우 원본 이벤트 ID로 그룹화하여 가장 가까운 발생만 표시
              const uniqueDdayEvents = [];
              const seenOriginalIds = new Set();
              
              // 날짜순으로 정렬 (가까운 순)
              const sortedDdayEvents = [...ddayEvents].sort((a, b) => new Date(a.date) - new Date(b.date));
              
              sortedDdayEvents.forEach(event => {
                const originalId = event.originalEventId || event.id;
                
                // 반복 일정인 경우 원본 ID가 처음 나온 것만 추가 (가장 가까운 발생)
                if (!seenOriginalIds.has(originalId)) {
                  seenOriginalIds.add(originalId);
                  uniqueDdayEvents.push(event);
                }
              });
              
              return uniqueDdayEvents.length > 0 && (
              <div className="dday-section">
                <div className="dday-section-header">
                  <h4>📌 디데이 일정</h4>
                </div>
                <div className="dday-list">
                  {uniqueDdayEvents
                    .slice(0, 5)
                    .map(event => {
                      const eventDate = new Date(event.date);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      eventDate.setHours(0, 0, 0, 0);
                      const daysUntil = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));
                      
                      let ddayClass = 'dday-badge';
                      if (daysUntil === 0) ddayClass += ' dday-today';
                      else if (daysUntil > 0 && daysUntil <= 7) ddayClass += ' dday-urgent';
                      else if (daysUntil > 7 && daysUntil <= 30) ddayClass += ' dday-soon';
                      else if (daysUntil > 30) ddayClass += ' dday-future';
                      else ddayClass += ' dday-past';
                      
                      return (
                        <div 
                          key={event.id} 
                          className="dday-item"
                          onContextMenu={(e) => handleDdayContextMenu(e, event)}
                        >
                          <span 
                            className="dday-item-color" 
                            style={{ backgroundColor: event.color }}
                          />
                          <div className="dday-item-content">
                            <div className="dday-item-title">
                              {event.title}
                              {event.isRepeatInstance && <span className="repeat-indicator">🔄</span>}
                            </div>
                            <div className="dday-item-date">
                              {eventDate.getMonth() + 1}월 {eventDate.getDate()}일
                            </div>
                          </div>
                          <span className={ddayClass}>
                            {calculateDday(event.date)}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
              );
            })()}

            <div className="calendar-list">
              <div className="calendar-item all-calendars">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleToggleAll}
                  />
                  <span className="calendar-name">전체 보기</span>
                </label>
              </div>

              {calendars.map(calendar => (
                <div 
                  key={calendar.id} 
                  className={`calendar-item ${activeCalendar === calendar.id ? 'active' : ''}`}
                  onClick={() => onSetActiveCalendar(calendar.id)}
                  onContextMenu={(e) => handleContextMenu(e, calendar)}
                >
                  <div className="calendar-item-content">
                    <label className="checkbox-label" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedCalendars.includes(calendar.id)}
                        onChange={() => handleCheckboxChange(calendar.id)}
                      />
                      <span 
                        className="calendar-color" 
                        style={{ backgroundColor: calendar.color }}
                      />
                      <span className="calendar-name">{calendar.name}</span>
                      {calendar.memberCount > 1 && (
                        <span className="member-indicator">👥</span>
                      )}
                    </label>
                  </div>
                </div>
              ))}
            </div>

            <div className="sidebar-actions">
              {/* 드롭다운 메뉴 */}
              {showCalendarDropdown && (
                <div className="sidebar-dropdown">
                  <button 
                    className="sidebar-dropdown-item" 
                    onClick={() => {
                      setShowCreateModal(true);
                      setShowCalendarDropdown(false);
                    }}
                  >
                    <span>➕</span>
                    새 캘린더
                  </button>
                  <button 
                    className="sidebar-dropdown-item" 
                    onClick={() => {
                      setShowJoinModal(true);
                      setShowCalendarDropdown(false);
                    }}
                  >
                    <span>🔗</span>
                    초대코드 입력
                  </button>
                </div>
              )}
              
              {/* 메인 버튼 */}
              <button 
                className="action-button create-btn" 
                onClick={() => setShowCalendarDropdown(!showCalendarDropdown)}
              >
                {showCalendarDropdown ? '✕ 닫기' : '+ 캘린더 관리'}
              </button>
            </div>

            {/* 하단 고정: 스티커 버튼 */}
            <div className="sidebar-footer">
              <button 
                className="sticker-button"
                onClick={() => setActiveTab('stickers')}
              >
                <span className="sticker-icon">🎨</span>
                <span className="sticker-text">스티커</span>
              </button>
            </div>
          </>
        ) : (
          <>
            <StickerTab onSelectSticker={onSelectSticker} 
                        onLockAll={onLockAllStickers}
                        onDeleteAll={onDeleteAllStickers}
            />
            
            {/* 스티커 탭에서 캘린더로 돌아가기 버튼 */}
            <div className="sidebar-footer">
              <button 
                className="sticker-button active"
                onClick={() => setActiveTab('calendars')}
              >
                <span className="sticker-icon">📅</span>
                <span className="sticker-text">캘린더로 돌아가기</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* 새 캘린더 만들기 모달 */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content small-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>새 캘린더 만들기</h3>
              <button className="close-button" onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreateCalendar}>
              <div className="form-group">
                <label>캘린더 이름</label>
                <input
                  type="text"
                  value={newCalendarName}
                  onChange={(e) => setNewCalendarName(e.target.value)}
                  placeholder="예: 회사 일정, 가족 일정"
                  autoFocus
                  required
                />
              </div>
              {error && <div className="error-message">{error}</div>}
              <div className="modal-actions">
                <button type="button" className="cancel-button" onClick={() => setShowCreateModal(false)}>
                  취소
                </button>
                <button type="submit" className="save-button" disabled={isCreating}>
                  {isCreating ? '생성 중...' : '만들기'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 초대코드 입력 모달 */}
      {showJoinModal && (
        <div className="modal-overlay" onClick={() => setShowJoinModal(false)}>
          <div className="modal-content small-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>캘린더 참여하기</h3>
              <button className="close-button" onClick={() => setShowJoinModal(false)}>×</button>
            </div>
            <form onSubmit={handleJoinCalendar}>
              <div className="form-group">
                <label>초대코드 (6자리)</label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="ABC123"
                  maxLength={6}
                  autoFocus
                  required
                  style={{ textTransform: 'uppercase' }}
                />
              </div>
              {error && <div className="error-message">{error}</div>}
              <div className="modal-actions">
                <button type="button" className="cancel-button" onClick={() => setShowJoinModal(false)}>
                  취소
                </button>
                <button type="submit" className="save-button" disabled={isJoining}>
                  {isJoining ? '참여 중...' : '참여하기'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 컨텍스트 메뉴 */}
      {contextMenu && (
        <div 
          className="context-menu"
          style={{ 
            left: `${contextMenu.x}px`, 
            top: `${contextMenu.y}px` 
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.calendar.memberCount > 1 && (
            <button 
              className="context-menu-item"
              onClick={() => handleShowMembers(contextMenu.calendar)}
            >
              👥 멤버 보기 ({contextMenu.calendar.memberCount}명)
            </button>
          )}
          <button 
            className="context-menu-item"
            onClick={() => handleShowInviteCode(contextMenu.calendar)}
          >
            🔗 초대코드 보기
          </button>
          <button 
            className="context-menu-item delete-item"
            onClick={() => handleLeaveCalendar(contextMenu.calendar)}
          >
            🗑️ 캘린더 나가기
          </button>
        </div>
      )}

      {/* 멤버 목록 모달 */}
      {showMembersModal && (
        <div className="modal-overlay" onClick={() => setShowMembersModal(false)}>
          <div className="modal-content small-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>👥 멤버 목록</h3>
              <button className="close-button" onClick={() => setShowMembersModal(false)}>×</button>
            </div>
            
            {loadingMembers ? (
              <div className="loading-members">
                <p>멤버 정보를 불러오는 중...</p>
              </div>
            ) : (
              <div className="members-list">
                {currentMembers.map((member) => (
                  <div key={member.id} className="member-item">
                    <div className="member-avatar">
                      {member.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="member-info">
                      <div className="member-name">{member.displayName}</div>
                      <div className="member-email">{member.email}</div>
                    </div>
                  </div>
                ))}
                {currentMembers.length === 0 && (
                  <p className="no-members">멤버가 없습니다.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 디데이 컨텍스트 메뉴 */}
      {ddayContextMenu && (
        <div 
          className="context-menu"
          style={{ 
            left: `${ddayContextMenu.x}px`, 
            top: `${ddayContextMenu.y}px` 
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            className="context-menu-item delete-item"
            onClick={() => handleRemoveDday(ddayContextMenu.event)}
          >
            ❌ 디데이 해제
          </button>
        </div>
      )}
    </>
  );
}

export default Sidebar;