import { useState, useEffect } from 'react';
import { ChatInterface } from './components/ChatInterface';
import { LoginPage } from './components/LoginPage';
import { SignupPage } from './components/SignupPage';
import { LandingPage } from './components/LandingPage';
import { AdminLoginPage } from './components/AdminLoginPage';
import { AdminDashboard } from './components/AdminDashboard';

export default function App() {
  const [currentPage, setCurrentPage] = useState<'landing' | 'login' | 'signup' | 'chat' | 'admin' | 'admin-dashboard'>('landing');

  // Check URL path on mount and URL changes
  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/admin') {
      setCurrentPage('admin');
    } else if (path === '/admin/dashboard') {
      setCurrentPage('admin-dashboard');
    }

    // Listen for URL changes
    const handlePopState = () => {
      const newPath = window.location.pathname;
      if (newPath === '/admin') {
        setCurrentPage('admin');
      } else if (newPath === '/admin/dashboard') {
        setCurrentPage('admin-dashboard');
      } else if (newPath === '/') {
        setCurrentPage('landing');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleLogin = () => {
    setCurrentPage('chat');
  };

  const handleSignup = () => {
    setCurrentPage('chat');
  };

  const handleSwitchToSignup = () => {
    setCurrentPage('signup');
  };

  const handleSwitchToLogin = () => {
    setCurrentPage('login');
  };

  const handleGetStarted = () => {
    setCurrentPage('signup');
  };

  const handleSignIn = () => {
    setCurrentPage('login');
  };

  // Admin pages don't need the decorative background
  if (currentPage === 'admin' || currentPage === 'admin-dashboard') {
    return currentPage === 'admin' ? <AdminLoginPage /> : <AdminDashboard />;
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#0B1F3A] via-[#1E3A8A] to-[#1F4E79] relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#0D9488] rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#1E3A8A] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#0A3D62] rounded-full mix-blend-multiply filter blur-xl opacity-15 animate-blob animation-delay-4000"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10">
        {currentPage === 'landing' && (
          <LandingPage onGetStarted={handleGetStarted} onSignIn={handleSignIn} />
        )}
        {currentPage === 'login' && (
          <div className="flex items-center justify-center min-h-screen p-4">
            <LoginPage onLogin={handleLogin} onSwitchToSignup={handleSwitchToSignup} />
          </div>
        )}
        {currentPage === 'signup' && (
          <div className="flex items-center justify-center min-h-screen p-4">
            <SignupPage onSignup={handleSignup} onSwitchToLogin={handleSwitchToLogin} />
          </div>
        )}
        {currentPage === 'chat' && (
          <div className="flex items-center justify-center min-h-screen p-4">
            <ChatInterface />
          </div>
        )}
      </div>
    </div>
  );
}