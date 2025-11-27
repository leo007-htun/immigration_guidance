import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Shield, Lock, Mail, AlertCircle } from 'lucide-react';

export function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Use regular auth API with environment-aware URL
      const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Login failed');
      }

      const data = await response.json();

      // Check if user is admin
      if (!data.user?.isAdmin) {
        throw new Error('Admin access required. You do not have admin privileges.');
      }

      // Store tokens
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirect to dashboard
      window.history.pushState({}, '', '/admin/dashboard');
      window.dispatchEvent(new PopStateEvent('popstate'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B1F3A] via-[#1E3A8A] to-[#1F4E79] relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#0D9488] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#1E3A8A] rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#0A3D62] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Login Card */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-[#0D9488] to-[#0A3D62] rounded-3xl shadow-2xl mb-6">
              <Shield className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">Admin Portal</h1>
            <p className="text-white/60">Legal Chatbot Management</p>
          </div>

          {/* Login Form */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-500/10 backdrop-blur-sm border border-red-500/20 rounded-2xl p-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-300 flex-shrink-0 mt-0.5" />
                  <p className="text-red-200 text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-white/90 font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="w-full bg-white/5 backdrop-blur-sm border-white/20 text-white placeholder:text-white/40 focus:border-[#0D9488] focus:ring-2 focus:ring-[#0D9488]/20 rounded-xl px-4 py-3"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white/90 font-medium flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="w-full bg-white/5 backdrop-blur-sm border-white/20 text-white placeholder:text-white/40 focus:border-[#0D9488] focus:ring-2 focus:ring-[#0D9488]/20 rounded-xl px-4 py-3"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#0D9488] to-[#0A3D62] hover:from-[#0A7A6A] hover:to-[#083451] text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Logging in...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Shield className="h-5 w-5" />
                    Admin Login
                  </span>
                )}
              </Button>
            </form>
          </div>

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-white/40 text-sm">
              Secure admin access to Legal Chatbot
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
