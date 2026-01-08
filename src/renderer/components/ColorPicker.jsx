// src/renderer/components/ColorPicker.jsx
import React, { useState, useEffect } from 'react';
import '../styles/ColorPicker.css';

function ColorPicker({ value, onChange, presetColors }) {
  const [showPicker, setShowPicker] = useState(false);
  const [colorInput, setColorInput] = useState(value);
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(100);
  const [lightness, setLightness] = useState(50);

  const defaultPresets = [
    '#ef4444', '#f59e0b', '#eab308', '#84cc16', 
    '#10b981', '#14b8a6', '#06b6d4', '#3b82f6',
    '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
    '#ec4899', '#f43f5e', '#64748b', '#1f2937'
  ];

  const colors = presetColors || defaultPresets;

  // hex를 HSL로 변환
  const hexToHSL = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return { h: 0, s: 100, l: 50 };

    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  };

  // HSL을 hex로 변환
  const hslToHex = (h, s, l) => {
    s /= 100;
    l /= 100;

    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;

    if (0 <= h && h < 60) {
      r = c; g = x; b = 0;
    } else if (60 <= h && h < 120) {
      r = x; g = c; b = 0;
    } else if (120 <= h && h < 180) {
      r = 0; g = c; b = x;
    } else if (180 <= h && h < 240) {
      r = 0; g = x; b = c;
    } else if (240 <= h && h < 300) {
      r = x; g = 0; b = c;
    } else if (300 <= h && h < 360) {
      r = c; g = 0; b = x;
    }

    const toHex = (n) => {
      const hex = Math.round((n + m) * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  useEffect(() => {
    const hsl = hexToHSL(value);
    setHue(hsl.h);
    setSaturation(hsl.s);
    setLightness(hsl.l);
    setColorInput(value);
  }, [value]);

  const handleHSLChange = (newHue, newSat, newLight) => {
    const hex = hslToHex(newHue, newSat, newLight);
    setColorInput(hex);
    onChange(hex);
  };

  const handleInputChange = (e) => {
    let input = e.target.value;
    setColorInput(input);
    
    // #으로 시작하고 3자리 또는 6자리 hex인지 확인
    if (/^#([0-9A-F]{3}){1,2}$/i.test(input)) {
      onChange(input);
      const hsl = hexToHSL(input);
      setHue(hsl.h);
      setSaturation(hsl.s);
      setLightness(hsl.l);
    }
  };

  return (
    <div className="color-picker-wrapper">
      <div className="color-preview-row">
        <div 
          className="color-preview"
          style={{ backgroundColor: value }}
          onClick={() => setShowPicker(!showPicker)}
        />
        <input
          type="text"
          className="color-input"
          value={colorInput}
          onChange={handleInputChange}
          placeholder="#000000"
          maxLength={7}
        />
      </div>

      {showPicker && (
        <div className="color-picker-dropdown">
          {/* 프리셋 색상 */}
          <div className="preset-colors">
            {colors.map(color => (
              <button
                key={color}
                className={`preset-color ${value.toLowerCase() === color.toLowerCase() ? 'selected' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => {
                  onChange(color);
                  setShowPicker(false);
                }}
                title={color}
              />
            ))}
          </div>

          {/* 색상환 (Hue) */}
          <div className="slider-group">
            <label>색상</label>
            <input
              type="range"
              min="0"
              max="360"
              value={hue}
              onChange={(e) => {
                const newHue = parseInt(e.target.value);
                setHue(newHue);
                handleHSLChange(newHue, saturation, lightness);
              }}
              className="hue-slider"
              style={{
                background: 'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)'
              }}
            />
          </div>

          {/* 채도 (Saturation) */}
          <div className="slider-group">
            <label>채도</label>
            <input
              type="range"
              min="0"
              max="100"
              value={saturation}
              onChange={(e) => {
                const newSat = parseInt(e.target.value);
                setSaturation(newSat);
                handleHSLChange(hue, newSat, lightness);
              }}
              className="saturation-slider"
              style={{
                background: `linear-gradient(to right, 
                  hsl(${hue}, 0%, ${lightness}%), 
                  hsl(${hue}, 100%, ${lightness}%))`
              }}
            />
          </div>

          {/* 밝기 (Lightness) */}
          <div className="slider-group">
            <label>밝기</label>
            <input
              type="range"
              min="0"
              max="100"
              value={lightness}
              onChange={(e) => {
                const newLight = parseInt(e.target.value);
                setLightness(newLight);
                handleHSLChange(hue, saturation, newLight);
              }}
              className="lightness-slider"
              style={{
                background: `linear-gradient(to right, 
                  hsl(${hue}, ${saturation}%, 0%), 
                  hsl(${hue}, ${saturation}%, 50%),
                  hsl(${hue}, ${saturation}%, 100%))`
              }}
            />
          </div>

          <button 
            className="close-picker-btn"
            onClick={() => setShowPicker(false)}
          >
            완료
          </button>
        </div>
      )}
    </div>
  );
}

export default ColorPicker;