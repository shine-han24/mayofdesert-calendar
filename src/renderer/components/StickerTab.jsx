// src/renderer/components/StickerTab.jsx
import React, { useState, useEffect } from 'react';
import '../styles/StickerTab.css';

function StickerTab({ onSelectSticker, onLockAll, onDeleteAll }) {
  const [stickers, setStickers] = useState([]);
  const [selectedSticker, setSelectedSticker] = useState(null);

  // localStorage에서 스티커 불러오기
  useEffect(() => {
    const savedStickers = localStorage.getItem('myStickers');
    if (savedStickers) {
      try {
        setStickers(JSON.parse(savedStickers));
      } catch (error) {
        console.error('스티커 로드 실패:', error);
      }
    }
  }, []);

  // 스티커 저장
  const saveStickers = (newStickers) => {
    setStickers(newStickers);
    localStorage.setItem('myStickers', JSON.stringify(newStickers));
  };

  // 이미지 업로드
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 이미지 파일만 허용
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.');
      return;
    }

    // 파일 크기 체크 (5MB 제한)
    if (file.size > 5 * 1024 * 1024) {
      alert('이미지 크기는 5MB 이하여야 합니다.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const newSticker = {
        id: Date.now().toString(),
        name: file.name,
        data: event.target.result,
        uploadedAt: new Date().toISOString()
      };
      
      const newStickers = [...stickers, newSticker];
      saveStickers(newStickers);
    };
    reader.readAsDataURL(file);
  };

  // 스티커 삭제
  const handleDeleteSticker = (stickerId) => {
    if (window.confirm('이 스티커를 삭제하시겠습니까?')) {
      const newStickers = stickers.filter(s => s.id !== stickerId);
      saveStickers(newStickers);
      if (selectedSticker?.id === stickerId) {
        setSelectedSticker(null);
      }
    }
  };

  // 스티커 선택
  const handleSelectSticker = (sticker) => {
    setSelectedSticker(sticker);
    if (onSelectSticker) {
      onSelectSticker(sticker);
    }
  };

  return (
    <div className="sticker-tab">
      <div className="sticker-header">
        <h4>🎨 내 스티커</h4>
        <p className="sticker-info">{stickers.length}개</p>
      </div>

      {/* 스티커 관리 버튼 */}
      <div className="sticker-management" style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <button 
          className="sticker-lock-all-btn"
          onClick={() => {
            console.log('🔒 잠금 버튼 클릭됨');
            if (onLockAll) {
              onLockAll();
            } else {
              console.error('onLockAll 함수가 없습니다!');
            }
          }}
          title="배치된 스티커 잠금/해제"
          style={{
            flex: 1,
            padding: '8px',
            border: '1px solid #fbbf24',
            background: '#fef3c7',
            borderRadius: '8px',
            fontSize: '11px',
            fontWeight: 600,
            color: '#92400e',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px'
          }}
        >
          🔒
        </button>
        <button 
          className="sticker-delete-all-btn"
          onClick={() => {
            console.log('🗑️ 삭제 버튼 클릭됨');
            if (onDeleteAll) {
              onDeleteAll();
            } else {
              console.error('onDeleteAll 함수가 없습니다!');
            }
          }}
          title="배치된 스티커 모두 삭제"
          style={{
            flex: 1,
            padding: '8px',
            border: '1px solid #fecaca',
            background: '#fef2f2',
            borderRadius: '8px',
            fontSize: '11px',
            fontWeight: 600,
            color: '#dc2626',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px'
          }}
        >
          🗑️ 
        </button>
      </div>

      <div className="sticker-upload">
        <label htmlFor="sticker-file-input" className="upload-button">
          ➕ 스티커 추가
        </label>
        <input
          id="sticker-file-input"
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          style={{ display: 'none' }}
        />
      </div>

      <div className="sticker-grid">
        {stickers.length === 0 ? (
          <div className="empty-state">
            <p>아직 스티커가 없어요</p>
            <p className="empty-hint">이미지를 추가해보세요!</p>
          </div>
        ) : (
          stickers.map(sticker => (
            <div 
              key={sticker.id} 
              className={`sticker-item ${selectedSticker?.id === sticker.id ? 'selected' : ''}`}
              onClick={() => handleSelectSticker(sticker)}
            >
              <img src={sticker.data} alt={sticker.name} />
              <button 
                className="delete-sticker-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteSticker(sticker.id);
                }}
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>

      {selectedSticker && (
        <div className="selected-sticker-info">
          <p>✓ 선택됨: {selectedSticker.name}</p>
        </div>
      )}
    </div>
  );
}

export default StickerTab;