import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoginModal from './LoginModal';

const NAV = [
  { path: '/', label: '홈' },
  { path: '/profile', label: '프로필' },
  { path: '/ebooks', label: '전자책' },
  { path: '/audiobooks', label: '오디오북' },
  { path: '/board', label: '게시판' },
  { path: '/self-communication', label: '자신과의 소통' },
  { path: '/store', label: '스토어' },
];

export default function Header() {
  const { user, isAdmin, signOut } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link to="/" className="logo" aria-label="다원출판사 홈">
          <img src="/logo_clean.png" alt="다원출판사 로고" className="logo-img" />
        </Link>
        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>☰</button>
        <nav className={`nav-links ${menuOpen ? 'open' : ''}`}>
          {NAV.map(n => (
            <Link key={n.path} to={n.path}
              className={location.pathname === n.path ? 'active' : ''}
              onClick={() => setMenuOpen(false)}>
              {n.label}
            </Link>
          ))}
          {isAdmin && (
            <Link to="/admin" className={location.pathname === '/admin' ? 'active' : ''}
              onClick={() => setMenuOpen(false)}>관리자</Link>
          )}
        </nav>
        <div className="header-auth">
          {user ? (
            <>
              <span className="user-name">{user.user_metadata?.full_name || user.email}</span>
              <button className="btn-sm" onClick={signOut}>로그아웃</button>
            </>
          ) : (
            <button className="btn-sm btn-primary" onClick={() => setShowLogin(true)}>로그인</button>
          )}
        </div>
      </div>
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </header>
  );
}
