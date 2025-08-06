import React, { useState } from 'react';
import { Mail, Phone, Lock, Eye, EyeOff, Store, ArrowRight, UserPlus, LogIn, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const LoginScreen: React.FC = () => {
  const { login, loginWithPhone, isLoading } = useAuth();
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    otp: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const validateForm = () => {
    if (authMode === 'signup') {
      if (!formData.name.trim()) {
        setError('Name is required');
        return false;
      }
      if (loginMethod === 'email' && formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return false;
      }
      if (loginMethod === 'email' && formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        return false;
      }
    }
    
    if (loginMethod === 'email' && !formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }
    
    if (loginMethod === 'phone' && formData.phone.length < 10) {
      setError('Please enter a valid phone number');
      return false;
    }
    
    return true;
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!validateForm()) return;

    try {
      if (authMode === 'signup') {
        // For demo purposes, we'll create the account and log them in
        setSuccess('Account created successfully! Logging you in...');
        setTimeout(async () => {
          await login(formData.email, formData.password);
        }, 1000);
      } else {
        await login(formData.email, formData.password);
      }
    } catch (err) {
      if (authMode === 'signup') {
        setError('Failed to create account. Please try again.');
      } else {
        setError('Invalid email or password. If you\'re new, please sign up first.');
      }
    }
  };

  const handlePhoneAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!validateForm()) return;
    
    if (!otpSent) {
      // TODO: Implement real OTP sending
      setError('OTP service not configured. Please use email login or contact administrator to set up SMS service.');
      return;
    }
    
    try {
      await loginWithPhone(formData.phone, formData.otp);
    } catch (err) {
      setError('Invalid OTP. Please try again.');
    }
  };

  const resetPhoneLogin = () => {
    setOtpSent(false);
    setFormData(prev => ({ ...prev, otp: '' }));
  };

  const switchAuthMode = () => {
    setAuthMode(authMode === 'signin' ? 'signup' : 'signin');
    setError('');
    setSuccess('');
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      otp: ''
    });
  };

  const switchLoginMethod = (method: 'email' | 'phone') => {
    setLoginMethod(method);
    setError('');
    setSuccess('');
    setOtpSent(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Store className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ShopManager Pro</h1>
          <p className="text-gray-600">Complete Business Management Solution</p>
        </div>

        {/* Auth Mode Toggle */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-6 shadow-inner">
          <button
            onClick={() => setAuthMode('signin')}
            className={`flex-1 flex items-center justify-center py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-300 ${
              authMode === 'signin'
                ? 'bg-white text-blue-600 shadow-md transform scale-105'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <LogIn className="w-4 h-4 mr-2" />
            Sign In
          </button>
          <button
            onClick={() => setAuthMode('signup')}
            className={`flex-1 flex items-center justify-center py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-300 ${
              authMode === 'signup'
                ? 'bg-white text-blue-600 shadow-md transform scale-105'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Sign Up
          </button>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {authMode === 'signin' ? 'Welcome Back!' : 'Create Account'}
            </h2>
            <p className="text-gray-600 mt-2">
              {authMode === 'signin' 
                ? 'Sign in to access your business dashboard' 
                : 'Join thousands of businesses using ShopManager Pro'
              }
            </p>
          </div>

          {/* Login Method Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
            <button
              onClick={() => switchLoginMethod('email')}
              className={`flex-1 flex items-center justify-center py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                loginMethod === 'email'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Mail className="w-4 h-4 mr-2" />
              Email
            </button>
            <button
              onClick={() => switchLoginMethod('phone')}
              className={`flex-1 flex items-center justify-center py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                loginMethod === 'phone'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Phone className="w-4 h-4 mr-2" />
              Phone
            </button>
          </div>

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <p className="text-green-600 text-sm flex items-center">
                <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                {success}
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Email Form */}
          {loginMethod === 'email' && (
            <form onSubmit={handleEmailAuth} className="space-y-4">
              {authMode === 'signup' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <div className="relative">
                    <User className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your email"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder={authMode === 'signup' ? 'Create a password (min 6 characters)' : 'Enter your password'}
                    minLength={authMode === 'signup' ? 6 : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {authMode === 'signup' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                  <div className="relative">
                    <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              )}
              
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center disabled:opacity-50 transform hover:scale-105 shadow-lg"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    {authMode === 'signin' ? 'Sign In' : 'Create Account'}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Phone Form */}
          {loginMethod === 'phone' && (
            <form onSubmit={handlePhoneAuth} className="space-y-4">
              {authMode === 'signup' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <div className="relative">
                    <User className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <div className="relative">
                  <Phone className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="+91 98765 43210"
                    disabled={otpSent}
                  />
                </div>
              </div>
              
              {otpSent && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Enter OTP</label>
                  <input
                    type="text"
                    required
                    value={formData.otp}
                    onChange={(e) => setFormData(prev => ({ ...prev, otp: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg tracking-widest transition-all duration-200"
                    placeholder="123456"
                    maxLength={6}
                  />
                  <p className="text-sm text-gray-600 mt-2 text-center">
                    OTP sent to {formData.phone}.{' '}
                    <button
                      type="button"
                      onClick={resetPhoneLogin}
                      className="text-blue-600 hover:text-blue-800 font-medium underline"
                    >
                      Change number
                    </button>
                  </p>
                </div>
              )}
              
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center disabled:opacity-50 transform hover:scale-105 shadow-lg"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    {otpSent ? 'Verify OTP' : (authMode === 'signin' ? 'Send OTP' : 'Create Account & Send OTP')}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Switch Auth Mode */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {authMode === 'signin' ? "Don't have an account?" : "Already have an account?"}
              <button
                onClick={switchAuthMode}
                className="ml-2 text-blue-600 hover:text-blue-800 font-semibold underline transition-colors duration-200"
              >
                {authMode === 'signin' ? 'Sign up here' : 'Sign in here'}
              </button>
            </p>
          </div>

          {/* Demo Info */}
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
            <div className="text-center">
              <h4 className="text-sm font-semibold text-blue-800 mb-2">🚀 Getting Started</h4>
              <div className="space-y-1 text-xs text-blue-700">
                <p><strong>New Users:</strong> Click "Sign Up" and create your account</p>
                <p><strong>Existing Users:</strong> Click "Sign In" with your credentials</p>
                <p><strong>Demo:</strong> Use any email/password to try the system</p>
              </div>
              <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-xs text-yellow-800">
                  ⚠️ <strong>Note:</strong> Phone OTP requires SMS service setup (see README)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-600">
            Secure & Professional Business Management Platform
          </p>
          <div className="flex items-center justify-center mt-2 space-x-4 text-xs text-gray-500">
            <span>✅ Data Security</span>
            <span>✅ Multi-User Support</span>
            <span>✅ Cloud Backup</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;