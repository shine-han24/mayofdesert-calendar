import React, { useState, useEffect, useRef } from 'react';
import Calendar from './components/Calendar';
import EventModal from './components/EventModal';
import Auth from './components/Auth';
import Sidebar from './components/Sidebar';
import StickerOverlay from './components/StickerOverlay';
import ThemeSettings from './components/ThemeSettings';
import { onAuthChange, signIn, signUp, logout } from './services/authService';
import { getUserCalendars, createCalendar, joinCalendarByCode, leaveCalendar } from './services/calendarService';
import { createEvent, updateEvent, deleteEvent, subscribeToMultipleCalendars, updateRepeatEvent, getEvent } from './services/eventService';
import { expandRepeatEvents } from './services/repeatEventUtils';
import './styles/App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [calendars, setCalendars] = useState([]);
  const [selectedCalendars, setSelectedCalendars] = useState([]);
  const [activeCalendar, setActiveCalendar] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);
  
  const [events, setEvents] = useState([]);
  
  const [selectedDate, setSelectedDate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [isAlwaysOnTop, setIsAlwaysOnTop] = useState(true);
  const [bgOpacity, setBgOpacity] = useState(100);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedSticker, setSelectedSticker] = useState(null);
  const [showThemeSettings, setShowThemeSettings] = useState(false);
  const [stickersLocked, setStickersLocked] = useState(false); // 스티커 전체 잠금
  
  const [calendarName, setCalendarName] = useState('내 캘린더');
  const [headerBackground, setHeaderBackground] = useState(null);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [showNameEditModal, setShowNameEditModal] = useState(false);
  const [tempName, setTempName] = useState('');
  const [mouseDownInsideNameModal, setMouseDownInsideNameModal] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userCalendars = await getUserCalendars(currentUser.uid);
          setCalendars(userCalendars);
          setSelectedCalendars(userCalendars.map(cal => cal.id));
          if (userCalendars.length > 0) {
            setActiveCalendar(userCalendars[0].id);
          }
        } catch (error) {
          console.error('캘린더 로드 실패:', error);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const savedName = localStorage.getItem('calendarName');
    const savedBg = localStorage.getItem('headerBackground');
    const savedTheme = localStorage.getItem('appTheme');
    
    if (savedName) setCalendarName(savedName);
    if (savedBg) setHeaderBackground(savedBg);
    
    if (savedTheme) {
      try {
        const theme = JSON.parse(savedTheme);
        const hexToRgb = (hex) => {
          const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
          if (!result) return '102, 126, 234';
          return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
        };
        
        document.documentElement.style.setProperty('--primary-color', theme.primary);
        document.documentElement.style.setProperty('--secondary-color', theme.secondary);
        document.documentElement.style.setProperty('--primary-rgb', hexToRgb(theme.primary));
        document.documentElement.style.setProperty('--secondary-rgb', hexToRgb(theme.secondary));
      } catch (error) {
        console.error('테마 로드 실패:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (selectedCalendars.length === 0) {
      setEvents([]);
      return;
    }

    const unsubscribe = subscribeToMultipleCalendars(selectedCalendars, (allEvents) => {
      setEvents(allEvents);
    });

    return () => unsubscribe();
  }, [selectedCalendars]);

  useEffect(() => {
    if (window.electron?.onAlwaysOnTopChanged) {
      window.electron.onAlwaysOnTopChanged((isOnTop) => {
        setIsAlwaysOnTop(isOnTop);
      });
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowSettingsDropdown(false);
      }
    };

    if (showSettingsDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSettingsDropdown]);

  const handleLogin = async ({ email, password, displayName, isSignUp }) => {
    try {
      if (isSignUp) {
        await signUp(email, password, displayName);
      } else {
        await signIn(email, password);
      }
    } catch (error) {
      throw error;
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setCalendars([]);
      setSelectedCalendars([]);
      setActiveCalendar(null);
      setEvents([]);
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  const handleCreateCalendar = async (calendarName) => {
    try {
      const newCalendar = await createCalendar(user.uid, calendarName);
      setCalendars([...calendars, newCalendar]);
      setSelectedCalendars([...selectedCalendars, newCalendar.id]);
      setActiveCalendar(newCalendar.id);
    } catch (error) {
      throw error;
    }
  };

  const handleJoinCalendar = async (inviteCode) => {
    try {
      const joinedCalendar = await joinCalendarByCode(user.uid, inviteCode);
      setCalendars([...calendars, joinedCalendar]);
      setSelectedCalendars([...selectedCalendars, joinedCalendar.id]);
      setActiveCalendar(joinedCalendar.id);
    } catch (error) {
      throw error;
    }
  };

  const handleLeaveCalendar = async (calendarId) => {
    try {
      await leaveCalendar(user.uid, calendarId);
      
      setCalendars(calendars.filter(cal => cal.id !== calendarId));
      setSelectedCalendars(selectedCalendars.filter(id => id !== calendarId));
      
      if (activeCalendar === calendarId) {
        const remaining = calendars.filter(cal => cal.id !== calendarId);
        if (remaining.length > 0) {
          setActiveCalendar(remaining[0].id);
        }
      }
    } catch (error) {
      throw error;
    }
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setEditingEvent(null);
    setShowModal(true);
  };

  const handleEventClick = (event) => {
    setEditingEvent(event);
    setSelectedDate(event.date);
    setShowModal(true);
  };

  const handleSaveEvent = async (eventData) => {
    try {
      if (editingEvent) {
        // 반복 인스턴스인 경우 원본 이벤트 ID 사용
        const eventId = editingEvent.originalEventId || editingEvent.id;
        await updateEvent(editingEvent.calendarId, eventId, eventData);
      } else {
        await createEvent(eventData.calendarId, {
          ...eventData,
          createdBy: user.uid
        });
      }
      setShowModal(false);
      setEditingEvent(null);
    } catch (error) {
      console.error('일정 저장 실패:', error);
      alert('일정 저장에 실패했습니다.');
    }
  };

  const handleDeleteEvent = async (eventId, calendarId) => {
    try {
      // 반복 인스턴스인 경우 원본 이벤트 ID 찾기
      const event = events.find(e => e.id === eventId);
      const actualEventId = event?.originalEventId || eventId;
      
      await deleteEvent(calendarId, actualEventId);
      setShowModal(false);
      setEditingEvent(null);
    } catch (error) {
      console.error('일정 삭제 실패:', error);
      alert('일정 삭제에 실패했습니다.');
    }
  };

  const handleMinimize = () => {
    if (window.electron?.minimizeWindow) {
      window.electron.minimizeWindow();
    }
  };

  const handleClose = () => {
    if (window.electron?.closeWindow) {
      window.electron.closeWindow();
    }
  };

  const handleTogglePin = () => {
    if (window.electron?.toggleAlwaysOnTop) {
      window.electron.toggleAlwaysOnTop();
    }
    setShowSettingsDropdown(false);
  };

  const handleOpacityChange = (value) => {
    setBgOpacity(value);
    setShowSettingsDropdown(false);
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    setShowSettingsDropdown(false);
  };

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  const handleSelectSticker = (sticker) => {
    setSelectedSticker(sticker);
  };

  const handleStickerPlaced = () => {
    setSelectedSticker(null);
  };

  // 스티커 전체 잠금/해제
  const handleLockAllStickers = () => {
    console.log('🔒 App.jsx - handleLockAllStickers 호출됨');
    console.log('현재 stickersLocked 상태:', stickersLocked);
    setStickersLocked(!stickersLocked);
    console.log('변경될 stickersLocked 상태:', !stickersLocked);
  };

  // 스티커 전체 삭제
  const handleDeleteAllStickers = () => {
    console.log('🗑️ App.jsx - handleDeleteAllStickers 호출됨');
    if (window.confirm('모든 스티커를 삭제하시겠습니까?')) {
      localStorage.removeItem('placedStickers');
      console.log('✅ placedStickers 삭제됨, 페이지 새로고침');
      window.location.reload(); // 스티커 오버레이 새로고침
    } else {
      console.log('❌ 사용자가 삭제 취소');
    }
  };

  const handleNameChange = () => {
    setTempName(calendarName);
    setShowNameEditModal(true);
    setShowSettingsDropdown(false);
  };

  const handleSaveNameChange = () => {
    if (tempName && tempName.trim()) {
      setCalendarName(tempName.trim());
      localStorage.setItem('calendarName', tempName.trim());
    }
    setShowNameEditModal(false);
  };

  const handleBackgroundChange = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setHeaderBackground(event.target.result);
          localStorage.setItem('headerBackground', event.target.result);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
    setShowSettingsDropdown(false);
  };

  const handleRemoveBackground = () => {
    setHeaderBackground(null);
    localStorage.removeItem('headerBackground');
    setShowSettingsDropdown(false);
  };

  // 선택된 캘린더의 일정만 필터링
  const baseFilteredEvents = events.filter(event => 
    selectedCalendars.includes(event.calendarId)
  );

  // 반복 일정을 확장 (앞뒤 1년 범위)
  const today = new Date();
  const viewStart = new Date(today.getFullYear() - 1, 0, 1);
  const viewEnd = new Date(today.getFullYear() + 1, 11, 31);
  const filteredEvents = expandRepeatEvents(baseFilteredEvents, viewStart, viewEnd);


  if (loading) {
    return (
      <div className="app-container light-mode">
        <div className="loading-container">
          <div className="loading-spinner">📅</div>
          <p>로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className={`app-container ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      {/* 헤더 영역 (배경 + 작업표시줄) */}
      <div className="app-header-wrapper">
        {/* 상단: 배경 이미지 영역 (전체 드래그 가능) */}
        <div 
          className="app-header-image"
          style={headerBackground ? { backgroundImage: `url(${headerBackground})` } : {}}
        >
          <div className="header-image-overlay"></div>
        </div>

        {/* 작업 표시줄 (최상단) */}
        <div className="app-taskbar">
        <div className="taskbar-left">
          <button 
            className="taskbar-button sidebar-toggle" 
            onClick={toggleSidebar}
            title={showSidebar ? "사이드바 닫기" : "사이드바 열기"}
          >
            {showSidebar ? '‹' : '›'}
          </button>
          <span className="taskbar-title">📅 {calendarName}</span>
          <span className="taskbar-user">{user.displayName || user.email}</span>
        </div>
        
        <div className="taskbar-right">
          <div className="settings-dropdown-wrapper" ref={dropdownRef}>
            <button 
              className="taskbar-button" 
              onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
              title="설정"
            >
              ⚙️
            </button>
            
            {showSettingsDropdown && (
              <div className="header-settings-dropdown">
                <button className="dropdown-menu-item" onClick={handleNameChange}>
                  <span className="dropdown-icon">✏️</span>
                  이름 변경
                </button>
                
                <button className="dropdown-menu-item" onClick={handleBackgroundChange}>
                  <span className="dropdown-icon">🖼️</span>
                  배경 이미지 설정
                </button>
                
                {headerBackground && (
                  <button className="dropdown-menu-item" onClick={handleRemoveBackground}>
                    <span className="dropdown-icon">🗑️</span>
                    배경 이미지 제거
                  </button>
                )}
                
                <div className="dropdown-divider"></div>
                
                <button className="dropdown-menu-item" onClick={toggleTheme}>
                  <span className="dropdown-icon">{isDarkMode ? '☀️' : '🌙'}</span>
                  {isDarkMode ? '라이트 모드' : '다크 모드'}
                </button>
                
                <button className="dropdown-menu-item" onClick={handleTogglePin}>
                  <span className="dropdown-icon">{isAlwaysOnTop ? '📌' : '📍'}</span>
                  {isAlwaysOnTop ? '고정 해제' : '항상 위'}
                </button>
                
                <div className="dropdown-submenu">
                  <div className="dropdown-item-label">
                    <span className="dropdown-icon">💫</span>
                    투명도: {bgOpacity}%
                  </div>
                  <div className="opacity-slider-container">
                    <input
                      type="range"
                      min="60"
                      max="100"
                      step="5"
                      value={bgOpacity}
                      onChange={(e) => setBgOpacity(parseInt(e.target.value))}
                      className="opacity-slider"
                    />
                    <div className="opacity-value">{bgOpacity}%</div>
                  </div>
                </div>
                
                <div className="dropdown-divider"></div>
                
                <button className="dropdown-menu-item" onClick={() => {
                  setShowThemeSettings(true);
                  setShowSettingsDropdown(false);
                }}>
                  <span className="dropdown-icon">🎨</span>
                  테마 색상
                </button>
                
                <button className="dropdown-menu-item logout-item" onClick={handleLogout}>
                  <span className="dropdown-icon">🚪</span>
                  로그아웃
                </button>
              </div>
            )}
          </div>
          
          <button className="taskbar-button" onClick={handleMinimize} title="최소화">−</button>
          <button className="taskbar-button close-btn" onClick={handleClose} title="닫기">×</button>
        </div>
      </div>
      </div>
      
      <div 
        className="app-content"
        style={{ '--bg-opacity': bgOpacity / 100 }}
      >
        <div className="main-layout">
          {showSidebar && (
            <Sidebar
              calendars={calendars}
              selectedCalendars={selectedCalendars}
              activeCalendar={activeCalendar}
              onToggleCalendar={setSelectedCalendars}
              onSetActiveCalendar={setActiveCalendar}
              onCreateCalendar={handleCreateCalendar}
              onJoinCalendar={handleJoinCalendar}
              onLeaveCalendar={handleLeaveCalendar}
              onToggleSidebar={toggleSidebar}
              onSelectSticker={handleSelectSticker}
              events={filteredEvents}
              onEventUpdate={updateEvent}
              onLockAllStickers={handleLockAllStickers}
              onDeleteAllStickers={handleDeleteAllStickers}
            />
          )}
          
          <div className="calendar-wrapper">
            <Calendar 
              events={filteredEvents}
              onDateClick={handleDateClick}
              onEventClick={handleEventClick}
            />
            <StickerOverlay 
              selectedSticker={selectedSticker}
              onStickerPlaced={handleStickerPlaced}
              allLocked={stickersLocked}
            />
          </div>
        </div>
      </div>

      {showModal && (
        <EventModal
          date={selectedDate}
          event={editingEvent}
          calendars={calendars}
          activeCalendar={activeCalendar}
          onSave={handleSaveEvent}
          onDelete={handleDeleteEvent}
          onUpdateRepeatEvent={updateRepeatEvent}
          onClose={() => {
            setShowModal(false);
            setEditingEvent(null);
          }}
        />
      )}

      {showThemeSettings && (
        <ThemeSettings onClose={() => setShowThemeSettings(false)} />
      )}

      {showNameEditModal && (
        <div 
          className="modal-overlay" 
          onMouseDown={(e) => {
            if (e.target.className === 'modal-overlay') {
              setMouseDownInsideNameModal(false);
            }
          }}
          onClick={(e) => {
            if (e.target.className === 'modal-overlay' && !mouseDownInsideNameModal) {
              setShowNameEditModal(false);
            }
          }}
        >
          <div 
            className="modal-content small-modal" 
            onMouseDown={() => setMouseDownInsideNameModal(true)}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>캘린더 이름 변경</h3>
              <button className="close-button" onClick={() => setShowNameEditModal(false)}>×</button>
            </div>
            <div className="form-group">
              <label>새 이름</label>
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                placeholder="캘린더 이름을 입력하세요"
                autoFocus
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveNameChange();
                  }
                }}
              />
            </div>
            <div className="modal-actions">
              <div className="right-actions">
                <button className="cancel-button" onClick={() => setShowNameEditModal(false)}>
                  취소
                </button>
                <button className="save-button" onClick={handleSaveNameChange}>
                  저장
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;