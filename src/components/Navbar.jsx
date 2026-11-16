import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isActive = (path) => location.pathname === path ? 'active' : '';

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    navigate('/');
  };

  if (isAuthenticated) {
    return (
      <nav className="navbar">
        <div className="navbar-inner">
          <Link to="/dashboard" className="navbar-logo">
            <div className="logo-icon">📡</div>
            <span className="logo-text">Data Echo</span>
          </Link>
          <div className="navbar-links">
            <Link to="/dashboard" className={isActive('/dashboard')}>
              <span className="nav-icon">📊</span> Dashboard
            </Link>
            <Link to="/verify" className={isActive('/verify') || isActive('/analyze')}>
              <span className="nav-icon">🔍</span> Verify Information
            </Link>
            <Link to="/source-propagation" className={isActive('/source-propagation') || isActive('/network')}>
              <span className="nav-icon">🕸️</span> Source & Propagation
            </Link>
            <Link to="/what-if" className={isActive('/what-if')}>
              <span className="nav-icon">🛡️</span> What-If Simulator
            </Link>
          </div>
          <div className="navbar-profile" ref={dropdownRef}>
            <button className="profile-btn" onClick={() => setDropdownOpen(!dropdownOpen)}>
              <div className="profile-avatar">👤</div>
              <span className="profile-name">{user.name}</span>
              <span className={`profile-chevron ${dropdownOpen ? 'open' : ''}`}>▾</span>
            </button>
            {dropdownOpen && (
              <div className="profile-dropdown animate-dropdown">
                <div className="dropdown-header">
                  <div className="dropdown-avatar">👤</div>
                  <div>
                    <div className="dropdown-name">{user.name}</div>
                    <div className="dropdown-email">{user.email}</div>
                  </div>
                </div>
                <div className="dropdown-divider"></div>
                <Link to="/profile" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                  <span>👤</span> Profile
                </Link>
                <div className="dropdown-divider"></div>
                <button className="dropdown-item logout" onClick={handleLogout}>
                  <span>🚪</span> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">
          <div className="logo-icon">📡</div>
          <span className="logo-text">Data Echo</span>
        </Link>
        <div className="navbar-links">
          <Link to="/" className={isActive('/')}>Home</Link>
          <Link to="/about" className={isActive('/about')}>About</Link>
        </div>
        <div className="navbar-auth">
          <Link to="/signin" className="btn-signin">Sign In</Link>
          <Link to="/signup" className="btn-signup">Sign Up</Link>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
