import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const TABS = ['로그인', '회원가입', '비밀번호 찾기', '인증'];

function translateError(msg) {
  if (!msg) return '알 수 없는 오류가 발생했습니다.';
  if (msg.includes('Invalid login')) return '이메일 또는 비밀번호가 올바르지 않습니다.';
  if (msg.includes('already registered')) return '이미 등록된 이메일입니다.';
  if (msg.includes('Password should be')) return '비밀번호는 6자 이상이어야 합니다.';
  if (msg.includes('rate limit')) return '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';
  return msg;
}

export default function LoginModal({ onClose }) {
  const { signInWithGoogle, signInWithEmail, signUp, resetPassword, resendConfirmation } = useAuth();
  const [tab, setTab] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);

  const startCooldown = () => {
    setCooldown(60);
    const iv = setInterval(() => setCooldown(p => { if (p <= 1) { clearInterval(iv); return 0; } return p - 1; }), 1000);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); setMessage('');
    try {
      await signInWithEmail(email, password);
      onClose();
    } catch (err) {
      setError(translateError(err.message));
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError(''); setMessage('');
    if (password.length < 6) { setError('비밀번호는 6자 이상이어야 합니다.'); return; }
    if (password !== passwordConfirm) { setError('비밀번호가 일치하지 않습니다.'); return; }
    try {
      await signUp(email, password);
      setMessage('인증 이메일이 발송되었습니다. 메일함을 확인해주세요.');
      setTab(3);
    } catch (err) {
      setError(translateError(err.message));
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError(''); setMessage('');
    try {
      await resetPassword(email);
      setMessage('비밀번호 재설정 이메일이 발송되었습니다.');
    } catch (err) {
      setError(translateError(err.message));
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setError(''); setMessage('');
    try {
      await resendConfirmation(email);
      setMessage('인증 이메일이 재발송되었습니다.');
      startCooldown();
    } catch (err) {
      setError(translateError(err.message));
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <div className="modal-tabs">
          {TABS.map((t, i) => (
            <button key={t} className={`modal-tab ${tab === i ? 'active' : ''}`}
              onClick={() => { setTab(i); setError(''); setMessage(''); }}>
              {t}
            </button>
          ))}
        </div>

        {error && <div className="msg msg-error">{error}</div>}
        {message && <div className="msg msg-success">{message}</div>}

        {tab === 0 && (
          <form onSubmit={handleLogin}>
            <input type="email" placeholder="이메일" value={email} onChange={e => setEmail(e.target.value)} required />
            <input type="password" placeholder="비밀번호" value={password} onChange={e => setPassword(e.target.value)} required />
            <button type="submit" className="btn-primary">로그인</button>
            <button type="button" className="btn-google" onClick={async () => { try { await signInWithGoogle(); } catch (err) { setError(translateError(err.message)); } }}>
              Google로 로그인
            </button>
          </form>
        )}

        {tab === 1 && (
          <form onSubmit={handleSignUp}>
            <input type="email" placeholder="이메일" value={email} onChange={e => setEmail(e.target.value)} required />
            <input type="password" placeholder="비밀번호 (6자 이상)" value={password} onChange={e => setPassword(e.target.value)} required />
            <input type="password" placeholder="비밀번호 확인" value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)} required />
            <button type="submit" className="btn-primary">회원가입</button>
          </form>
        )}

        {tab === 2 && (
          <form onSubmit={handleReset}>
            <input type="email" placeholder="이메일" value={email} onChange={e => setEmail(e.target.value)} required />
            <button type="submit" className="btn-primary">재설정 이메일 발송</button>
          </form>
        )}

        {tab === 3 && (
          <div className="verify-section">
            <p>이메일 인증이 필요합니다.</p>
            <p>메일함을 확인하고 인증 링크를 클릭해주세요.</p>
            <input type="email" placeholder="이메일" value={email} onChange={e => setEmail(e.target.value)} />
            <button onClick={handleResend} disabled={cooldown > 0} className="btn-primary">
              {cooldown > 0 ? `재발송 (${cooldown}s)` : '인증 이메일 재발송'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
