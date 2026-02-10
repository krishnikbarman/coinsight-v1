import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase, supabaseConfigValid } from '../supabase/client';
import SupabaseConnectionError from '../components/SupabaseConnectionError';

const Login = () => {
  const navigate = useNavigate();
  const { login, isLoggedIn } = useAuth();
  const [activeTab, setActiveTab] = useState('login'); // 'login' or 'register'
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn) {
      navigate('/dashboard', { replace: true });
    }
  }, [isLoggedIn, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(''); // Clear error on input change
    setSuccess(''); // Clear success on input change
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      if (activeTab === 'login') {
        // Check if Supabase is configured for login
        if (!supabaseConfigValid) {
          setError('Supabase is not configured. Please update your .env file.');
          setIsLoading(false);
          return;
        }

        // Handle Login
        const result = await login(formData.email, formData.password);
        
        if (result.success) {
          navigate('/dashboard');
        } else {
          setError(result.error || 'Invalid credentials');
          setFormData((prev) => ({ ...prev, password: '' }));
        }
      } else {
        // Handle Waitlist - Insert into Supabase
        if (!waitlistEmail || !waitlistEmail.includes('@')) {
          setError('Please enter a valid email address.');
          setIsLoading(false);
          return;
        }

        // Insert email into Supabase waitlist table
        const { error: insertError } = await supabase
          .from('waitlist')
          .insert([{ email: waitlistEmail.toLowerCase() }]);

        if (insertError) {
          // Check if error is due to duplicate email (unique constraint violation)
          if (insertError.code === '23505' || insertError.message?.includes('duplicate') || insertError.message?.includes('unique')) {
            setSuccess('You\'re already on the waitlist.');
          } else {
            setError('Failed to join waitlist. Please try again.');
            console.error('Waitlist insert error:', insertError);
          }
        } else {
          setSuccess('Thanks! We\'ll contact you once CoinSight is available.');
        }
        
        setWaitlistEmail('');
        
        // Auto-hide success message after 5 seconds
        setTimeout(() => {
          setSuccess('');
        }, 5000);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Show connection error if Supabase is not configured (only for login)
  if (!supabaseConfigValid && activeTab === 'login') {
    return <SupabaseConnectionError />;
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Logo/Header */}
      <div className="text-center mb-8 animate-fadeIn">
        <div className="w-20 h-20 bg-gradient-to-br from-neon-blue to-neon-purple rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-neon-blue/50">
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </div>
        <h1 className="text-4xl font-bold text-white mb-2">
          Coin<span className="text-neon-blue">Sight</span>
        </h1>
        <p className="text-gray-400">See Beyond Your Crypto Numbers</p>
      </div>

      {/* Login Card */}
      <div className="bg-dark-secondary/80 backdrop-blur-xl rounded-xl border border-dark-tertiary p-8 shadow-2xl animate-slideUp">
        {/* Tab Switcher */}
        <div className="flex space-x-2 mb-6 bg-dark-tertiary/50 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setError('');
              setSuccess('');
            }}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-all duration-200 ${
              activeTab === 'login'
                ? 'bg-gradient-to-r from-neon-blue to-neon-purple text-white shadow-lg'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setError('');
              setSuccess('');
            }}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-all duration-200 ${
              activeTab === 'register'
                ? 'bg-gradient-to-r from-neon-blue to-neon-purple text-white shadow-lg'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Register
          </button>
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">
            {activeTab === 'login' ? 'Welcome Back' : 'Early Access'}
          </h2>
          <p className="text-gray-400 text-sm">
            {activeTab === 'login'
              ? 'Sign in to access your dashboard'
              : 'Enter your email to get notified when CoinSight opens for users.'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </div>
              <input
                type="email"
                id="email"
                name={activeTab === 'register' ? 'waitlistEmail' : 'email'}
                value={activeTab === 'register' ? waitlistEmail : formData.email}
                onChange={(e) => activeTab === 'register' ? setWaitlistEmail(e.target.value) : handleChange(e)}
                className="w-full pl-10 pr-4 py-3 bg-dark-tertiary border border-dark-tertiary rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-blue transition-colors"
                placeholder="Enter your email"
                required
                autoFocus
              />
            </div>
          </div>

          {/* Password Field - Only show on login tab */}
          {activeTab === 'login' && (
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-12 py-3 bg-dark-tertiary border border-dark-tertiary rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-blue transition-colors"
                  placeholder="Enter your password"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-white transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Remember Me - Only show on login tab */}
          {activeTab === 'login' && (
            <div className="flex items-center">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 bg-dark-tertiary border-dark-tertiary rounded text-neon-blue focus:ring-neon-blue focus:ring-2"
              />
              <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-400">
                Remember me for 30 days
              </label>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-neon-green/10 border border-neon-green/50 rounded-lg p-3 animate-fadeIn">
              <p className="text-neon-green text-sm flex items-center">
                <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {success}
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 animate-fadeIn">
              <p className="text-red-400 text-sm flex items-center">
                <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-neon-blue to-neon-purple text-white font-semibold py-3 rounded-lg hover:shadow-lg hover:shadow-neon-blue/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                {activeTab === 'login' ? 'Signing In...' : 'Joining...'}
              </>
            ) : (
              <>{activeTab === 'login' ? 'Sign In' : 'Join Waitlist'}</>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            {activeTab === 'login' 
              ? 'Powered by Supabase Authentication' 
              : '🎉 Be among the first to experience CoinSight'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
