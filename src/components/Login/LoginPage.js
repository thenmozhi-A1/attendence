import React from 'react';
import LoginForm from './LoginForm';

const LoginPage = () => {
  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>Attendance System</h1>
          <p>Sign in to manage your attendance</p>
        </div>

        <div className="login-body">
          <LoginForm />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
