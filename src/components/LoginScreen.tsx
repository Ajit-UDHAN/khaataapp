import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, UserPlus, LogIn, User, KeyRound, CheckCircle, Store, Shield, TrendingUp, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const LoginScreen: React.FC = () => {
  const { login, resetPassword, isLoading } = useAuth();
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const validateForm = () => {
    if (authMode === 'signup') {
      if (!formData.name.trim()) {
        setError('Name is required');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return false;
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        return false;
      }
    }
    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }
    if (authMode === 'signin' && !formData.password) {
      setError('Password is required');
      return false;
    }
    return true;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!validateForm()) return;

    try {
      if (authMode === 'forgot') {
        await resetPassword(formData.email);
        setSuccess('Password reset link sent! Check your email inbox.');
        return;
      }
      if (authMode === 'signup') {
        setSuccess('Creating your account...');
        await login(formData.email, formData.password, formData.name);
      } else {
        await login(formData.email, formData.password);
      }
    } catch (err: any) {
      const message = err?.message || '';
      setSuccess('');
      if (authMode === 'signup') {
        setError(message || 'Unable to create account. Please try again.');
      } else if (authMode === 'forgot') {
        setError(message || 'Unable to send reset link. Please try again.');
      } else {
        if (message.toLowerCase().includes('invalid')) {
          setError('Wrong email or password. If you don\'t have an account yet, tap Sign Up to create one.');
        } else {
          setError(message || 'Unable to sign in. Please check your credentials.');
        }
      }
    }
  };

  const switchAuthMode = (mode: 'signin' | 'signup' | 'forgot') => {
    setAuthMode(mode);
    setError('');
    setSuccess('');
    setFormData({ name: '', email: formData.email, password: '', confirmPassword: '' });
  };

  const isForgotMode = authMode === 'forgot';

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-900 via-gray-800 to-blue-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-600 rounded-full blur-3xl"></div>
        </div>
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <img src="/KHA.jpg" alt="KHAATA" className="w-10 h-10 rounded-xl" />
            <span className="text-xl font-bold tracking-tight">KHAATA</span>
          </div>
          <div>
            <h1 className="text-5xl font-bold leading-tight mb-4">
              Manage your<br />business like a pro.
            </h1>
            <p className="text-gray-400 text-lg max-w-md leading-relaxed">
              Billing, inventory, customers, expenses, and reports — all in one place. Built for Indian shops.
            </p>
            <div className="mt-10 space-y-4">
              {[
                { icon: Zap, text: 'Fast billing with live receipt preview' },
                { icon: TrendingUp, text: 'Real-time profit & loss tracking' },
                { icon: Shield, text: 'Your data is private and secure' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-gray-300">
                  <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-sm">
                    <item.icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-gray-500 text-sm">Trusted by shops across India</p>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <img src="/KHA.jpg" alt="KHAATA" className="w-10 h-10 rounded-xl" />
            <span className="text-xl font-bold tracking-tight text-gray-900">KHAATA</span>
          </div>

          {/* Auth Mode Toggle */}
          {!isForgotMode && (
            <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
              <button
                onClick={() => switchAuthMode('signin')}
                className={`flex-1 flex items-center justify-center py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  authMode === 'signin' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <LogIn className="w-4 h-4 mr-2" />
                Sign In
              </button>
              <button
                onClick={() => switchAuthMode('signup')}
                className={`flex-1 flex items-center justify-center py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  authMode === 'signup' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Sign Up
              </button>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                {isForgotMode ? 'Reset Password' : authMode === 'signin' ? 'Welcome back' : 'Create your account'}
              </h2>
              <p className="text-gray-500 mt-1 text-sm">
                {isForgotMode
                  ? 'Enter your email to receive a reset link'
                  : authMode === 'signin'
                  ? 'Sign in to access your business dashboard'
                  : 'Start managing your business professionally'}
              </p>
            </div>

            {success && (
              <div className="bg-green-50 border border-green-100 rounded-xl p-3 mb-4">
                <p className="text-green-700 text-sm flex items-center">
                  {isForgotMode ? (
                    <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                  ) : (
                    <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin mr-2 flex-shrink-0"></div>
                  )}
                  {success}
                </p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-4">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-4">
              {authMode === 'signup' && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Full Name</label>
                  <div className="relative">
                    <User className="w-4.5 h-4.5 text-gray-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
                    <input type="text" required value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="premium-input pl-11"
                      placeholder="Enter your full name" />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Email Address</label>
                <div className="relative">
                  <Mail className="w-4.5 h-4.5 text-gray-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
                  <input type="email" required value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="premium-input pl-11" placeholder="you@example.com" />
                </div>
              </div>

              {!isForgotMode && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Password</label>
                  <div className="relative">
                    <Lock className="w-4.5 h-4.5 text-gray-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
                    <input type={showPassword ? 'text' : 'password'} required value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      className="premium-input pl-11 pr-11"
                      placeholder={authMode === 'signup' ? 'Min 6 characters' : 'Enter your password'}
                      minLength={authMode === 'signup' ? 6 : undefined} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              )}

              {authMode === 'signup' && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Confirm Password</label>
                  <div className="relative">
                    <Lock className="w-4.5 h-4.5 text-gray-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
                    <input type={showConfirmPassword ? 'text' : 'password'} required value={formData.confirmPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="premium-input pl-11 pr-11" placeholder="Confirm your password" />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              )}

              <button type="submit" disabled={isLoading}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3.5 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center disabled:opacity-50 shadow-sm hover:shadow-md mt-2">
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    {isForgotMode ? 'Send Reset Link' : authMode === 'signin' ? 'Sign In' : 'Create Account'}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 space-y-3 text-center">
              {isForgotMode ? (
                <p className="text-sm text-gray-500">
                  Remember your password?
                  <button onClick={() => switchAuthMode('signin')}
                    className="ml-2 text-gray-900 hover:text-blue-600 font-semibold transition-colors">
                    Back to Sign In
                  </button>
                </p>
              ) : (
                <>
                  <div>
                    <p className="text-sm text-gray-500">
                      {authMode === 'signin' ? "Don't have an account?" : "Already have an account?"}
                      <button onClick={() => switchAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
                        className="ml-2 text-gray-900 hover:text-blue-600 font-semibold transition-colors">
                        {authMode === 'signin' ? 'Sign up' : 'Sign in'}
                      </button>
                    </p>
                  </div>
                  {authMode === 'signin' && (
                    <button onClick={() => switchAuthMode('forgot')}
                      className="text-sm text-gray-400 hover:text-gray-700 font-medium inline-flex items-center transition-colors">
                      <KeyRound className="w-4 h-4 mr-1" />
                      Forgot Password?
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
