// src/renderer/components/ThemeSettings.jsx
import React, { useState, useEffect } from 'react';
import ColorPicker from './ColorPicker';
import '../styles/ThemeSettings.css';

function ThemeSettings({ onClose }) {
  const [primaryColor, setPrimaryColor] = useState('#667eea');
  const [secondaryColor, setSecondaryColor] = useState('#764ba2');

  // localStorage에서 테마 불러오기
  useEffect(() => {
    const savedTheme = localStorage.getItem('appTheme');
    if (savedTheme) {
      try {
        const theme = JSON.parse(savedTheme);
        setPrimaryColor(theme.primary || '#667eea');
        setSecondaryColor(theme.secondary || '#764ba2');
        applyTheme(theme.primary, theme.secondary);
      } catch (error) {
        console.error('테마 로드 실패:', error);
      }
    }
  }, []);

  // 테마 적용
  const applyTheme = (primary, secondary) => {
    const primaryRgb = hexToRgb(primary);
    const secondaryRgb = hexToRgb(secondary);
    
    document.documentElement.style.setProperty('--primary-color', primary);
    document.documentElement.style.setProperty('--secondary-color', secondary);
    document.documentElement.style.setProperty('--primary-rgb', primaryRgb);
    document.documentElement.style.setProperty('--secondary-rgb', secondaryRgb);
  };

  // hex를 rgb로 변환
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return '102, 126, 234';
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
  };

  // 색상 변경
  const handlePrimaryChange = (color) => {
    setPrimaryColor(color);
    applyTheme(color, secondaryColor);
  };

  const handleSecondaryChange = (color) => {
    setSecondaryColor(color);
    applyTheme(primaryColor, color);
  };

  // 저장
  const handleSave = () => {
    const theme = {
      primary: primaryColor,
      secondary: secondaryColor
    };
    localStorage.setItem('appTheme', JSON.stringify(theme));
    applyTheme(primaryColor, secondaryColor);
    onClose();
  };

  // 초기화
  const handleReset = () => {
    const defaultPrimary = '#667eea';
    const defaultSecondary = '#764ba2';
    setPrimaryColor(defaultPrimary);
    setSecondaryColor(defaultSecondary);
    applyTheme(defaultPrimary, defaultSecondary);
    localStorage.removeItem('appTheme');
  };

  const presetThemes = [
    { name: '기본', primary: '#667eea', secondary: '#764ba2' },
    { name: '핑크', primary: '#ec4899', secondary: '#d946ef' },
    { name: '그린', primary: '#10b981', secondary: '#14b8a6' },
    { name: '오렌지', primary: '#f59e0b', secondary: '#ef4444' },
    { name: '블루', primary: '#3b82f6', secondary: '#06b6d4' },
    { name: '퍼플', primary: '#8b5cf6', secondary: '#a855f7' },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content theme-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>🎨 테마 설정</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="theme-content">
          {/* 프리셋 테마 */}
          <div className="preset-themes">
            <label className="section-label">프리셋 테마</label>
            <div className="preset-grid">
              {presetThemes.map(theme => (
                <button
                  key={theme.name}
                  className="preset-theme-btn"
                  onClick={() => {
                    setPrimaryColor(theme.primary);
                    setSecondaryColor(theme.secondary);
                    applyTheme(theme.primary, theme.secondary);
                  }}
                >
                  <div className="preset-preview">
                    <div 
                      className="preset-color-1" 
                      style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})` }}
                    />
                  </div>
                  <span>{theme.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 커스텀 색상 */}
          <div className="custom-colors">
            <label className="section-label">커스텀 색상</label>
            
            <div className="color-setting">
              <label>메인 색상</label>
              <ColorPicker
                value={primaryColor}
                onChange={handlePrimaryChange}
              />
            </div>

            <div className="color-setting">
              <label>보조 색상</label>
              <ColorPicker
                value={secondaryColor}
                onChange={handleSecondaryChange}
              />
            </div>
          </div>

          {/* 미리보기 */}
          <div className="theme-preview">
            <label className="section-label">미리보기</label>
            <div 
              className="preview-header"
              style={{ 
                background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)` 
              }}
            >
              <span>📅 Calendar</span>
              <div className="preview-buttons">
                <button>🌙</button>
                <button>💧</button>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button type="button" className="reset-button" onClick={handleReset}>
            초기화
          </button>
          <div className="right-actions">
            <button type="button" className="cancel-button" onClick={onClose}>
              취소
            </button>
            <button type="button" className="save-button" onClick={handleSave}>
              저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ThemeSettings;