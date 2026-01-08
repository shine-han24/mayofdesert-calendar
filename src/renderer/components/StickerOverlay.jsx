// src/renderer/components/StickerOverlay.jsx
import React, { useState, useEffect } from 'react';
import '../styles/StickerOverlay.css';

function StickerOverlay({ selectedSticker, onStickerPlaced, allLocked }) {
  const [placedStickers, setPlacedStickers] = useState([]);
  const [draggingSticker, setDraggingSticker] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizingSticker, setResizingSticker] = useState(null);
  const [rotatingSticker, setRotatingSticker] = useState(null);

  // allLocked 상태 변화 감지
  useEffect(() => {
    console.log('🔒 StickerOverlay - allLocked 상태:', allLocked);
  }, [allLocked]);

  // localStorage에서 배치된 스티커 불러오기
  useEffect(() => {
    const saved = localStorage.getItem('placedStickers');
    if (saved) {
      try {
        setPlacedStickers(JSON.parse(saved));
      } catch (error) {
        console.error('스티커 로드 실패:', error);
      }
    }
  }, []);

  // 스티커 저장
  const savePlacedStickers = (stickers) => {
    setPlacedStickers(stickers);
    localStorage.setItem('placedStickers', JSON.stringify(stickers));
  };

  // 캘린더 클릭 - 스티커 배치
  const handleCalendarClick = (e) => {
    if (!selectedSticker) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newSticker = {
      id: Date.now().toString(),
      stickerId: selectedSticker.id,
      data: selectedSticker.data,
      x: x - 50, // 중앙 정렬
      y: y - 50,
      width: 100,
      height: 100,
      rotation: 0
    };

    const newStickers = [...placedStickers, newSticker];
    savePlacedStickers(newStickers);
    
    if (onStickerPlaced) {
      onStickerPlaced();
    }
  };

  // 스티커 드래그 시작
  const handleStickerMouseDown = (e, sticker) => {
    e.stopPropagation();
    
    // 전체 잠금 시 드래그 불가
    if (allLocked) return;
    
    setDraggingSticker(sticker.id);
    
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  // 드래그 중
  const handleMouseMove = (e) => {
    if (!draggingSticker) return;

    const container = document.querySelector('.sticker-overlay');
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left - dragOffset.x;
    const y = e.clientY - rect.top - dragOffset.y;

    const newStickers = placedStickers.map(s => 
      s.id === draggingSticker 
        ? { ...s, x, y }
        : s
    );
    savePlacedStickers(newStickers);
  };

  // 드래그 종료
  const handleMouseUp = () => {
    setDraggingSticker(null);
  };

  // 스티커 크기 조절 시작
  const handleResizeStart = (e, sticker) => {
    e.stopPropagation();
    if (allLocked) return;
    
    setResizingSticker({
      id: sticker.id,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: sticker.width,
      startHeight: sticker.height
    });
  };

  // 크기 조절 중
  const handleResizeMove = (e) => {
    if (!resizingSticker) return;

    const deltaX = e.clientX - resizingSticker.startX;
    const deltaY = e.clientY - resizingSticker.startY;
    const delta = Math.max(deltaX, deltaY);

    const newWidth = Math.max(50, resizingSticker.startWidth + delta);
    const newHeight = Math.max(50, resizingSticker.startHeight + delta);

    const newStickers = placedStickers.map(s => 
      s.id === resizingSticker.id 
        ? { ...s, width: newWidth, height: newHeight }
        : s
    );
    savePlacedStickers(newStickers);
  };

  // 크기 조절 종료
  const handleResizeEnd = () => {
    setResizingSticker(null);
  };

  // 전역 이벤트 리스너
  useEffect(() => {
    if (draggingSticker) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggingSticker, dragOffset]);

  useEffect(() => {
    if (resizingSticker) {
      window.addEventListener('mousemove', handleResizeMove);
      window.addEventListener('mouseup', handleResizeEnd);
      return () => {
        window.removeEventListener('mousemove', handleResizeMove);
        window.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [resizingSticker]);

  useEffect(() => {
    if (rotatingSticker) {
      window.addEventListener('mousemove', handleRotateMove);
      window.addEventListener('mouseup', handleRotateEnd);
      return () => {
        window.removeEventListener('mousemove', handleRotateMove);
        window.removeEventListener('mouseup', handleRotateEnd);
      };
    }
  }, [rotatingSticker]);

  // 스티커 삭제
  const handleDeleteSticker = (stickerId) => {
    const newStickers = placedStickers.filter(s => s.id !== stickerId);
    savePlacedStickers(newStickers);
  };

  // 스티커 회전 시작
  const handleRotateStart = (e, sticker) => {
    e.stopPropagation();
    if (allLocked) return;
    
    const stickerElement = e.currentTarget.parentElement.parentElement;
    const rect = stickerElement.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    setRotatingSticker({
      id: sticker.id,
      centerX,
      centerY,
      startAngle: Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI),
      startRotation: sticker.rotation
    });
  };

  // 회전 중
  const handleRotateMove = (e) => {
    if (!rotatingSticker) return;

    const currentAngle = Math.atan2(
      e.clientY - rotatingSticker.centerY,
      e.clientX - rotatingSticker.centerX
    ) * (180 / Math.PI);

    const angleDiff = currentAngle - rotatingSticker.startAngle;
    const newRotation = (rotatingSticker.startRotation + angleDiff) % 360;

    const newStickers = placedStickers.map(s => 
      s.id === rotatingSticker.id 
        ? { ...s, rotation: newRotation }
        : s
    );
    savePlacedStickers(newStickers);
  };

  // 회전 종료
  const handleRotateEnd = () => {
    setRotatingSticker(null);
  };

  return (
    <div 
      className={`sticker-overlay ${selectedSticker ? 'placing-mode' : ''} ${allLocked ? 'locked' : ''}`}
      onClick={handleCalendarClick}
    >
      {placedStickers.map(sticker => (
        <div
          key={sticker.id}
          className={`placed-sticker ${allLocked ? 'locked' : ''}`}
          style={{
            left: `${sticker.x}px`,
            top: `${sticker.y}px`,
            width: `${sticker.width}px`,
            height: `${sticker.height}px`,
            transform: `rotate(${sticker.rotation}deg)`,
            cursor: allLocked ? 'not-allowed' : 'move'
          }}
          onMouseDown={(e) => handleStickerMouseDown(e, sticker)}
        >
          <img src={sticker.data} alt="sticker" draggable={false} />
          
          {!allLocked && (
            <>
              <div className="sticker-controls">
                <button 
                  className="sticker-control-btn delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSticker(sticker.id);
                  }}
                  title="삭제"
                >
                  ×
                </button>
              </div>

              <div 
                className="rotate-handle"
                onMouseDown={(e) => handleRotateStart(e, sticker)}
                title="드래그하여 회전"
              />

              <div 
                className="resize-handle"
                onMouseDown={(e) => handleResizeStart(e, sticker)}
                title="드래그하여 크기 조절"
              />
            </>
          )}
        </div>
      ))}
    </div>
  );
}

export default StickerOverlay;