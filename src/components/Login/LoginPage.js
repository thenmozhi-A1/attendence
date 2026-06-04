import React, { useState } from 'react';
import AdminLogin from './AdminLogin';
import FingerprintLogin from './FingerprintLogin';
import ScannerLogin from './ScannerLogin';

const tabs = [
  {
    id: 'admin',
    label: 'Admin',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    id: 'tech',
    label: 'Tech',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    id: 'accounts',
    label: 'Accounts',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18" />
        <path d="M9 21V9" />
      </svg>
    ),
  },
];

const LoginPage = () => {
  const [activeTab, setActiveTab] = useState('admin');

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>Attendance System</h1>
          <p>Sign in to manage your attendance</p>
        </div>

        <div className="login-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`login-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="login-body">
          {activeTab === 'admin' && <AdminLogin />}
          {activeTab === 'tech' && <FingerprintLogin />}
          {activeTab === 'accounts' && <ScannerLogin />}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
