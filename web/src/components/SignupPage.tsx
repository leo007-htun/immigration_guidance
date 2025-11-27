import { useState } from 'react';
import { Scale, Mail, Lock, User, ArrowRight, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

interface SignupPageProps {
  onSignup: () => void;
  onSwitchToLogin: () => void;
}

export function SignupPage({ onSignup, onSwitchToLogin }: SignupPageProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password length
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);

    try {
      await api.signup({ email, password, displayName: name });
      onSignup();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="backdrop-blur-md bg-white/5 border-b border-white/10 p-8 text-center">
        <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-[#0D9488]/20 to-[#0F9D58]/20 border border-white/20 mb-4">
          <Scale className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-white mb-2">Create Account</h1>
        <p className="text-white/60">Start your immigration assistance journey</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-8 space-y-5">
        {error && (
          <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center gap-2 text-red-200">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="name" className="text-white/80 text-sm">Full Name</label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="w-full pl-12 pr-4 py-3 rounded-xl backdrop-blur-md bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="signup-email" className="text-white/80 text-sm">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              id="signup-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full pl-12 pr-4 py-3 rounded-xl backdrop-blur-md bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="signup-password" className="text-white/80 text-sm">Password</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              id="signup-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-12 pr-4 py-3 rounded-xl backdrop-blur-md bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="confirm-password" className="text-white/80 text-sm">Confirm Password</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-12 pr-4 py-3 rounded-xl backdrop-blur-md bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
              required
            />
          </div>
        </div>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="mt-1 w-4 h-4 rounded border-white/20 bg-white/10 text-blue-500 focus:ring-2 focus:ring-white/30"
            required
          />
          <span className="text-white/60 text-sm">
            I agree to the Terms of Service and Privacy Policy
          </span>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-[#0D9488] to-[#0F9D58] text-white hover:from-[#0F766E] hover:to-[#0C8E4F] transition-all shadow-lg flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating Account...' : 'Create Account'}
          {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
        </button>

        <div className="text-center">
          <span className="text-white/60 text-sm">Or sign up with</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            className="py-3 px-4 rounded-xl backdrop-blur-md bg-white/10 border border-white/20 text-white/80 hover:bg-white/20 transition-all"
          >
            Google
          </button>
          <button
            type="button"
            className="py-3 px-4 rounded-xl backdrop-blur-md bg-white/10 border border-white/20 text-white/80 hover:bg-white/20 transition-all"
          >
            Microsoft
          </button>
        </div>
      </form>

      {/* Footer */}
      <div className="backdrop-blur-md bg-white/5 border-t border-white/10 p-6 text-center">
        <p className="text-white/60">
          Already have an account?{' '}
          <button
            onClick={onSwitchToLogin}
            className="text-white hover:text-blue-300 transition-colors"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}