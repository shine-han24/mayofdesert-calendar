// src/renderer/components/Auth.jsx
import React, { useState } from 'react';
import '../styles/Auth.css';

function Auth({ onLogin }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        // 회원가입
        if (password.length < 6) {
          throw new Error('비밀번호는 6자 이상이어야 합니다');
        }
        await onLogin({ email, password, displayName, isSignUp: true });
      } else {
        // 로그인
        await onLogin({ email, password, isSignUp: false });
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
    setEmail('');
    setPassword('');
    setDisplayName('');
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-header">
          <h1>📅 Desktop Calendar</h1>
          <p>{isSignUp ? '새 계정 만들기' : '로그인'}</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {isSignUp && (
            <div className="form-field">
              <label>이름</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="홍길동"
                required
              />
            </div>
          )}

          <div className="form-field">
            <label>이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              required
            />
          </div>

          <div className="form-field">
            <label>비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="6자 이상"
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? '처리중...' : isSignUp ? '회원가입' : '로그인'}
          </button>
        </form>

        <div className="auth-footer">
          <button onClick={toggleMode} className="toggle-button">
            {isSignUp ? '이미 계정이 있으신가요? 로그인' : '계정이 없으신가요? 회원가입'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Auth;