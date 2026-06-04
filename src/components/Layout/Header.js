import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, getUserRole, logout } from '../../utils/auth';
import { getInitials } from '../../utils/helpers';

const Header = ({ title, onMenuToggle }) => {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const role = getUserRole();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const firstName = user?.firstName || '';
  const lastName = user?.lastName || '';
  const displayName = firstName && lastName ? `${firstName} ${lastName}` : user?.username || 'User';
  const initials = getInitials(firstName, lastName) || (user?.username ? user.username.charAt(0).toUpperCase() : '?');

  return (
    <header className="main-header">
      <div className="main-header-left">
        <button className="btn btn-ghost btn-icon sidebar-toggle-btn" onClick={onMenuToggle}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <h2>{title}</h2>
      </div>

      <div className="main-header-right">
        <div style={{ position: 'relative' }}>
          <button
            className="btn btn-ghost"
            onClick={() => setShowDropdown(!showDropdown)}
            style={{ padding: '4px 8px' }}
          >
            <div className="user-info">
              <div className="user-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {role && role.toLowerCase() === 'admin' ? (
                  <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>AD</span>
                ) : (
                  initials
                )}
              </div>
              <div className="user-details">
                <div className="name">{displayName}</div>
                <div className="role">{role || 'User'}</div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 4 }}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </button>

          {showDropdown && (
            <>
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 99,
                }}
                onClick={() => setShowDropdown(false)}
              />
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: 8,
                  background: '#fff',
                  borderRadius: 8,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  border: '1px solid #e8eaed',
                  minWidth: 180,
                  zIndex: 100,
                  overflow: 'hidden',
                }}
              >
                <button
                  className="btn btn-ghost"
                  onClick={handleLogout}
                  style={{
                    width: '100%',
                    justifyContent: 'flex-start',
                    padding: '12px 16px',
                    borderRadius: 0,
                    color: '#ea4335',
                    fontWeight: 500,
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
